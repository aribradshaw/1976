import { GameState, CampaignAction, PollingData, Candidate, CampaignActivity, CampaignEvent, FundraisingBooth, MicrogroupRelationships } from '../types/game';
import { StateData } from '../types/game';
import { getAllStates } from '../states/index';
import { initializeRelationships, applyTopicRelationshipChanges, calculateTopicRelationshipChange } from './relationshipCalculator';
import { TopicId, Microgroup, TOPIC_RATINGS, TOPICS } from '../data/topics';
import { gameLogger } from '../utils/gameLogger';
import { calculateDetailedDemographics } from '../utils/demographics';
import { SeededRng } from './simulation/rng';

export class GameEngine {
  private gameState: GameState;
  private states: Map<string, StateData>;
  private rng: SeededRng;

  constructor(
    playerCandidate: Candidate = 'democrat',
    difficulty: 'easy' | 'medium' | 'hard' = 'medium',
    seed: number | string = `${playerCandidate}:${difficulty}:${Date.now()}`,
  ) {
    this.rng = new SeededRng(seed);
    this.states = new Map();
    const allStates = getAllStates();
    allStates.forEach(state => {
      this.states.set(state.abbreviation, state);
    });

    this.gameState = this.initializeGame(playerCandidate, difficulty);
    
    // Start game logging
    gameLogger.startGame(difficulty, playerCandidate);
  }

  // Calculate the Tuesday for a given week (25 weeks before Nov 2, 1976)
  // Week 1 is the first Tuesday, Week 25 is Nov 2, 1976 (election day)
  private getTuesdayForWeek(week: number): Date {
    const electionDate = new Date(1976, 10, 2); // Nov 2, 1976 (month is 0-indexed, so 10 = November)
    const totalWeeks = 25;
    const weeksBeforeElection = totalWeeks - week;
    
    // Start from election date and go backwards
    const date = new Date(electionDate);
    date.setDate(date.getDate() - (weeksBeforeElection * 7));
    
    // Nov 2, 1976 was a Tuesday, so we're already on a Tuesday
    // Just ensure we're on the right Tuesday
    const dayOfWeek = date.getDay();
    const daysToTuesday = (2 - dayOfWeek + 7) % 7;
    date.setDate(date.getDate() + daysToTuesday);
    
    return date;
  }

  private initializeGame(playerCandidate: Candidate, difficulty: 'easy' | 'medium' | 'hard'): GameState {
    const polling = new Map<string, PollingData>();
    
    // Initialize polling for all states based on historical data
    // Ensure at least 30% of Americans overall are undecided
    this.states.forEach((state, abbrev) => {
      const baseDem = state.demographics.democraticBase;
      const baseRep = state.demographics.republicanBase;
      const marginOfError = this.getRandomMarginOfError();
      
      // Start with base percentages, but ensure total doesn't exceed 70%
      // This leaves at least 30% undecided in each state (and overall)
      let demSupport = Math.max(0, Math.min(100, baseDem + (this.rng.next() - 0.5) * 10));
      let repSupport = Math.max(0, Math.min(100, baseRep + (this.rng.next() - 0.5) * 10));
      
      // Ensure at least 30% undecided (dem + rep <= 70%)
      const totalDecided = demSupport + repSupport;
      if (totalDecided > 70) {
        // Scale down proportionally to ensure 30% undecided minimum
        const scaleFactor = 70 / totalDecided;
        demSupport = demSupport * scaleFactor;
        repSupport = repSupport * scaleFactor;
      }
      
      // Final normalization: ensure dem + rep <= 100% (undecided = 100% - dem - rep)
      const finalTotal = demSupport + repSupport;
      if (finalTotal > 100) {
        const finalScale = 100 / finalTotal;
        demSupport = demSupport * finalScale;
        repSupport = repSupport * finalScale;
      }
      
      // Initialize turnout rate based on historical data, capped between 40% and 95%
      const initialTurnoutRate = Math.max(40, Math.min(95, state.historicalData.turnoutRate));
      
      polling.set(abbrev, {
        state: abbrev,
        democraticSupport: demSupport,
        republicanSupport: repSupport,
        marginOfError,
        lastUpdated: 0,
        turnoutRate: initialTurnoutRate,
      });
    });

    const electionDate = new Date(1976, 10, 2); // Nov 2, 1976
    const currentDate = this.getTuesdayForWeek(1);

    // Initialize microgroup relationships for all states (all start at 5 = neutral)
    const microgroupRelationships = new Map<string, MicrogroupRelationships>();
    const fundraisingPotential = new Map<string, number>();
    const stateMomentum = new Map<string, number>();
    const opponentStateMomentum = new Map<string, number>();
    
    this.states.forEach((state, abbrev) => {
      microgroupRelationships.set(abbrev, initializeRelationships());
      fundraisingPotential.set(abbrev, 100);  // Start at 100%
      // Initialize momentum with random value between 0 and 3 for each state
      const initialMomentum = this.rng.next() * 3; // Random between 0 and 3
      stateMomentum.set(abbrev, initialMomentum);
      opponentStateMomentum.set(abbrev, initialMomentum);
    });

    return {
      simulationSeed: this.rng.seed,
      currentWeek: 1,
      totalWeeks: 25,
      currentDate,
      electionDate,
      playerCandidate,
      resources: {
        funds: 5000000, // Starting funds: $5M
        actionsRemaining: 6, // 6 actions per week
        energy: 100,
        weeklyFundraising: 0,
      },
      stateMomentum,
      opponentStateMomentum,
      polling,
      electoralVotes: {
        democrat: 0,
        republican: 0,
      },
      actionsThisWeek: [],
      campaignActivities: new Map<string, CampaignActivity[]>(),
      campaignEvents: new Map<string, CampaignEvent[]>(),
      fundraisingBooths: [],
      microgroupRelationships,
      fundraisingPotential,
      topicPositions: new Map<string, 'for' | 'against'>(),
      opponentTopicPositions: new Map<string, 'for' | 'against'>(),
      gameStatus: 'playing',
      difficulty,
    };
  }

  private getRandomMarginOfError(): number {
    // Returns a margin of error between 3% and 10%
    return 3 + this.rng.next() * 7;
  }

  /**
   * Calculate overall momentum from state momentum weighted by registered voters
   */
  getOverallMomentum(): number {
    let totalWeightedMomentum = 0;
    let totalWeight = 0;
    
    this.gameState.stateMomentum.forEach((momentum, stateAbbrev) => {
      const state = this.states.get(stateAbbrev);
      if (state) {
        const weight = state.population.registeredVoters;
        totalWeightedMomentum += momentum * weight;
        totalWeight += weight;
      }
    });
    
    if (totalWeight === 0) return 0;
    return totalWeightedMomentum / totalWeight;
  }

  getGameState(): GameState {
    // Deep copy the game state, including Maps
    return {
      ...this.gameState,
      polling: new Map(this.gameState.polling),
      campaignActivities: new Map(this.gameState.campaignActivities),
      campaignEvents: new Map(this.gameState.campaignEvents),
      fundraisingBooths: [...this.gameState.fundraisingBooths],
      microgroupRelationships: new Map(this.gameState.microgroupRelationships),
      fundraisingPotential: new Map(this.gameState.fundraisingPotential),
      topicPositions: new Map(this.gameState.topicPositions),
      opponentTopicPositions: new Map(this.gameState.opponentTopicPositions),
      stateMomentum: new Map(this.gameState.stateMomentum),
      opponentStateMomentum: new Map(this.gameState.opponentStateMomentum),
    };
  }

  setTopicPosition(topicId: string, position: 'for' | 'against'): void {
    this.gameState.topicPositions.set(topicId, position);
  }

  getStateData(abbreviation: string): StateData | undefined {
    return this.states.get(abbreviation);
  }

  getAllStates(): StateData[] {
    return Array.from(this.states.values());
  }
  
  getStateActivities(stateAbbreviation: string): CampaignActivity[] {
    return this.gameState.campaignActivities.get(stateAbbreviation) || [];
  }

  getStateEvents(stateAbbreviation: string): CampaignEvent[] {
    return this.gameState.campaignEvents.get(stateAbbreviation) || [];
  }
  
  /**
   * Get all opponent events from a specific week
   */
  getOpponentEventsForWeek(week: number): CampaignEvent[] {
    const allEvents: CampaignEvent[] = [];
    this.gameState.campaignEvents.forEach((events) => {
      events.forEach(event => {
        if (event.isOpponent && event.week === week && event.state !== 'NATIONAL') {
          allEvents.push(event);
        }
      });
    });
    return allEvents;
  }
  
  /**
   * Get opponent's weekly interview event for a specific week
   */
  getOpponentInterviewForWeek(week: number): CampaignEvent | null {
    const nationalEvents = this.gameState.campaignEvents.get('NATIONAL') || [];
    const interviewEvent = nationalEvents.find(event => 
      event.isOpponent && 
      event.week === week && 
      event.state === 'NATIONAL' &&
      event.adTopic // Interview events have adTopic set
    );
    return interviewEvent || null;
  }
  
  getStatesWonByParty(): { democrat: string[], republican: string[] } {
    // Use the same logic as getStateColor to match what's shown on the map
    const demStates: string[] = [];
    const repStates: string[] = [];
    
    this.gameState.polling.forEach((polling, abbrev) => {
      const state = this.states.get(abbrev);
      if (!state) return;
      
      const demSupport = polling.democraticSupport;
      const repSupport = polling.republicanSupport;
      const undecidedPct = Math.max(0, 100 - demSupport - repSupport);
      
      // Check if undecideds have plurality (grey state) - exclude from lists
      if (undecidedPct > demSupport && undecidedPct > repSupport) {
        return; // Grey state, exclude
      }
      
      const margin = demSupport - repSupport;
      const absMargin = Math.abs(margin);
      
      // Determine who has plurality
      const demHasPlurality = demSupport > repSupport;
      const repHasPlurality = repSupport > demSupport;
      
      // Only include states that are clearly won (margin > 5), matching map color logic
      // Exclude purple/swing states (margin <= 5)
      if (demHasPlurality && absMargin > 5) {
        // Clearly Democratic (blue on map)
        demStates.push(abbrev);
      } else if (repHasPlurality && absMargin > 5) {
        // Clearly Republican (red on map)
        repStates.push(abbrev);
      }
      // Otherwise it's a swing/purple state (margin <= 5) - exclude
    });
    
    return { democrat: demStates, republican: repStates };
  }
  
  // Calculate fundraising amount for a state without executing the action
  calculateFundraisingAmount(stateAbbreviation: string): number {
    const state = this.states.get(stateAbbreviation);
    if (!state) return 0;
    
    const currentPotential = this.gameState.fundraisingPotential.get(stateAbbreviation) || 100;
    const baseAmount = 500000 + this.rng.next() * 500000; // $500K - $1M
    
    // Normalize by registered voters (reference: 2.5M registered voters = 1.0 multiplier)
    // Smaller states will have proportionally lower fundraising
    const referenceVoters = 2500000; // Medium-sized state reference
    const voterMultiplier = state.population.registeredVoters / referenceVoters;
    
    const fundraisingAmount = baseAmount * state.campaignModifiers.fundraisingPotential * (currentPotential / 100) * voterMultiplier;
    
    return fundraisingAmount;
  }

  getProjectedElectoralVotes(): { democrat: number, republican: number } {
    // Use the same logic as getStateColor to match what's shown on the map
    // Count states that are clearly blue or red (margin > 5), excluding grey and purple
    let demVotes = 0;
    let repVotes = 0;
    
    this.gameState.polling.forEach((polling, abbrev) => {
      const state = this.states.get(abbrev);
      if (!state) return;
      
      const demSupport = polling.democraticSupport;
      const repSupport = polling.republicanSupport;
      const undecidedPct = Math.max(0, 100 - demSupport - repSupport);
      
      // Check if undecideds have plurality (grey state) - exclude from count
      if (undecidedPct > demSupport && undecidedPct > repSupport) {
        return; // Grey state, don't count
      }
      
      const margin = demSupport - repSupport;
      const absMargin = Math.abs(margin);
      
      // Determine who has plurality
      const demHasPlurality = demSupport > repSupport;
      const repHasPlurality = repSupport > demSupport;
      
      // Only count states that are clearly won (margin > 5), matching map color logic
      // Exclude purple/swing states (margin <= 5)
      if (demHasPlurality && absMargin > 5) {
        // Clearly Democratic (blue on map)
        demVotes += state.electoralVotes;
      } else if (repHasPlurality && absMargin > 5) {
        // Clearly Republican (red on map)
        repVotes += state.electoralVotes;
      }
      // Otherwise it's a swing/purple state (margin <= 5) - don't count
    });
    
    return { democrat: demVotes, republican: repVotes };
  }
  
  private addCampaignActivity(stateAbbreviation: string, activity: CampaignActivity): void {
    const activities = this.gameState.campaignActivities.get(stateAbbreviation) || [];
    
    // Prevent duplicate HQs for the same actor in the same state
    if (activity.type === 'hq' && activity.actor) {
      // Remove any existing HQ for this actor in this state
      const filteredActivities = activities.filter(a => !(a.type === 'hq' && a.actor === activity.actor));
      filteredActivities.push(activity);
      this.gameState.campaignActivities.set(stateAbbreviation, filteredActivities);
    } else {
      activities.push(activity);
      this.gameState.campaignActivities.set(stateAbbreviation, activities);
    }
  }

  removeAction(index: number): boolean {
    if (this.gameState.gameStatus !== 'playing') {
      return false;
    }
    
    if (index < 0 || index >= this.gameState.actionsThisWeek.length) {
      return false;
    }
    
    const removedAction = this.gameState.actionsThisWeek[index];
    
    // Refund the cost
    this.gameState.resources.funds += removedAction.cost;
    
    // Remove the action
    this.gameState.actionsThisWeek.splice(index, 1);
    
    // Restore an action slot
    this.gameState.resources.actionsRemaining += 1;
    
    return true;
  }

  executeAction(action: CampaignAction): boolean {
    if (this.gameState.gameStatus !== 'playing') {
      return false;
    }

    if (this.gameState.resources.actionsRemaining <= 0) {
      return false;
    }

    // All actions now require a target state
    if (!action.targetState) {
      return false;
    }

    // Check if we have enough funds
    if (this.gameState.resources.funds < action.cost) {
      return false;
    }

    // A weekly plan can contain only one instance of an action type per state.
    // Effects are resolved together at endTurn, so validation must include the queue.
    if (this.gameState.actionsThisWeek.some(
      queued => queued.type === action.type && queued.targetState === action.targetState
    )) {
      return false;
    }

    // Validate action-specific requirements
    if (action.type === 'launch_ads' && !action.adTopic) {
      return false; // Ads require a topic
    }
    
    // Check if an ad already exists for this topic in this state
    // Prevent ANY duplicate ads for the same topic in the same state (no upgrades allowed)
    if (action.type === 'launch_ads' && action.adTopic) {
      const activities = this.gameState.campaignActivities.get(action.targetState) || [];
      const existingAd = activities.find(a => a.type === 'ads' && a.adTopic === action.adTopic);
      
      if (existingAd) {
        // Ad already exists for this topic in this state - prevent any duplicate
        return false;
      }
    }
    
    if (action.type === 'rally' && (!action.rallyTopics || action.rallyTopics.length !== 3)) {
      return false; // Rally requires exactly 3 topics
    }
    
    if (action.type === 'campaign_hq' && (!action.hqLevel || action.hqLevel < 1 || action.hqLevel > 5)) {
      return false; // HQ requires level 1-5
    }
    
    // Validate HQ level progression - must be exactly 1 level higher than current
    if (action.type === 'campaign_hq' && action.hqLevel) {
      const activities = this.gameState.campaignActivities.get(action.targetState) || [];
      // Check player's HQ (not opponent's)
      const existingHQ = activities.find(a => a.type === 'hq' && a.actor === 'player');
      const currentLevel = existingHQ?.hqLevel || 0;
      const expectedLevel = currentLevel + 1;
      
      // HQ level must be exactly 1 level higher than current (or level 1 if no HQ exists)
      if (action.hqLevel !== expectedLevel) {
        return false; // Invalid HQ level progression
      }
      
      // Prevent upgrading beyond max level
      if (action.hqLevel > 5) {
        return false; // Cannot exceed max level
      }
    }

    // Reserve the resources now, but do not mutate campaign state until the week resolves.
    this.gameState.resources.funds -= action.cost;
    this.gameState.resources.actionsRemaining -= 1;
    this.gameState.actionsThisWeek.push({ ...action });

    return true;
  }

  private resolvePlayerAction(action: CampaignAction): void {
    const beforePolling = this.gameState.polling.get(action.targetState);
    const beforeMomentum = {
      player: this.gameState.stateMomentum.get(action.targetState) || 0,
      opponent: this.gameState.opponentStateMomentum.get(action.targetState) || 0,
    };
    const beforeRelationships = this.gameState.microgroupRelationships.get(action.targetState);

    this.applyActionEffects(action);

    // Capture AFTER state for logging
    const afterPolling = this.gameState.polling.get(action.targetState);
    const afterMomentum = {
      player: this.gameState.stateMomentum.get(action.targetState) || 0,
      opponent: this.gameState.opponentStateMomentum.get(action.targetState) || 0,
    };
    const afterRelationships = this.gameState.microgroupRelationships.get(action.targetState);
    
    // Log comprehensive action data
    if (beforePolling && afterPolling && beforeRelationships && afterRelationships) {
      const relationshipChanges: Record<string, number> = {};
      Object.keys(beforeRelationships).forEach(key => {
        const beforeValue = beforeRelationships[key as keyof MicrogroupRelationships];
        const afterValue = afterRelationships[key as keyof MicrogroupRelationships];
        relationshipChanges[key] = afterValue - beforeValue;
      });
      
      gameLogger.logAction({
        week: this.gameState.currentWeek,
        actor: 'player',
        actionType: action.type,
        state: action.targetState,
        topicId: action.adTopic,
        position: action.type === 'rally' ? undefined : undefined, // Rally doesn't have position
        campaignSize: action.campaignSize,
        hqLevel: action.hqLevel,
        rallyTopics: action.rallyTopics,
        cost: action.cost,
        stateEffects: [{
          stateAbbrev: action.targetState,
          beforePolling: {
            demSupport: beforePolling.democraticSupport,
            repSupport: beforePolling.republicanSupport,
            turnout: beforePolling.turnoutRate,
          },
          afterPolling: {
            demSupport: afterPolling.democraticSupport,
            repSupport: afterPolling.republicanSupport,
            turnout: afterPolling.turnoutRate,
          },
          beforeMomentum: beforeMomentum,
          afterMomentum: afterMomentum,
          relationshipChanges: relationshipChanges,
        }],
      });
    }

    this.logCampaignEvent(action);
  }

  private logCampaignEvent(action: CampaignAction): void {
    const events = this.gameState.campaignEvents.get(action.targetState) || [];
    
    const event: CampaignEvent = {
      type: action.type,
      state: action.targetState,
      week: action.week,
      description: action.description,
      adTopic: action.adTopic,
      rallyTopics: action.rallyTopics,
      hqLevel: action.hqLevel,
      campaignSize: action.campaignSize,
      isOpponent: false,
    };

    // Add fundraising amount if it's a fundraiser
    // Note: The actual fundraising amount is calculated in applyActionEffects
    // We'll get it from the fundraising booth that was created
    if (action.type === 'large_donor_fundraiser') {
      // Find the fundraising booth for this state to get the actual amount raised
      const booth = this.gameState.fundraisingBooths.find(b => 
        b.state === action.targetState && 
        b.weekCreated === this.gameState.currentWeek
      );
      if (booth) {
        event.fundraisingAmount = booth.initialAmount;
      } else {
        // Fallback to calculation if booth not found yet
        event.fundraisingAmount = this.calculateFundraisingAmount(action.targetState);
      }
    }

    events.push(event);
    this.gameState.campaignEvents.set(action.targetState, events);
  }

  private logOpponentEvent(event: Omit<CampaignEvent, 'isOpponent'>): void {
    const events = this.gameState.campaignEvents.get(event.state) || [];
    
    const opponentEvent: CampaignEvent = {
      ...event,
      isOpponent: true,
    };

    events.push(opponentEvent);
    this.gameState.campaignEvents.set(event.state, events);
  }

  private applyActionEffects(action: CampaignAction): void {
    const state = this.states.get(action.targetState);
    if (!state) return;
    
    const relationships = this.gameState.microgroupRelationships.get(action.targetState);
    if (!relationships) return;
    
    // Handle Large Donor Fundraiser
    if (action.type === 'large_donor_fundraiser') {
      // Get current fundraising potential for this state
      const currentPotential = this.gameState.fundraisingPotential.get(action.targetState) || 100;
      
      // Calculate fundraising amount based on state's base fundraising potential and current dynamic potential
      const quotedAmount = action.fundraisingAmount;
      const baseAmount = quotedAmount == null ? 500000 + this.rng.next() * 500000 : 0;
      
      // Normalize by registered voters (reference: 2.5M registered voters = 1.0 multiplier)
      // Smaller states will have proportionally lower fundraising
      const referenceVoters = 2500000; // Medium-sized state reference
      const voterMultiplier = state.population.registeredVoters / referenceVoters;
      
      const fundraisingAmount = quotedAmount ?? (
        baseAmount * state.campaignModifiers.fundraisingPotential * (currentPotential / 100) * voterMultiplier
      );
      
      // Add immediate funds
      this.gameState.resources.funds += fundraisingAmount;
      
      // Reduce fundraising potential by 50%
      const newPotential = Math.max(0, currentPotential * 0.5);
      this.gameState.fundraisingPotential.set(action.targetState, newPotential);
      
      // Create fundraising booth
      const booth: FundraisingBooth = {
        state: action.targetState,
        weekCreated: this.gameState.currentWeek,
        initialAmount: fundraisingAmount,
        currentWeek: this.gameState.currentWeek,
      };
      this.gameState.fundraisingBooths.push(booth);
      
      // Add campaign activity
      this.addCampaignActivity(action.targetState, {
        type: 'fundraising_booth',
        state: action.targetState,
        weekCreated: this.gameState.currentWeek,
        initialValue: fundraisingAmount,
      });
      
      // Small relationship boost with wealthy donors (slight positive for all groups)
      const updatedRelationships = { ...relationships };
      Object.keys(updatedRelationships).forEach(key => {
        updatedRelationships[key as keyof MicrogroupRelationships] = Math.min(10, 
          updatedRelationships[key as keyof MicrogroupRelationships] + 0.1);
      });
      this.gameState.microgroupRelationships.set(action.targetState, updatedRelationships);
    }
    
    // Handle Launch Ads (with 1 topic)
    if (action.type === 'launch_ads' && action.adTopic) {
      // Check if an ad already exists for this topic in this state
      const activities = this.gameState.campaignActivities.get(action.targetState) || [];
      const existingAd = activities.find(a => a.type === 'ads' && a.adTopic === action.adTopic);
      
      if (existingAd) {
        // Upgrade existing ad to new size
        const oldSize = existingAd.campaignSize || 'small';
        existingAd.campaignSize = action.campaignSize;
        
        // Calculate the relationship change based on the upgrade
        // If upgrading from small to medium, apply medium effects minus small effects
        // If upgrading from medium to large, apply large effects minus medium effects
        const oldMultiplier = oldSize === 'small' ? 1 : oldSize === 'medium' ? 3 : 5;
        const newMultiplier = action.campaignSize === 'small' ? 1 : action.campaignSize === 'medium' ? 3 : 5;
        const upgradeMultiplier = newMultiplier - oldMultiplier;
        
        if (upgradeMultiplier > 0) {
          const position = this.gameState.topicPositions.get(action.adTopic) || 'for';
          const microgroups: Microgroup[] = [
            'hardcore_dem', 'lean_dem', 'swingable_dem',
            'hardcore_rep', 'lean_rep', 'swingable_rep',
            'hardcore_dem_indie', 'lean_dem_indie', 'swingable_indie',
            'lean_rep_indie', 'hardcore_rep_indie',
          ];
          
          const updatedRelationships = { ...relationships };
          microgroups.forEach(mg => {
            const change = calculateTopicRelationshipChange(mg, action.adTopic as TopicId, this.gameState.playerCandidate, position);
            updatedRelationships[mg] = Math.max(1, Math.min(10, updatedRelationships[mg] + change * upgradeMultiplier));
          });
          this.gameState.microgroupRelationships.set(action.targetState, updatedRelationships);
        }
      } else {
        // Create new ad
        this.addCampaignActivity(action.targetState, {
          type: 'ads',
          state: action.targetState,
          weekCreated: this.gameState.currentWeek,
          adTopic: action.adTopic,
          campaignSize: action.campaignSize,
        });
        
        // Update relationships based on ad topic with campaign size multiplier
        const powerMultiplier = action.campaignSize === 'small' ? 1 : action.campaignSize === 'medium' ? 3 : 5;
        const position = this.gameState.topicPositions.get(action.adTopic) || 'for';
        
        const microgroups: Microgroup[] = [
          'hardcore_dem', 'lean_dem', 'swingable_dem',
          'hardcore_rep', 'lean_rep', 'swingable_rep',
          'hardcore_dem_indie', 'lean_dem_indie', 'swingable_indie',
          'lean_rep_indie', 'hardcore_rep_indie',
        ];
        
        const updatedRelationships = { ...relationships };
        microgroups.forEach(mg => {
          const change = calculateTopicRelationshipChange(mg, action.adTopic as TopicId, this.gameState.playerCandidate, position);
          updatedRelationships[mg] = Math.max(1, Math.min(10, updatedRelationships[mg] + change * powerMultiplier));
        });
        this.gameState.microgroupRelationships.set(action.targetState, updatedRelationships);
      }
      
      // Ads also boost momentum (scaled by campaign size)
      // Small: 2, Medium: 6, Large: 10 momentum
      const campaignSize = action.campaignSize || 'small'; // Default to small if not specified
      const momentumMultiplier = campaignSize === 'small' ? 1 : campaignSize === 'medium' ? 3 : 5;
      const momentumBoost = 2 * momentumMultiplier; // Base 2 momentum, scaled by campaign size
      const currentMomentum = this.gameState.stateMomentum.get(action.targetState) || 0;
      this.gameState.stateMomentum.set(action.targetState, Math.min(100, currentMomentum + momentumBoost));
    }
    
    // Handle Campaign HQ (Set Up or Upgrade)
    if (action.type === 'campaign_hq' && action.hqLevel) {
      const activities = this.gameState.campaignActivities.get(action.targetState) || [];
      // Find player's HQ (not opponent's) - there should only be ONE player HQ per state
      const existingHQ = activities.find(a => a.type === 'hq' && a.actor === 'player');
      
      // Validate that we're upgrading correctly (level must be exactly 1 higher than current)
      const currentLevel = existingHQ?.hqLevel || 0;
      const expectedLevel = currentLevel + 1;
      
      if (action.hqLevel !== expectedLevel) {
        // Invalid HQ level - this should have been caught in validation, but double-check
        console.warn(`Invalid HQ level: expected ${expectedLevel}, got ${action.hqLevel}`);
        return;
      }
      
      if (existingHQ) {
        // Upgrade existing player HQ - update the level
        existingHQ.hqLevel = action.hqLevel;
      } else {
        // Create new player HQ - ensure we don't have any duplicate HQs
        // Remove any duplicate HQs for the player (shouldn't happen, but safety check)
        const filteredActivities = activities.filter(a => !(a.type === 'hq' && a.actor === 'player'));
        this.gameState.campaignActivities.set(action.targetState, filteredActivities);
        
        // Create new player HQ
        this.addCampaignActivity(action.targetState, {
          type: 'hq',
          state: action.targetState,
          weekCreated: this.gameState.currentWeek,
          actor: 'player',
          hqLevel: action.hqLevel,
        });
      }
      
      // HQ provides base relationship boost (more for higher levels)
      const hqBoost = action.hqLevel * 0.2; // 0.2 to 1.0 based on level
      const updatedRelationships = { ...relationships };
      Object.keys(updatedRelationships).forEach(key => {
        updatedRelationships[key as keyof MicrogroupRelationships] = Math.min(10,
          updatedRelationships[key as keyof MicrogroupRelationships] + hqBoost);
      });
      this.gameState.microgroupRelationships.set(action.targetState, updatedRelationships);
      
      // HQ also boosts momentum (scaled by population, same as opponent)
      const populationMultiplier = Math.min(2.0, state.population.registeredVoters / 2500000);
      const momentumPerLevel = 0.1 * populationMultiplier;
      const stateMomentumIncrease = action.hqLevel * momentumPerLevel;
      const currentMomentum = this.gameState.stateMomentum.get(action.targetState) || 0;
      this.gameState.stateMomentum.set(action.targetState, Math.min(100, currentMomentum + stateMomentumIncrease));
    }
    
    // Handle Rally (with 3 topics)
    if (action.type === 'rally' && action.rallyTopics && action.rallyTopics.length === 3) {
      // Update relationships based on rally topics
      const updatedRelationships = applyTopicRelationshipChanges(
        relationships,
        action.rallyTopics as TopicId[],
        this.gameState.playerCandidate,
        this.gameState.topicPositions
      );
      this.gameState.microgroupRelationships.set(action.targetState, updatedRelationships);
      
      // Rally also boosts momentum in the target state
      const currentMomentum = this.gameState.stateMomentum.get(action.targetState) || 0;
      this.gameState.stateMomentum.set(action.targetState, Math.min(100, currentMomentum + 2));
    }

    // Note: Polling will be updated once per turn in endTurn(), not after each action
    
    // Reduce energy
    this.gameState.resources.energy = Math.max(0, this.gameState.resources.energy - 5);
  }
  
  private updatePollingFromRelationships(stateAbbreviation: string): void {
    const relationships = this.gameState.microgroupRelationships.get(stateAbbreviation);
    const state = this.states.get(stateAbbreviation);
    const polling = this.gameState.polling.get(stateAbbreviation);
    
    if (!relationships || !state || !polling) return;
    
    // Get player and opponent momentum for turnout effects
    const playerMomentum = this.gameState.stateMomentum.get(stateAbbreviation) || 0;
    const opponentMomentum = this.gameState.opponentStateMomentum.get(stateAbbreviation) || 0;
    
    // Get detailed demographics to weight each microgroup properly
    const demographics = calculateDetailedDemographics(state);
    
    // Relationships represent the net effect of both candidates' actions
    // Higher relationship = more positive about the campaign overall
    // Lower relationship = more negative about the campaign overall
    const isPlayerDem = this.gameState.playerCandidate === 'democrat';
    
    // Calculate support for each microgroup based on relationships
    // Relationship thresholds:
    // - < 3: Very turned off - can switch sides (for swingable) or become undecided
    // - 3-4: Turned off - become undecided
    // - 4-6: Lean toward natural party (can be swayed)
    // - 6-8: Likely support natural party
    // - 8-10: Hardcore support natural party
    
    let demSupport = 0;
    let repSupport = 0;
    let undecidedSupport = 0;
    
    // Process each microgroup with its demographic weight
    const processMicrogroup = (
      relationship: number,
      weight: number,
      isDemGroup: boolean,
      isSwingable: boolean
    ) => {
      // For swingable groups: can switch sides if relationship is very low
      if (isSwingable) {
        if (relationship < 3) {
          // Very turned off - can switch sides
          // If they're a Dem group but relationship is very low, they might switch to Rep
          // If they're a Rep group but relationship is very low, they might switch to Dem
          if (isDemGroup) {
            // Swingable Dem group turned off - can switch to Rep or become undecided
            repSupport += weight * 0.4; // 40% switch to Rep
            undecidedSupport += weight * 0.6; // 60% become undecided
          } else {
            // Swingable Rep group turned off - can switch to Dem or become undecided
            demSupport += weight * 0.4; // 40% switch to Dem
            undecidedSupport += weight * 0.6; // 60% become undecided
          }
        } else if (relationship < 4) {
          // Turned off - become undecided
          undecidedSupport += weight;
        } else if (relationship >= 6) {
          // Strong relationship - support natural party
          if (isDemGroup) {
            demSupport += weight;
          } else {
            repSupport += weight;
          }
        } else if (relationship >= 4) {
          // Lean toward natural party but can be swayed
          if (isDemGroup) {
            demSupport += weight * 0.6; // 60% support, 40% undecided
            undecidedSupport += weight * 0.4;
          } else {
            repSupport += weight * 0.6;
            undecidedSupport += weight * 0.4;
          }
        }
      } else {
        // Hardcore and likely groups: more loyal but can still become undecided if relationship drops
        if (relationship < 3) {
          // Very turned off - become undecided (but don't switch sides)
          undecidedSupport += weight;
        } else if (relationship >= 5) {
          // Support natural party
          if (isDemGroup) {
            demSupport += weight;
          } else {
            repSupport += weight;
          }
        } else {
          // Relationship between 3-5: lean but can become undecided
          if (isDemGroup) {
            demSupport += weight * 0.7;
            undecidedSupport += weight * 0.3;
          } else {
            repSupport += weight * 0.7;
            undecidedSupport += weight * 0.3;
          }
        }
      }
    };
    
    // Process Democratic microgroups
    processMicrogroup(relationships.hardcore_dem, demographics.democrats.hardcore, true, false);
    processMicrogroup(relationships.lean_dem, demographics.democrats.likely, true, false);
    processMicrogroup(relationships.swingable_dem, demographics.democrats.swingable, true, true);
    processMicrogroup(relationships.hardcore_dem_indie, demographics.independents.demHardcore, true, false);
    processMicrogroup(relationships.lean_dem_indie, demographics.independents.demLikely, true, true);
    
    // Process Republican microgroups
    processMicrogroup(relationships.hardcore_rep, demographics.republicans.hardcore, false, false);
    processMicrogroup(relationships.lean_rep, demographics.republicans.likely, false, false);
    processMicrogroup(relationships.swingable_rep, demographics.republicans.swingable, false, true);
    processMicrogroup(relationships.hardcore_rep_indie, demographics.independents.repHardcore, false, false);
    processMicrogroup(relationships.lean_rep_indie, demographics.independents.repLikely, false, true);
    
    // Process swingable independents (they can go either way based on relationships)
    const swingableIndieWeight = demographics.independents.swingable;
    const demRelationship = relationships.swingable_indie;
    // For swingable indies, compare to a neutral baseline
    // If relationship is high (> 6), they lean toward the candidate
    // If relationship is low (< 4), they're undecided
    // If relationship is medium (4-6), they split based on which candidate has better relationship
    if (demRelationship >= 6) {
      // Strong relationship with player (assuming player is Democrat if processing Dem candidate)
      if (isPlayerDem) {
        demSupport += swingableIndieWeight;
      } else {
        // Opponent has strong relationship, but we're processing opponent's effects
        repSupport += swingableIndieWeight;
      }
    } else if (demRelationship < 4) {
      undecidedSupport += swingableIndieWeight;
    } else {
      // Medium relationship: split support
      if (isPlayerDem) {
        demSupport += swingableIndieWeight * 0.5;
        undecidedSupport += swingableIndieWeight * 0.5;
      } else {
        repSupport += swingableIndieWeight * 0.5;
        undecidedSupport += swingableIndieWeight * 0.5;
      }
    }
    
    // Add base undecided from demographics
    undecidedSupport += demographics.undecided;
    
    // Normalize to percentages (demographics should sum to 100%)
    const total = demSupport + repSupport + undecidedSupport;
    if (total > 0) {
      polling.democraticSupport = (demSupport / total) * 100;
      polling.republicanSupport = (repSupport / total) * 100;
    }
    
    // Apply momentum effects on turnout
    const overallMomentum = (playerMomentum + opponentMomentum) / 2;
    const momentumEffect = overallMomentum / 100;
    const turnoutBoost = momentumEffect * 5; // Up to 5% turnout boost
    
    // Base turnout from relationships (higher relationships = higher turnout)
    const avgRelationship = (
      relationships.hardcore_dem + relationships.lean_dem + relationships.swingable_dem +
      relationships.hardcore_rep + relationships.lean_rep + relationships.swingable_rep +
      relationships.hardcore_dem_indie + relationships.lean_dem_indie + relationships.swingable_indie +
      relationships.lean_rep_indie + relationships.hardcore_rep_indie
    ) / 11;
    const relationshipTurnoutChange = (avgRelationship - 5) * 2; // Scale: -10% to +10%
    const baseTurnoutRate = state.historicalData.turnoutRate;
    const newTurnoutRate = baseTurnoutRate + relationshipTurnoutChange + turnoutBoost;
    
    // Cap turnout between 40% and 95% of registered voters
    polling.turnoutRate = Math.max(40, Math.min(95, newTurnoutRate));
    
    polling.lastUpdated = this.gameState.currentWeek;
  }

  /**
   * Update polling for all states based on relationships
   * Called once per turn at the end of the turn, after all actions have been processed
   * Relationships are shared and represent the net effect of both candidates' actions
   */
  private updateAllStatesPolling(): void {
    // Calculate polling for all states in a single pass
    // Relationships represent the net effect of both candidates' actions
    this.gameState.polling.forEach((polling, stateAbbrev) => {
      this.updatePollingFromRelationships(stateAbbrev);
    });
  }

  endTurn(): void {
    if (this.gameState.gameStatus !== 'playing') {
      return;
    }

    // Resolve the player's complete plan first, then let the opponent act in the
    // same weekly resolution window. Removing a queued action before this point
    // has no side effects beyond releasing its reserved cost and action point.
    this.gameState.actionsThisWeek.forEach(action => this.resolvePlayerAction(action));

    // Process opponent actions (AI or random)
    this.processOpponentTurn();

    // Update polling for all states based on relationships (once per turn)
    // This happens after all actions (player and opponent) have been processed
    this.updateAllStatesPolling();

    // Process momentum effects on undecided voters
    this.processMomentumUndecidedConversion();

    // Update polling with natural shifts
    this.updateNaturalPollingShifts();

    // Calculate electoral votes (for in-game projections)
    this.calculateElectoralVotes();

    // Process fundraising booths (donor drip)
    this.processFundraisingBooths();
    
    // Process fundraising potential recovery
    this.processFundraisingPotentialRecovery();
    
    // Process HQ effects (turnout boosts and momentum)
    this.processHQEffects();
    
    // Calculate weekly fundraising
    this.calculateWeeklyFundraising();

    // Preserve a compact replay/debug snapshot before the calendar advances.
    gameLogger.snapshotGameState(this.gameState.currentWeek, this.gameState);

    // Advance to next week (next Tuesday)
    this.gameState.currentWeek += 1;
    this.gameState.currentDate = this.getTuesdayForWeek(this.gameState.currentWeek);
    this.gameState.resources.actionsRemaining = 6;
    this.gameState.resources.energy = Math.min(100, this.gameState.resources.energy + 20);
    this.gameState.actionsThisWeek = [];

    // Add weekly fundraising to funds
    this.gameState.resources.funds += this.gameState.resources.weeklyFundraising;

    // Check win conditions AFTER advancing the week
    // This ensures we check at the end of week 25 (when currentWeek becomes 26)
    this.checkWinConditions();
  }

  /**
   * Apply weekly interview effects to all microgroups in all states (NATIONAL IMPACT)
   * Weekly interviews have a stronger national impact than regular campaign actions
   * @param topicId The topic that was selected
   * @param position The position chosen (for/against)
   */
  applyWeeklyEvent(topicId: string, position: 'for' | 'against'): void {
    // Capture BEFORE state for logging (all states)
    const beforeRelationships: Record<string, Record<string, number>> = {};
    this.gameState.microgroupRelationships.forEach((relationships, stateAbbrev) => {
      beforeRelationships[stateAbbrev] = { ...relationships };
    });
    
    // Lock the position globally (this is the ONLY place positions can be locked)
    this.setTopicPosition(topicId, position);
    
    const microgroups: Microgroup[] = [
      'hardcore_dem',
      'lean_dem',
      'swingable_dem',
      'hardcore_rep',
      'lean_rep',
      'swingable_rep',
      'hardcore_dem_indie',
      'lean_dem_indie',
      'swingable_indie',
      'lean_rep_indie',
      'hardcore_rep_indie',
    ];

    // Calculate impact on different voter groups
    const demGroups = ['hardcore_dem', 'lean_dem', 'swingable_dem', 'hardcore_dem_indie', 'lean_dem_indie'];
    const repGroups = ['hardcore_rep', 'lean_rep', 'swingable_rep', 'lean_rep_indie', 'hardcore_rep_indie'];
    const indieGroups = ['swingable_indie'];
    
    const nationalImpactMultiplier = 2.0; // Weekly interviews have 2x impact
    
    let demImpact = 0;
    let repImpact = 0;
    let indieImpact = 0;
    
    demGroups.forEach(mg => {
      const baseChange = calculateTopicRelationshipChange(mg as Microgroup, topicId as TopicId, this.gameState.playerCandidate, position);
      demImpact += baseChange * nationalImpactMultiplier;
    });
    demImpact = demImpact / demGroups.length;
    
    repGroups.forEach(mg => {
      const baseChange = calculateTopicRelationshipChange(mg as Microgroup, topicId as TopicId, this.gameState.playerCandidate, position);
      repImpact += baseChange * nationalImpactMultiplier;
    });
    repImpact = repImpact / repGroups.length;
    
    indieGroups.forEach(mg => {
      const baseChange = calculateTopicRelationshipChange(mg as Microgroup, topicId as TopicId, this.gameState.playerCandidate, position);
      indieImpact += baseChange * nationalImpactMultiplier;
    });
    indieImpact = indieImpact / indieGroups.length;

    // Apply relationship changes to ALL states (NATIONAL IMPACT)
    // Weekly interviews have 2x the impact of regular campaign actions
    const afterRelationships: Record<string, Record<string, number>> = {};
    
    this.gameState.microgroupRelationships.forEach((relationships, stateAbbrev) => {
      const updated: MicrogroupRelationships = { ...relationships };
      
      microgroups.forEach(microgroup => {
        const baseChange = calculateTopicRelationshipChange(
          microgroup,
          topicId as TopicId,
          this.gameState.playerCandidate,
          position
        );
        
        // Apply national impact multiplier (weekly interviews have stronger effect)
        const change = baseChange * nationalImpactMultiplier;
        
        // Apply the change (capped at 1-10)
        updated[microgroup] = Math.max(1, Math.min(10, updated[microgroup] + change));
      });
      
      this.gameState.microgroupRelationships.set(stateAbbrev, updated);
      afterRelationships[stateAbbrev] = { ...updated };
      
      // Note: Polling will be updated once per turn in endTurn(), not after each action
    });
    
    // Log player's weekly interview
    gameLogger.logAction({
      week: this.gameState.currentWeek,
      actor: 'player',
      actionType: 'weekly_interview',
      state: 'NATIONAL',
      topicId: topicId,
      position: position,
      nationalEffects: {
        beforeRelationships: beforeRelationships,
        afterRelationships: afterRelationships,
        impactOnGroups: {
          democrats: demImpact,
          republicans: repImpact,
          independents: indieImpact,
        },
      },
    });
  }
  
  /**
   * Get the number of locked topic positions
   */
  getLockedTopicCount(): number {
    return this.gameState.topicPositions.size;
  }
  
  /**
   * Process opponent's weekly interview answer
   * The opponent answers one question per turn to help their base support
   * Weekly interviews have national impact on all subgroups in all states
   */
  private processOpponentWeeklyEvent(opponentCandidate: Candidate): void {
    // Get available topics (not yet locked by opponent)
    const lockedTopics = Array.from(this.gameState.opponentTopicPositions.keys());
    const availableTopics = TOPICS
      .map(t => t.id)
      .filter(topicId => !lockedTopics.includes(topicId));
    
    if (availableTopics.length === 0) {
      // All topics are locked, no event to answer
      return;
    }
    
    // Get opponent's base microgroups
    const baseGroups = opponentCandidate === 'democrat' 
      ? ['hardcore_dem', 'lean_dem', 'swingable_dem', 'hardcore_dem_indie', 'lean_dem_indie']
      : ['hardcore_rep', 'lean_rep', 'swingable_rep', 'lean_rep_indie', 'hardcore_rep_indie'];
    
    // Score each available topic based on how much it would help opponent's base
    const topicScores = availableTopics.map(topicId => {
      let baseScore = 0;
      baseGroups.forEach(mg => {
        const rating = TOPIC_RATINGS[mg as Microgroup][topicId];
        baseScore += rating;
      });
      const avgBaseRating = baseScore / baseGroups.length;
      
      // Calculate score for "for" position
      let forScore = 0;
      baseGroups.forEach(mg => {
        const rating = TOPIC_RATINGS[mg as Microgroup][topicId];
        // Higher rating = better for "for" position
        forScore += rating;
      });
      
      // Calculate score for "against" position (inverse)
      let againstScore = 0;
      baseGroups.forEach(mg => {
        const rating = TOPIC_RATINGS[mg as Microgroup][topicId];
        // Lower rating = better for "against" position
        againstScore += (10 - rating);
      });
      
      return {
        topicId,
        forScore,
        againstScore,
        avgBaseRating
      };
    });
    
    // Choose the topic that helps the base the most
    topicScores.sort((a, b) => {
      const aMax = Math.max(a.forScore, a.againstScore);
      const bMax = Math.max(b.forScore, b.againstScore);
      return bMax - aMax;
    });
    
    const chosenTopic = topicScores[0];
    if (!chosenTopic) return;
    
    // Choose position that helps base more
    const position: 'for' | 'against' = chosenTopic.forScore > chosenTopic.againstScore ? 'for' : 'against';
    
    // Calculate impact on different voter groups for news ticker
    const demGroups = ['hardcore_dem', 'lean_dem', 'swingable_dem', 'hardcore_dem_indie', 'lean_dem_indie'];
    const repGroups = ['hardcore_rep', 'lean_rep', 'swingable_rep', 'lean_rep_indie', 'hardcore_rep_indie'];
    const indieGroups = ['swingable_indie'];
    
    const nationalImpactMultiplier = 2.0; // Weekly interviews have 2x impact
    
    let demImpact = 0;
    let repImpact = 0;
    let indieImpact = 0;
    
    demGroups.forEach(mg => {
      const baseChange = calculateTopicRelationshipChange(mg as Microgroup, chosenTopic.topicId as TopicId, opponentCandidate, position);
      demImpact += baseChange * nationalImpactMultiplier;
    });
    demImpact = demImpact / demGroups.length;
    
    repGroups.forEach(mg => {
      const baseChange = calculateTopicRelationshipChange(mg as Microgroup, chosenTopic.topicId as TopicId, opponentCandidate, position);
      repImpact += baseChange * nationalImpactMultiplier;
    });
    repImpact = repImpact / repGroups.length;
    
    indieGroups.forEach(mg => {
      const baseChange = calculateTopicRelationshipChange(mg as Microgroup, chosenTopic.topicId as TopicId, opponentCandidate, position);
      indieImpact += baseChange * nationalImpactMultiplier;
    });
    indieImpact = indieImpact / indieGroups.length;
    
    // Apply the weekly interview (this locks the position globally, national impact)
    this.applyOpponentWeeklyEvent(chosenTopic.topicId, position, opponentCandidate);
    
    // Log the opponent's weekly interview event (store in a special "national" state)
    const topic = TOPICS.find(t => t.id === chosenTopic.topicId);
    const topicName = topic ? topic.name : chosenTopic.topicId;
    const positionLabel = position === 'for' ? 'FOR' : 'AGAINST';
    
    // Store interview event with impact data (we'll use a special key for national events)
    const interviewEvent: CampaignEvent = {
      type: 'rally', // Reuse rally type for now, but we'll check for interview-specific data
      state: 'NATIONAL', // Special marker for national events
      week: this.gameState.currentWeek,
      description: `Weekly Interview: ${positionLabel} ${topicName}`,
      isOpponent: true,
      adTopic: chosenTopic.topicId, // Reuse adTopic field to store interview topic
      campaignSize: position === 'for' ? 'small' : 'medium', // Reuse to store position (for='small', against='medium')
      // Store impact in rallyTopics array as stringified numbers [dem, rep, indie]
      rallyTopics: [`${demImpact.toFixed(1)}`, `${repImpact.toFixed(1)}`, `${indieImpact.toFixed(1)}`],
    };
    
    // Store in campaignEvents under a special "NATIONAL" key
    const nationalEvents = this.gameState.campaignEvents.get('NATIONAL') || [];
    nationalEvents.push(interviewEvent);
    this.gameState.campaignEvents.set('NATIONAL', nationalEvents);
  }
  
  /**
   * Apply opponent's weekly interview answer (NATIONAL IMPACT)
   * Similar to applyWeeklyEvent but for the opponent candidate
   * Weekly interviews have 2x the impact of regular campaign actions
   */
  private applyOpponentWeeklyEvent(topicId: string, position: 'for' | 'against', opponentCandidate: Candidate): void {
    // Capture BEFORE state for logging (all states)
    const beforeRelationships: Record<string, Record<string, number>> = {};
    this.gameState.microgroupRelationships.forEach((relationships, stateAbbrev) => {
      beforeRelationships[stateAbbrev] = { ...relationships };
    });
    
    // Lock the position globally for the opponent (separate from player)
    this.gameState.opponentTopicPositions.set(topicId, position);
    
    const microgroups: Microgroup[] = [
      'hardcore_dem',
      'lean_dem',
      'swingable_dem',
      'hardcore_rep',
      'lean_rep',
      'swingable_rep',
      'hardcore_dem_indie',
      'lean_dem_indie',
      'swingable_indie',
      'lean_rep_indie',
      'hardcore_rep_indie',
    ];

    // Calculate impact on different voter groups
    const demGroups = ['hardcore_dem', 'lean_dem', 'swingable_dem', 'hardcore_dem_indie', 'lean_dem_indie'];
    const repGroups = ['hardcore_rep', 'lean_rep', 'swingable_rep', 'lean_rep_indie', 'hardcore_rep_indie'];
    const indieGroups = ['swingable_indie'];
    
    const nationalImpactMultiplier = 2.0; // Weekly interviews have 2x impact
    
    let demImpact = 0;
    let repImpact = 0;
    let indieImpact = 0;
    
    demGroups.forEach(mg => {
      const baseChange = calculateTopicRelationshipChange(mg as Microgroup, topicId as TopicId, opponentCandidate, position);
      demImpact += baseChange * nationalImpactMultiplier;
    });
    demImpact = demImpact / demGroups.length;
    
    repGroups.forEach(mg => {
      const baseChange = calculateTopicRelationshipChange(mg as Microgroup, topicId as TopicId, opponentCandidate, position);
      repImpact += baseChange * nationalImpactMultiplier;
    });
    repImpact = repImpact / repGroups.length;
    
    indieGroups.forEach(mg => {
      const baseChange = calculateTopicRelationshipChange(mg as Microgroup, topicId as TopicId, opponentCandidate, position);
      indieImpact += baseChange * nationalImpactMultiplier;
    });
    indieImpact = indieImpact / indieGroups.length;

    // Apply relationship changes to ALL states (NATIONAL IMPACT)
    // Weekly interviews have 2x the impact of regular campaign actions
    const afterRelationships: Record<string, Record<string, number>> = {};
    
    this.gameState.microgroupRelationships.forEach((relationships, stateAbbrev) => {
      const updated: MicrogroupRelationships = { ...relationships };
      
      microgroups.forEach(microgroup => {
        const baseChange = calculateTopicRelationshipChange(
          microgroup,
          topicId as TopicId,
          opponentCandidate,
          position
        );
        
        // Apply national impact multiplier (weekly interviews have stronger effect)
        const change = baseChange * nationalImpactMultiplier;
        
        // Apply the change (capped at 1-10)
        updated[microgroup] = Math.max(1, Math.min(10, updated[microgroup] + change));
      });
      
      this.gameState.microgroupRelationships.set(stateAbbrev, updated);
      afterRelationships[stateAbbrev] = { ...updated };
      
      // Note: Polling will be updated once per turn in endTurn(), not after each action
    });
    
    // Log opponent's weekly interview
    gameLogger.logAction({
      week: this.gameState.currentWeek,
      actor: 'opponent',
      actionType: 'weekly_interview',
      state: 'NATIONAL',
      topicId: topicId,
      position: position,
      nationalEffects: {
        beforeRelationships: beforeRelationships,
        afterRelationships: afterRelationships,
        impactOnGroups: {
          democrats: demImpact,
          republicans: repImpact,
          independents: indieImpact,
        },
      },
    });
  }
  
  private processFundraisingBooths(): void {
    // Process each fundraising booth and calculate donor drip
    this.gameState.fundraisingBooths = this.gameState.fundraisingBooths.filter(booth => {
      const weeksSinceCreation = this.gameState.currentWeek - booth.weekCreated;
      // Taper off by 1/2 each week
      const currentDrip = booth.initialAmount / Math.pow(2, weeksSinceCreation);
      
      // If drip is less than $1000, remove the booth
      if (currentDrip < 1000) {
        return false;
      }
      
      booth.currentWeek = this.gameState.currentWeek;
      return true;
    });
  }

  private processFundraisingPotentialRecovery(): void {
    // Each week, fundraising potential recovers:
    // +1% if at 100% or above (capped at 125%)
    // +10% if under 100%
    this.gameState.fundraisingPotential.forEach((potential, stateAbbrev) => {
      let newPotential: number;
      if (potential >= 100) {
        // Already at 100% or above: +1% per week, capped at 125%
        newPotential = Math.min(125, potential + 1);
      } else {
        // Under 100%: +10% per week
        newPotential = Math.min(100, potential + 10);
      }
      this.gameState.fundraisingPotential.set(stateAbbrev, newPotential);
    });
  }
  
  private processHQEffects(): void {
    // Process each HQ and apply weekly effects:
    // 1. Turnout boost to the state (based on HQ level)
    // 2. Momentum increase in the state (based on HQ level and state population)
    // Process both player and opponent HQs
    
    // Process player HQs from campaignActivities
    this.gameState.campaignActivities.forEach((activities, stateAbbrev) => {
      const hqActivity = activities.find(a => a.type === 'hq' && a.actor === 'player');
      if (!hqActivity || !hqActivity.hqLevel) {
        return;
      }
      
      const state = this.states.get(stateAbbrev);
      if (!state) {
        return;
      }
      
      const hqLevel = hqActivity.hqLevel;
      
      // 1. Turnout boost: +0.5% per HQ level (capped at 95%)
      const polling = this.gameState.polling.get(stateAbbrev);
      if (polling) {
        const turnoutBoost = hqLevel * 0.5; // 0.5% per level (0.5% to 2.5%)
        polling.turnoutRate = Math.min(95, polling.turnoutRate + turnoutBoost);
      }
      
      // 2. Momentum increase in the state: based on HQ level and state population
      // Use registered voters as a proxy for population importance
      // Normalize to 2.5M reference (California-sized state)
      const populationMultiplier = Math.min(2.0, state.population.registeredVoters / 2500000);
      // Momentum per level: 0.1 to 0.5 points per level, scaled by population
      const momentumPerLevel = 0.1 * populationMultiplier;
      const stateMomentumIncrease = hqLevel * momentumPerLevel;
      
      const currentMomentum = this.gameState.stateMomentum.get(stateAbbrev) || 0;
      this.gameState.stateMomentum.set(stateAbbrev, Math.min(100, currentMomentum + stateMomentumIncrease));
    });
    
    // Process opponent HQs from campaignActivities (opponent HQs are now stored in activities)
    this.gameState.campaignActivities.forEach((activities, stateAbbrev) => {
      const hqActivity = activities.find(a => a.type === 'hq' && a.actor === 'opponent');
      if (!hqActivity || !hqActivity.hqLevel) {
        return;
      }
      
      const state = this.states.get(stateAbbrev);
      if (!state) {
        return;
      }
      
      const hqLevel = hqActivity.hqLevel;
      
      // 1. Turnout boost: +0.5% per HQ level (capped at 95%)
      const polling = this.gameState.polling.get(stateAbbrev);
      if (polling) {
        const turnoutBoost = hqLevel * 0.5; // 0.5% per level (0.5% to 2.5%)
        polling.turnoutRate = Math.min(95, polling.turnoutRate + turnoutBoost);
      }
      
      // 2. Momentum increase in the state: based on HQ level and state population
      // Use registered voters as a proxy for population importance
      // Normalize to 2.5M reference (California-sized state)
      const populationMultiplier = Math.min(2.0, state.population.registeredVoters / 2500000);
      // Momentum per level: 0.1 to 0.5 points per level, scaled by population
      const momentumPerLevel = 0.1 * populationMultiplier;
      const stateMomentumIncrease = hqLevel * momentumPerLevel;
      
      const currentOpponentMomentum = this.gameState.opponentStateMomentum.get(stateAbbrev) || 0;
      this.gameState.opponentStateMomentum.set(stateAbbrev, Math.min(100, currentOpponentMomentum + stateMomentumIncrease));
    });
  }

  private calculateWeeklyFundraising(): void {
    // Base weekly fundraising
    let baseFundraising = 200000; // $200K base
    
    // Modify by overall momentum (weighted by registered voters)
    const overallMomentum = this.getOverallMomentum();
    const momentumMultiplier = 1 + (overallMomentum / 100) * 0.5; // Up to 50% bonus
    baseFundraising *= momentumMultiplier;
    
    // Add projected vote share in states ranked by wealthiest to least wealthy
    // For now, we'll use a simple calculation based on polling and state wealth
    // (We'd need state wealth data for a more accurate calculation)
    let voteShareBonus = 0;
    this.gameState.polling.forEach((polling, stateAbbrev) => {
      const state = this.states.get(stateAbbrev);
      if (state) {
        const isPlayerDem = this.gameState.playerCandidate === 'democrat';
        const playerSupport = isPlayerDem ? polling.democraticSupport : polling.republicanSupport;
        
        // Use electoral votes as a proxy for state wealth/importance
        // More electoral votes = more wealthy donors
        const stateWeight = state.electoralVotes / 10; // Normalize
        voteShareBonus += (playerSupport / 100) * stateWeight * 5000; // $5K per electoral vote per % support
      }
    });
    
    // Add donor drip from fundraising booths
    let donorDrip = 0;
    this.gameState.fundraisingBooths.forEach(booth => {
      const weeksSinceCreation = this.gameState.currentWeek - booth.weekCreated;
      const currentDrip = booth.initialAmount / Math.pow(2, weeksSinceCreation);
      donorDrip += currentDrip;
    });
    
    // Total weekly fundraising
    this.gameState.resources.weeklyFundraising = baseFundraising + voteShareBonus + donorDrip;
  }

  /**
   * Execute opponent HQ action
   */
  private executeOpponentHQ(abbrev: string): void {
    // Capture BEFORE state for logging
    const beforePolling = this.gameState.polling.get(abbrev);
    const beforeMomentum = {
      player: this.gameState.stateMomentum.get(abbrev) || 0,
      opponent: this.gameState.opponentStateMomentum.get(abbrev) || 0,
    };
    const beforeRelationships = this.gameState.microgroupRelationships.get(abbrev);
    
    const activities = this.gameState.campaignActivities.get(abbrev) || [];
    // Find opponent's HQ (not player's)
    const hqActivity = activities.find(a => a.type === 'hq' && a.actor === 'opponent');
    const currentLevel = hqActivity?.hqLevel || 0;
    const nextLevel = Math.min(5, currentLevel + 1);
    
    if (currentLevel < 5) {
      const relationships = this.gameState.microgroupRelationships.get(abbrev);
      if (relationships) {
        const hqBoost = nextLevel * 0.2;
        const updated = { ...relationships };
        Object.keys(updated).forEach(key => {
          updated[key as keyof MicrogroupRelationships] = Math.min(10,
            updated[key as keyof MicrogroupRelationships] + hqBoost);
        });
        this.gameState.microgroupRelationships.set(abbrev, updated);
        
        if (hqActivity) {
          hqActivity.hqLevel = nextLevel;
        } else {
          const activities = this.gameState.campaignActivities.get(abbrev) || [];
          activities.push({
            type: 'hq',
            state: abbrev,
            weekCreated: this.gameState.currentWeek,
            actor: 'opponent',
            hqLevel: nextLevel,
          });
          this.gameState.campaignActivities.set(abbrev, activities);
        }
        
        const state = this.states.get(abbrev);
        this.logOpponentEvent({
          type: 'campaign_hq',
          state: abbrev,
          week: this.gameState.currentWeek,
          description: `${nextLevel === 1 ? 'Set Up' : 'Upgrade'} Campaign HQ Level ${nextLevel} in ${state?.name || abbrev}`,
          hqLevel: nextLevel,
        });
        
        const stateData = this.states.get(abbrev);
        if (stateData) {
          const populationMultiplier = Math.min(2.0, stateData.population.registeredVoters / 2500000);
          const momentumPerLevel = 0.1 * populationMultiplier;
          const stateMomentumIncrease = nextLevel * momentumPerLevel;
          const currentOpponentMomentum = this.gameState.opponentStateMomentum.get(abbrev) || 0;
          this.gameState.opponentStateMomentum.set(abbrev, Math.min(100, currentOpponentMomentum + stateMomentumIncrease));
        }
      }
    }
    
    // Capture AFTER state for logging
    const afterPolling = this.gameState.polling.get(abbrev);
    const afterMomentum = {
      player: this.gameState.stateMomentum.get(abbrev) || 0,
      opponent: this.gameState.opponentStateMomentum.get(abbrev) || 0,
    };
    const afterRelationships = this.gameState.microgroupRelationships.get(abbrev);
    
    // Log comprehensive action data
    if (beforePolling && afterPolling && beforeRelationships && afterRelationships) {
      const relationshipChanges: Record<string, number> = {};
      Object.keys(beforeRelationships).forEach(key => {
        const beforeValue = beforeRelationships[key as keyof MicrogroupRelationships];
        const afterValue = afterRelationships[key as keyof MicrogroupRelationships];
        relationshipChanges[key] = afterValue - beforeValue;
      });
      
      gameLogger.logAction({
        week: this.gameState.currentWeek,
        actor: 'opponent',
        actionType: 'campaign_hq',
        state: abbrev,
        hqLevel: nextLevel,
        stateEffects: [{
          stateAbbrev: abbrev,
          beforePolling: {
            demSupport: beforePolling.democraticSupport,
            repSupport: beforePolling.republicanSupport,
            turnout: beforePolling.turnoutRate,
          },
          afterPolling: {
            demSupport: afterPolling.democraticSupport,
            repSupport: afterPolling.republicanSupport,
            turnout: afterPolling.turnoutRate,
          },
          beforeMomentum: beforeMomentum,
          afterMomentum: afterMomentum,
          relationshipChanges: relationshipChanges,
        }],
      });
    }
  }

  /**
   * Execute opponent ads action
   */
  private executeOpponentAds(abbrev: string, opponentCandidate: Candidate, adTopic: string, campaignSize: 'small' | 'medium' | 'large'): void {
    // Capture BEFORE state for logging
    const beforePolling = this.gameState.polling.get(abbrev);
    const beforeMomentum = {
      player: this.gameState.stateMomentum.get(abbrev) || 0,
      opponent: this.gameState.opponentStateMomentum.get(abbrev) || 0,
    };
    const beforeRelationships = this.gameState.microgroupRelationships.get(abbrev);
    
    const relationships = this.gameState.microgroupRelationships.get(abbrev);
    if (relationships) {
      const powerMultiplier = campaignSize === 'small' ? 1 : campaignSize === 'medium' ? 3 : 5;
      const position = this.gameState.opponentTopicPositions.get(adTopic) || 'for';
      
      const microgroups: Microgroup[] = [
        'hardcore_dem', 'lean_dem', 'swingable_dem',
        'hardcore_rep', 'lean_rep', 'swingable_rep',
        'hardcore_dem_indie', 'lean_dem_indie', 'swingable_indie',
        'lean_rep_indie', 'hardcore_rep_indie',
      ];
      
      const updated = { ...relationships };
      microgroups.forEach(mg => {
        const change = calculateTopicRelationshipChange(mg, adTopic as TopicId, opponentCandidate, position);
        updated[mg] = Math.max(1, Math.min(10, updated[mg] + change * powerMultiplier));
      });
      this.gameState.microgroupRelationships.set(abbrev, updated);
    }
    
    const state = this.states.get(abbrev);
    const topic = TOPICS.find(t => t.id === adTopic);
    const sizeLabel = campaignSize ? ` (${campaignSize.charAt(0).toUpperCase() + campaignSize.slice(1)} Campaign)` : '';
    this.logOpponentEvent({
      type: 'launch_ads',
      state: abbrev,
      week: this.gameState.currentWeek,
      description: `Launch Ads in ${state?.name || abbrev} (${topic?.name || adTopic})${sizeLabel}`,
      adTopic: adTopic,
      campaignSize: campaignSize,
    });
    
    // Ads also boost momentum (scaled by campaign size)
    // Small: 2, Medium: 6, Large: 10 momentum
    const momentumMultiplier = campaignSize === 'small' ? 1 : campaignSize === 'medium' ? 3 : 5;
    const momentumBoost = 2 * momentumMultiplier; // Base 2 momentum, scaled by campaign size
    const currentOpponentMomentum = this.gameState.opponentStateMomentum.get(abbrev) || 0;
    this.gameState.opponentStateMomentum.set(abbrev, Math.min(100, currentOpponentMomentum + momentumBoost));
    
    // Capture AFTER state for logging
    const afterPolling = this.gameState.polling.get(abbrev);
    const afterMomentum = {
      player: this.gameState.stateMomentum.get(abbrev) || 0,
      opponent: this.gameState.opponentStateMomentum.get(abbrev) || 0,
    };
    const afterRelationships = this.gameState.microgroupRelationships.get(abbrev);
    
    // Log comprehensive action data
    if (beforePolling && afterPolling && beforeRelationships && afterRelationships) {
      const relationshipChanges: Record<string, number> = {};
      Object.keys(beforeRelationships).forEach(key => {
        const beforeValue = beforeRelationships[key as keyof MicrogroupRelationships];
        const afterValue = afterRelationships[key as keyof MicrogroupRelationships];
        relationshipChanges[key] = afterValue - beforeValue;
      });
      
      gameLogger.logAction({
        week: this.gameState.currentWeek,
        actor: 'opponent',
        actionType: 'launch_ads',
        state: abbrev,
        topicId: adTopic,
        campaignSize: campaignSize,
        stateEffects: [{
          stateAbbrev: abbrev,
          beforePolling: {
            demSupport: beforePolling.democraticSupport,
            repSupport: beforePolling.republicanSupport,
            turnout: beforePolling.turnoutRate,
          },
          afterPolling: {
            demSupport: afterPolling.democraticSupport,
            repSupport: afterPolling.republicanSupport,
            turnout: afterPolling.turnoutRate,
          },
          beforeMomentum: beforeMomentum,
          afterMomentum: afterMomentum,
          relationshipChanges: relationshipChanges,
        }],
      });
    }
  }

  /**
   * Execute opponent rally action
   */
  private executeOpponentRally(abbrev: string, opponentCandidate: Candidate, rallyTopics: string[]): void {
    // Capture BEFORE state for logging
    const beforePolling = this.gameState.polling.get(abbrev);
    const beforeMomentum = {
      player: this.gameState.stateMomentum.get(abbrev) || 0,
      opponent: this.gameState.opponentStateMomentum.get(abbrev) || 0,
    };
    const beforeRelationships = this.gameState.microgroupRelationships.get(abbrev);
    
    const relationships = this.gameState.microgroupRelationships.get(abbrev);
    if (relationships) {
      const updated = applyTopicRelationshipChanges(
        relationships,
        rallyTopics as TopicId[],
        opponentCandidate,
        this.gameState.opponentTopicPositions
      );
      this.gameState.microgroupRelationships.set(abbrev, updated);
    }
    
    const state = this.states.get(abbrev);
    const topics = rallyTopics.map(topicId => {
      const topic = TOPICS.find(t => t.id === topicId);
      return topic?.name || topicId;
    }).join(', ');
    this.logOpponentEvent({
      type: 'rally',
      state: abbrev,
      week: this.gameState.currentWeek,
      description: `Hold Rally in ${state?.name || abbrev} (${topics})`,
      rallyTopics: rallyTopics,
    });
    
    const currentOpponentMomentum = this.gameState.opponentStateMomentum.get(abbrev) || 0;
    this.gameState.opponentStateMomentum.set(abbrev, Math.min(100, currentOpponentMomentum + 2));
    
    // Capture AFTER state for logging
    const afterPolling = this.gameState.polling.get(abbrev);
    const afterMomentum = {
      player: this.gameState.stateMomentum.get(abbrev) || 0,
      opponent: this.gameState.opponentStateMomentum.get(abbrev) || 0,
    };
    const afterRelationships = this.gameState.microgroupRelationships.get(abbrev);
    
    // Log comprehensive action data
    if (beforePolling && afterPolling && beforeRelationships && afterRelationships) {
      const relationshipChanges: Record<string, number> = {};
      Object.keys(beforeRelationships).forEach(key => {
        const beforeValue = beforeRelationships[key as keyof MicrogroupRelationships];
        const afterValue = afterRelationships[key as keyof MicrogroupRelationships];
        relationshipChanges[key] = afterValue - beforeValue;
      });
      
      gameLogger.logAction({
        week: this.gameState.currentWeek,
        actor: 'opponent',
        actionType: 'rally',
        state: abbrev,
        rallyTopics: rallyTopics,
        stateEffects: [{
          stateAbbrev: abbrev,
          beforePolling: {
            demSupport: beforePolling.democraticSupport,
            repSupport: beforePolling.republicanSupport,
            turnout: beforePolling.turnoutRate,
          },
          afterPolling: {
            demSupport: afterPolling.democraticSupport,
            repSupport: afterPolling.republicanSupport,
            turnout: afterPolling.turnoutRate,
          },
          beforeMomentum: beforeMomentum,
          afterMomentum: afterMomentum,
          relationshipChanges: relationshipChanges,
        }],
      });
    }
  }

  /**
   * Execute opponent fundraiser action
   */
  private executeOpponentFundraiser(abbrev: string): void {
    // Capture BEFORE state for logging
    const beforePolling = this.gameState.polling.get(abbrev);
    const beforeMomentum = {
      player: this.gameState.stateMomentum.get(abbrev) || 0,
      opponent: this.gameState.opponentStateMomentum.get(abbrev) || 0,
    };
    const beforeRelationships = this.gameState.microgroupRelationships.get(abbrev);
    
    const state = this.states.get(abbrev);
    const fundraisingAmount = this.calculateFundraisingAmount(abbrev);
    this.logOpponentEvent({
      type: 'large_donor_fundraiser',
      state: abbrev,
      week: this.gameState.currentWeek,
      description: `Large Donor Fundraiser in ${state?.name || abbrev}`,
      fundraisingAmount,
    });
    
    // Capture AFTER state for logging (fundraisers don't change polling/momentum immediately)
    const afterPolling = this.gameState.polling.get(abbrev);
    const afterMomentum = {
      player: this.gameState.stateMomentum.get(abbrev) || 0,
      opponent: this.gameState.opponentStateMomentum.get(abbrev) || 0,
    };
    const afterRelationships = this.gameState.microgroupRelationships.get(abbrev);
    
    // Log comprehensive action data
    if (beforePolling && afterPolling && beforeRelationships && afterRelationships) {
      const relationshipChanges: Record<string, number> = {};
      Object.keys(beforeRelationships).forEach(key => {
        const beforeValue = beforeRelationships[key as keyof MicrogroupRelationships];
        const afterValue = afterRelationships[key as keyof MicrogroupRelationships];
        relationshipChanges[key] = afterValue - beforeValue;
      });
      
      gameLogger.logAction({
        week: this.gameState.currentWeek,
        actor: 'opponent',
        actionType: 'large_donor_fundraiser',
        state: abbrev,
        cost: fundraisingAmount,
        stateEffects: [{
          stateAbbrev: abbrev,
          beforePolling: {
            demSupport: beforePolling.democraticSupport,
            repSupport: beforePolling.republicanSupport,
            turnout: beforePolling.turnoutRate,
          },
          afterPolling: {
            demSupport: afterPolling.democraticSupport,
            repSupport: afterPolling.republicanSupport,
            turnout: afterPolling.turnoutRate,
          },
          beforeMomentum: beforeMomentum,
          afterMomentum: afterMomentum,
          relationshipChanges: relationshipChanges,
        }],
      });
    }
  }

  private processOpponentTurn(): void {
    const opponentCandidate = this.gameState.playerCandidate === 'democrat' ? 'republican' : 'democrat';
    const difficulty = this.gameState.difficulty;
    
    // First, answer a weekly interview question if available (national impact)
    this.processOpponentWeeklyEvent(opponentCandidate);
    
    // Check if AI is out of money (heuristic: if they've taken many expensive actions)
    // Count expensive actions (ads, HQs) from previous weeks
    let expensiveActionCount = 0;
    this.gameState.campaignActivities.forEach((activities) => {
      activities.forEach(activity => {
        if (activity.type === 'hq' || activity.type === 'ads') {
          expensiveActionCount++;
        }
      });
    });
    
    // Track if AI needs fundraising (will be one of the actions if needed)
    // Note: Fundraising can happen in ANY state, even where opponent is ahead in both polling and momentum,
    // because fundraising is about money, not campaigning. We always pick the best fundraising opportunity.
    // On hard difficulty, be more conservative with fundraising - only when really needed
    // Prioritize HQs and ads over fundraising
    const fundraisingThreshold = difficulty === 'hard' ? 10 : 5; // Hard: only fundraise if 10+ expensive actions
    const needsFundraising = expensiveActionCount > fundraisingThreshold;
    let fundraisingState: string | null = null;
    
    if (needsFundraising) {
      // Find the highest paying state for fundraising (check ALL states, no filtering)
      let bestState = '';
      let bestAmount = 0;
      
      this.states.forEach((state, abbrev) => {
        const amount = this.calculateFundraisingAmount(abbrev);
        if (amount > bestAmount) {
          bestAmount = amount;
          bestState = abbrev;
        }
      });
      
      if (bestState) {
        fundraisingState = bestState;
      }
    }
    
    // Determine which states to target based on difficulty
    let targetStates: string[] = [];
    const allStates = Array.from(this.states.keys());
    
    if (difficulty === 'easy') {
      // Easy: Randomly choose states
      const numActions = this.rng.nextInt(1, 3);
      targetStates = allStates.sort(() => this.rng.next() - 0.5).slice(0, numActions);
    } else if (difficulty === 'medium' || difficulty === 'hard') {
      // Medium & Hard: Prioritize momentum competition and reaching 270 electoral votes
      // Calculate opponent's current projected electoral votes
      const projectedVotes = this.getProjectedElectoralVotes();
      const opponentCurrentVotes = opponentCandidate === 'democrat' 
        ? projectedVotes.democrat 
        : projectedVotes.republican;
      const votesNeeded = Math.max(0, 270 - opponentCurrentVotes);
      
      // Get all states with their electoral votes, momentum, and current status
      const statePriorities = Array.from(this.gameState.polling.entries())
        .map(([abbrev, polling]) => {
          const state = this.states.get(abbrev);
          if (!state) return null;
          
          const demSupport = polling.democraticSupport;
          const repSupport = polling.republicanSupport;
          const margin = Math.abs(demSupport - repSupport);
          const color = this.getStateColor(abbrev);
          
          // Get momentum for both player and opponent
          const playerMomentum = this.gameState.stateMomentum.get(abbrev) || 0;
          const opponentMomentum = this.gameState.opponentStateMomentum.get(abbrev) || 0;
          const momentumDifference = playerMomentum - opponentMomentum;
          
          // Determine who's winning
          const isOpponentWinning = opponentCandidate === 'democrat' 
            ? demSupport > repSupport 
            : repSupport > demSupport;
          
          // Check if opponent is ahead in both polling AND momentum
          // If so, skip this state (opponent doesn't need to act here)
          const isOpponentAheadInMomentum = opponentMomentum > playerMomentum;
          const isOpponentAheadInBoth = isOpponentWinning && isOpponentAheadInMomentum;
          
          // Check if it's a swing state (purple/gray)
          const isSwingState = color === '#7c3aed' || color === '#a855f7' || color === '#8b5cf6' || color === '#808080';
          
          // Calculate priority score balancing electoral votes, winnability, and momentum competition
          // Strategy: Win big states that are close, compete on momentum everywhere, get to 270
          
          // 1. WINNABILITY SCORE: How close is opponent to winning this state?
          // Calculate margin from opponent's perspective
          const opponentSupport = opponentCandidate === 'democrat' ? demSupport : repSupport;
          const playerSupport = opponentCandidate === 'democrat' ? repSupport : demSupport;
          const opponentMargin = opponentSupport - playerSupport; // Positive = opponent winning, negative = opponent losing
          
          // Winnability: States where opponent is close to winning (within 15 points) are valuable
          // Don't waste effort on states that are too far behind (20+ points)
          const maxWinnableMargin = 20; // Don't target states where opponent is 20+ points behind
          const optimalMargin = 5; // Sweet spot: opponent is 5 points behind or ahead
          let winnabilityScore = 0;
          
          if (opponentMargin > -maxWinnableMargin && opponentMargin < maxWinnableMargin) {
            // State is winnable (within 20 points)
            if (opponentMargin < 0) {
              // Opponent is losing but close - HIGH VALUE for flipping
              const marginFromOptimal = Math.abs(opponentMargin - (-optimalMargin));
              winnabilityScore = 100 - (marginFromOptimal * 5); // Closer to optimal = higher score
            } else {
              // Opponent is winning - still valuable to maintain
              winnabilityScore = 50 - (opponentMargin * 2); // Closer margin = higher score
            }
          } else if (opponentMargin <= -maxWinnableMargin) {
            // Opponent is too far behind - low winnability
            winnabilityScore = 10;
          } else {
            // Opponent is way ahead - low priority
            winnabilityScore = 20;
          }
          
          // 2. ELECTORAL VOTE VALUE: Bigger states are more valuable
          // Scale by electoral votes (California = 45, Wyoming = 3)
          const electoralValue = state.electoralVotes * 15; // Base value per electoral vote
          
          // 3. MOMENTUM COMPETITION: Always compete on momentum
          // MOMENTUM IS THE MAIN DRIVER OF POLL CHANGES - prioritize heavily!
          // If opponent can beat player in momentum, it will win more undecided voters each week
          // This compounds over time, so momentum advantage is critical
          let momentumScore = 0;
          if (momentumDifference > 0) {
            // Player has more momentum - CRITICAL to compete and flip it
            // This is where opponent can make the biggest impact on polling
            momentumScore = 300 + (momentumDifference * 6); // Much higher weight for competing
          } else if (momentumDifference < 0) {
            // Opponent has more momentum - maintain and extend advantage
            // Bigger advantage = higher priority (momentum compounds over time)
            momentumScore = 200 - (momentumDifference * 4); // Strong weight for maintaining advantage
          } else {
            // Equal momentum - build advantage (whoever gets ahead wins)
            momentumScore = 150; // High priority to break the tie
          }
          
          // BONUS: If opponent can beat player in momentum AND state is winnable, prioritize even more
          // This is the optimal scenario: momentum advantage + winnable state = guaranteed poll gains
          if (momentumDifference <= 5 && opponentMargin > -15 && opponentMargin < 15) {
            // Opponent can beat player in momentum (within 5 points) AND state is winnable
            momentumScore += 200; // Major bonus for states where momentum advantage can flip the state
          }
          
          // 4. SWING STATE BONUS: Swing states are always valuable
          const swingBonus = isSwingState ? 80 : 0;
          
          // 5. COMBINE SCORES with weighted balance
          // Balance: 30% winnability (flip states), 20% electoral value (big states), 50% momentum (compete)
          // MOMENTUM IS THE MAIN DRIVER - give it the highest weight!
          const winnabilityWeight = 0.3;
          const electoralWeight = 0.2;
          const momentumWeight = 0.5; // Increased from 0.3 to 0.5 - momentum is critical!
          
          let priority = 
            (winnabilityScore * winnabilityWeight) +
            (electoralValue * electoralWeight) +
            (momentumScore * momentumWeight) +
            swingBonus;
          
          // 6. BONUS: If opponent needs votes to reach 270, prioritize states that help
          if (votesNeeded > 0 && !isOpponentWinning && opponentMargin > -15) {
            // Opponent needs votes and this state is winnable
            priority += state.electoralVotes * 2; // Extra boost for states that help reach 270
          }
          
          return {
            abbrev,
            electoralVotes: state.electoralVotes,
            margin,
            isOpponentWinning,
            isSwingState,
            playerMomentum,
            opponentMomentum,
            momentumDifference,
            isOpponentAheadInBoth,
            priority,
          };
        })
        .filter((item): item is NonNullable<typeof item> => item !== null)
        // Filter out states where opponent is ahead in both polling and momentum
        .filter(item => !item.isOpponentAheadInBoth)
        .sort((a, b) => {
          // Sort by priority (highest first)
          if (b.priority !== a.priority) {
            return b.priority - a.priority;
          }
          // If priorities are equal, prefer bigger states
          return b.electoralVotes - a.electoralVotes;
        });
      
      // Select states using the balanced priority system
      // The priority already balances: winnability (30%), electoral value (20%), momentum (50%)
      // MOMENTUM IS THE MAIN DRIVER OF POLL CHANGES - prioritize states where opponent can beat player in momentum!
      // Select enough states - Hard takes more actions than Medium
      const neededCount = difficulty === 'hard' ? 5 : 3; // Hard: 5 states, Medium: 3 states
      
      // Select top priority states (already sorted by priority)
      // This automatically balances:
      // - Big states that are close to winning (California if within 20 points)
      // - Momentum competition (states where player has momentum)
      // - Swing states (always valuable)
      // - States that help reach 270 (if needed)
      targetStates = statePriorities
        .slice(0, neededCount)
        .map(s => s.abbrev);
    }
    
    // First, build HQs - adjust count based on difficulty
    // Hard: More HQs to compete aggressively, Medium: Fewer HQs
    let hqTargetCount: number;
    
    // Give AI extra HQ action if player is ahead by a lot (catch-up mechanic)
    const projectedVotesForHQ = this.getProjectedElectoralVotes();
    const playerVotesForHQ = this.gameState.playerCandidate === 'democrat' 
      ? projectedVotesForHQ.democrat 
      : projectedVotesForHQ.republican;
    
    let extraHQActions = 0;
    // If player has over 270 projected votes, give AI 1 extra HQ action
    if (playerVotesForHQ > 270) {
      extraHQActions += 1;
    }
    // If player has over 350 projected votes, give AI 1 more extra HQ action (2 total)
    if (playerVotesForHQ > 350) {
      extraHQActions += 1; // Additional HQ action on top of the 270+ bonus
    }
    
    if (difficulty === 'hard') {
      // Hard: Very aggressive HQ building - 5 HQs in first 3 weeks, 4-5 after
      // Prioritize building and upgrading HQs for momentum advantage
      // Target 100+ HQs over 25 weeks to compete with player
      hqTargetCount = this.gameState.currentWeek <= 3 ? 5 : 4;
    } else if (difficulty === 'medium') {
      // Medium: 4 HQs in first 3 weeks, 3 after
      hqTargetCount = this.gameState.currentWeek <= 3 ? 4 : 3;
    } else {
      hqTargetCount = this.gameState.currentWeek <= 3 ? 2 : 1; // Easy: 2 HQs in first 3 turns, 1 after
    }
    
    // Add extra HQ actions if player is ahead
    hqTargetCount += extraHQActions;
    const statesWithoutMaxHq = allStates.filter(abbrev => {
      const activities = this.gameState.campaignActivities.get(abbrev) || [];
      // Check opponent's HQ level (not player's)
      const hqActivity = activities.find(a => a.type === 'hq' && a.actor === 'opponent');
      const currentHqLevel = hqActivity?.hqLevel || 0;
      return currentHqLevel < 5;
    });
    
    // Build HQs - prioritize bigger states and swing states for medium/hard difficulty
    const hqTargets: string[] = [];
    
    if (difficulty === 'medium' || difficulty === 'hard') {
      // Strategic HQ placement: Maximize electoral votes and momentum advantage
      // Strategy: Build HQs in states where opponent can win (polling) and gain momentum advantage
      const hqPriorities = statesWithoutMaxHq
        .map(abbrev => {
          const state = this.states.get(abbrev);
          if (!state) return null;
          
          const polling = this.gameState.polling.get(abbrev);
          if (!polling) return null;
          
          const color = this.getStateColor(abbrev);
          const isSwingState = color === '#7c3aed' || color === '#a855f7' || color === '#8b5cf6' || color === '#808080';
          
          // Get momentum for both player and opponent
          const playerMomentum = this.gameState.stateMomentum.get(abbrev) || 0;
          const opponentMomentum = this.gameState.opponentStateMomentum.get(abbrev) || 0;
          const momentumDifference = playerMomentum - opponentMomentum;
          
          // Determine who's winning in polling
          const demSupport = polling.democraticSupport;
          const repSupport = polling.republicanSupport;
          const opponentSupport = opponentCandidate === 'democrat' ? demSupport : repSupport;
          const playerSupport = opponentCandidate === 'democrat' ? repSupport : demSupport;
          const pollingMargin = opponentSupport - playerSupport; // Positive = opponent winning
          const isOpponentWinning = pollingMargin > 0;
          
          // Check if opponent is ahead in both polling AND momentum
          // For HQs, we still want to upgrade them even if ahead (momentum compounds)
          // Only skip if opponent is WAY ahead (margin > 10 points) AND has significant momentum advantage (> 5 points)
          const isOpponentAheadInMomentum = opponentMomentum > playerMomentum;
          const momentumAdvantage = opponentMomentum - playerMomentum;
          const isOpponentAheadInBoth = isOpponentWinning && isOpponentAheadInMomentum;
          
          // Only skip states where opponent is WAY ahead in both (margin > 10 AND momentum > 5)
          // This allows the AI to still act in states where it's ahead but not by much
          if (isOpponentAheadInBoth && pollingMargin > 10 && momentumAdvantage > 5) {
            return null; // Skip only if WAY ahead
          }
          
          const activities = this.gameState.campaignActivities.get(abbrev) || [];
          // Check opponent's HQ (not player's)
          const hqActivity = activities.find(a => a.type === 'hq' && a.actor === 'opponent');
          const hasHq = !!hqActivity;
          const currentHqLevel = hqActivity?.hqLevel || 0;
          
          // STRATEGIC PRIORITY CALCULATION:
          // 1. WINNABILITY: States where opponent is close to winning (within 15 points)
          // 2. ELECTORAL VALUE: Bigger states are more valuable
          // 3. MOMENTUM OPPORTUNITY: States where opponent can gain momentum advantage
          // 4. SWING STATES: Always valuable
          
          let priority = 0;
          
          // 1. ELECTORAL VALUE: Bigger states = higher priority
          priority += state.electoralVotes * 20; // Base value per electoral vote
          
          // 2. WINNABILITY: States where opponent is close to winning
          const maxWinnableMargin = 15; // Don't target states where opponent is 15+ points behind
          if (pollingMargin > -maxWinnableMargin && pollingMargin < maxWinnableMargin) {
            // State is winnable
            if (pollingMargin < 0) {
              // Opponent is losing but close - HIGH VALUE for flipping
              const marginFromWin = Math.abs(pollingMargin);
              priority += 300 - (marginFromWin * 10); // Closer to winning = higher priority
            } else {
              // Opponent is winning - maintain advantage
              priority += 200 - (pollingMargin * 5); // Closer margin = higher priority
            }
          } else if (pollingMargin <= -maxWinnableMargin) {
            // Opponent is too far behind - low priority
            priority += 20;
          } else {
            // Opponent is way ahead - low priority
            priority += 30;
          }
          
          // 3. MOMENTUM OPPORTUNITY: States where opponent can gain momentum advantage
          // MOMENTUM IS THE MAIN DRIVER OF POLL CHANGES - prioritize heavily!
          // If opponent can beat player in momentum, it will win more undecided voters each week
          if (momentumDifference < 0) {
            // Opponent already has momentum advantage - maintain and extend it
            // Bigger advantage = higher priority (momentum compounds over time)
            priority += 300 - (momentumDifference * 5); // Much higher weight for momentum advantage
          } else if (momentumDifference > 0) {
            // Player has momentum advantage - CRITICAL to compete and flip it
            // This is where opponent can make the biggest impact on polling
            priority += 250 + (momentumDifference * 4); // Strongly prioritize flipping momentum
          } else {
            // Equal momentum - build advantage (whoever gets ahead wins)
            priority += 200; // High priority to break the tie
          }
          
          // BONUS: If opponent can beat player in momentum AND state is winnable, prioritize even more
          // This is the optimal scenario: momentum advantage + winnable state = guaranteed poll gains
          if (momentumDifference <= 5 && pollingMargin > -15 && pollingMargin < 15) {
            // Opponent can beat player in momentum (within 5 points) AND state is winnable
            priority += 150; // Major bonus for states where momentum advantage can flip the state
          }
          
          // 4. SWING STATE BONUS
          if (isSwingState) {
            priority += 100;
          }
          
             // 5. HQ LEVEL BONUS: Upgrade existing HQs to maximize momentum
             // Prioritize upgrades more aggressively - momentum compounds over time
             if (hasHq && currentHqLevel < 5) {
               // Existing HQ - upgrade to maximize momentum gain
               // Higher level = more valuable to upgrade (momentum compounds)
               priority += 100 + (currentHqLevel * 20); // Much higher priority for upgrades
             } else if (!hasHq) {
               // No HQ - building one is valuable
               priority += 80; // Higher priority for new HQs
             }
          
          // 6. BONUS: If opponent needs votes to reach 270, prioritize winnable states
          const projectedVotes = this.getProjectedElectoralVotes();
          const opponentCurrentVotes = opponentCandidate === 'democrat' 
            ? projectedVotes.democrat 
            : projectedVotes.republican;
          const votesNeeded = Math.max(0, 270 - opponentCurrentVotes);
          if (votesNeeded > 0 && !isOpponentWinning && pollingMargin > -15) {
            // Opponent needs votes and this state is winnable
            priority += state.electoralVotes * 3; // Extra boost for states that help reach 270
          }
          
          return { abbrev, priority, hasHq, currentHqLevel, momentumDifference, pollingMargin, isOpponentWinning };
        })
        .filter((item): item is NonNullable<typeof item> => item !== null)
        .sort((a, b) => b.priority - a.priority);
      
      // Strategic selection: Prioritize states that maximize electoral votes and momentum
      // Select top priority states (already sorted by strategic value)
      // On hard difficulty, prioritize upgrades more - upgrade existing HQs before building new ones
      const selectedHQs = hqPriorities.slice(0, hqTargetCount);
      
      // Separate upgrades from new builds
      const upgrades = selectedHQs.filter(hq => hq.hasHq && hq.currentHqLevel < 5);
      const newBuilds = selectedHQs.filter(hq => !hq.hasHq);
      
      // On hard difficulty, prioritize upgrades (momentum compounds over time)
      if (difficulty === 'hard' && upgrades.length > 0) {
        // Take all upgrades first, then fill remaining slots with new builds
        upgrades.forEach(hq => hqTargets.push(hq.abbrev));
        const remainingSlots = hqTargetCount - upgrades.length;
        if (remainingSlots > 0) {
          newBuilds.slice(0, remainingSlots).forEach(hq => hqTargets.push(hq.abbrev));
        }
      } else {
        // Medium/Easy: Use original priority order
        selectedHQs.forEach(hq => hqTargets.push(hq.abbrev));
      }
    } else {
      // Easy: Randomly choose states
      const statesWithoutHq = statesWithoutMaxHq.filter(abbrev => {
        const activities = this.gameState.campaignActivities.get(abbrev) || [];
        // Check if opponent has an HQ (not player's)
        return !activities.find(a => a.type === 'hq' && a.actor === 'opponent');
      });
      
      // First, build HQs in states that don't have one yet
      const newHqCount = Math.min(hqTargetCount, statesWithoutHq.length);
      for (let i = 0; i < newHqCount; i++) {
        if (statesWithoutHq.length > 0) {
          const randomIndex = this.rng.nextInt(0, statesWithoutHq.length - 1);
          hqTargets.push(statesWithoutHq.splice(randomIndex, 1)[0]);
        }
      }
      
      // Then, upgrade existing HQs if we haven't reached the target count
      const remainingHqCount = hqTargetCount - hqTargets.length;
      if (remainingHqCount > 0) {
        const statesWithHq = statesWithoutMaxHq.filter(abbrev => {
          const activities = this.gameState.campaignActivities.get(abbrev) || [];
          // Check if opponent has an HQ (not player's)
          return activities.find(a => a.type === 'hq' && a.actor === 'opponent');
        });
        
        for (let i = 0; i < remainingHqCount && statesWithHq.length > 0; i++) {
          const randomIndex = this.rng.nextInt(0, statesWithHq.length - 1);
          hqTargets.push(statesWithHq.splice(randomIndex, 1)[0]);
        }
      }
    }
    
    // Build HQs
    hqTargets.forEach(abbrev => {
      const activities = this.gameState.campaignActivities.get(abbrev) || [];
      // Find opponent's HQ (not player's)
      const hqActivity = activities.find(a => a.type === 'hq' && a.actor === 'opponent');
      const currentLevel = hqActivity?.hqLevel || 0;
      const nextLevel = Math.min(5, currentLevel + 1);
      
      if (currentLevel < 5) {
        const relationships = this.gameState.microgroupRelationships.get(abbrev);
        if (relationships) {
          const hqBoost = nextLevel * 0.2;
          const updated = { ...relationships };
          Object.keys(updated).forEach(key => {
            updated[key as keyof MicrogroupRelationships] = Math.min(10,
              updated[key as keyof MicrogroupRelationships] + hqBoost);
          });
          this.gameState.microgroupRelationships.set(abbrev, updated);
          
          // Update or create HQ activity
          if (hqActivity) {
            hqActivity.hqLevel = nextLevel;
          } else {
            const activities = this.gameState.campaignActivities.get(abbrev) || [];
            activities.push({
              type: 'hq',
              state: abbrev,
              weekCreated: this.gameState.currentWeek,
              actor: 'opponent',
              hqLevel: nextLevel,
            });
            this.gameState.campaignActivities.set(abbrev, activities);
          }
          
          // Log opponent HQ event
          const state = this.states.get(abbrev);
          this.logOpponentEvent({
            type: 'campaign_hq',
            state: abbrev,
            week: this.gameState.currentWeek,
            description: `${nextLevel === 1 ? 'Set Up' : 'Upgrade'} Campaign HQ Level ${nextLevel} in ${state?.name || abbrev}`,
            hqLevel: nextLevel,
          });
          
          // Increase opponent momentum for HQ
          const stateData = this.states.get(abbrev);
          if (stateData) {
            const populationMultiplier = Math.min(2.0, stateData.population.registeredVoters / 2500000);
            const momentumPerLevel = 0.1 * populationMultiplier;
            const stateMomentumIncrease = nextLevel * momentumPerLevel;
            const currentOpponentMomentum = this.gameState.opponentStateMomentum.get(abbrev) || 0;
            this.gameState.opponentStateMomentum.set(abbrev, Math.min(100, currentOpponentMomentum + stateMomentumIncrease));
          }
          
          // Note: Polling will be updated once per turn in endTurn(), not after each action
        }
      }
    });
    
    // Difficulty changes planning quality, not the rules. The opponent shares the
    // player's six-day ceiling and gets no invisible catch-up actions.
    const totalActionTarget = difficulty === 'hard' ? 6 : difficulty === 'medium' ? 5 : 4;
    
    // Account for fundraising if needed (counts as 1 action)
    const fundraisingCount = fundraisingState ? 1 : 0;
    const totalActionsSoFar = hqTargets.length + fundraisingCount;
    const remainingActions = Math.max(0, totalActionTarget - totalActionsSoFar);
    
    // Execute actions in target states
    // Ensure opponent takes target number of actions total (HQs + fundraising + other actions)
    if (targetStates.length === 0) {
      // Fallback: if no target states selected, choose random states
      if (allStates.length > 0) {
        const usedStates = new Set([...hqTargets]);
        if (fundraisingState) usedStates.add(fundraisingState);
        const availableStates = allStates.filter(abbrev => !usedStates.has(abbrev));
        const numNeeded = Math.min(remainingActions, availableStates.length);
        targetStates = availableStates.sort(() => this.rng.next() - 0.5).slice(0, numNeeded);
      }
    } else {
      // Limit targetStates to remaining actions needed, excluding already used states
      const usedStates = new Set([...hqTargets]);
      if (fundraisingState) usedStates.add(fundraisingState);
      targetStates = targetStates.filter(abbrev => !usedStates.has(abbrev));
      targetStates = targetStates.slice(0, remainingActions);
    }
    
    // If we still need more actions, add random states
    if (targetStates.length < remainingActions) {
      const usedStates = new Set([...hqTargets, ...targetStates]);
      if (fundraisingState) usedStates.add(fundraisingState);
      const availableStates = allStates.filter(abbrev => !usedStates.has(abbrev));
      const numNeeded = remainingActions - targetStates.length;
      const additionalStates = availableStates.sort(() => this.rng.next() - 0.5).slice(0, numNeeded);
      targetStates = [...targetStates, ...additionalStates];
    }
    
    // On hard difficulty, ensure minimum actions are taken
    // If we don't have enough target states, add more random states
    if (difficulty === 'hard') {
      const currentTotalActions = hqTargets.length + (fundraisingState ? 1 : 0) + targetStates.length;
      const minActions = 6; // Minimum 6 actions per week on hard
      if (currentTotalActions < minActions) {
        const usedStates = new Set([...hqTargets, ...targetStates]);
        if (fundraisingState) usedStates.add(fundraisingState);
        const availableStates = allStates.filter(abbrev => !usedStates.has(abbrev));
        const numNeeded = minActions - currentTotalActions;
        const additionalStates = availableStates.sort(() => this.rng.next() - 0.5).slice(0, numNeeded);
        targetStates = [...targetStates, ...additionalStates];
      }
    }
    
    // Execute fundraising first if needed (counts as 1 of the 6 actions)
    if (fundraisingState) {
      const currentPotential = this.gameState.fundraisingPotential.get(fundraisingState) || 100;
      this.gameState.fundraisingPotential.set(fundraisingState, Math.max(50, currentPotential * 0.5));
      
      // Log opponent fundraiser event
      const fundraisingAmount = this.calculateFundraisingAmount(fundraisingState);
      this.logOpponentEvent({
        type: 'large_donor_fundraiser',
        state: fundraisingState,
        week: this.gameState.currentWeek,
        description: `Large Donor Fundraiser in ${this.states.get(fundraisingState)?.name || fundraisingState}`,
        fundraisingAmount,
      });
      
      // Apply fundraiser relationship boost (same as player)
      const relationships = this.gameState.microgroupRelationships.get(fundraisingState);
      if (relationships) {
        const beforePolling = this.gameState.polling.get(fundraisingState);
        const beforePollingData = beforePolling ? {
          demSupport: beforePolling.democraticSupport,
          repSupport: beforePolling.republicanSupport,
          turnout: beforePolling.turnoutRate,
        } : { demSupport: 0, repSupport: 0, turnout: 0 };

        const updatedRelationships = { ...relationships };
        Object.keys(updatedRelationships).forEach(key => {
          updatedRelationships[key as keyof MicrogroupRelationships] = Math.min(10, 
            updatedRelationships[key as keyof MicrogroupRelationships] + 0.1);
        });
        this.gameState.microgroupRelationships.set(fundraisingState, updatedRelationships);
        
        // Note: Polling will be updated once per turn in endTurn(), not after each action
        // Log action (polling will be updated later)
        const beforeMomentum = {
          player: this.gameState.stateMomentum.get(fundraisingState) || 0,
          opponent: this.gameState.opponentStateMomentum.get(fundraisingState) || 0,
        };
        const beforeRelationships = this.gameState.microgroupRelationships.get(fundraisingState);
        const afterRelationships = this.gameState.microgroupRelationships.get(fundraisingState);
        
        if (beforeRelationships && afterRelationships) {
          const relationshipChanges: Record<string, number> = {};
          Object.keys(beforeRelationships).forEach(key => {
            const beforeValue = beforeRelationships[key as keyof MicrogroupRelationships];
            const afterValue = afterRelationships[key as keyof MicrogroupRelationships];
            relationshipChanges[key] = afterValue - beforeValue;
          });
          
          gameLogger.logAction({
            week: this.gameState.currentWeek,
            actor: 'opponent',
            actionType: 'large_donor_fundraiser',
            state: fundraisingState,
            cost: fundraisingAmount,
            stateEffects: [{
              stateAbbrev: fundraisingState,
              beforePolling: beforePollingData,
              afterPolling: beforePollingData, // Use beforePolling since polling hasn't updated yet
              beforeMomentum: beforeMomentum,
              afterMomentum: beforeMomentum, // No change from fundraiser
              relationshipChanges: relationshipChanges,
            }],
          });
        }
      }
    }
    
    // Helper function to simulate if an action would help the opponent
    const wouldActionHelp = (
      testActionType: CampaignAction['type'],
      testActionData: Partial<CampaignAction>,
      testStateAbbrev: string
    ): boolean => {
        if (difficulty === 'easy') return true; // Easy doesn't check
        
        // Get current polling
        const currentPolling = this.gameState.polling.get(testStateAbbrev);
        if (!currentPolling) return false;
        
        const currentOpponentSupport = opponentCandidate === 'democrat'
          ? currentPolling.democraticSupport
          : currentPolling.republicanSupport;
        
        // Simulate the action's effect on relationships
        const relationships = this.gameState.microgroupRelationships.get(testStateAbbrev);
        if (!relationships) return false;
        
        const testState = this.states.get(testStateAbbrev);
        if (!testState) return false;
        
        const simulatedRelationships = { ...relationships };
        
        if (testActionType === 'campaign_hq') {
          // HQ boosts all relationships
          const hqBoost = (testActionData.hqLevel || 1) * 0.2;
          Object.keys(simulatedRelationships).forEach(key => {
            simulatedRelationships[key as keyof MicrogroupRelationships] = Math.min(10,
              simulatedRelationships[key as keyof MicrogroupRelationships] + hqBoost);
          });
        } else if (testActionType === 'launch_ads' && testActionData.adTopic) {
          // Ads affect relationships based on topic
          const powerMultiplier = testActionData.campaignSize === 'small' ? 1 : testActionData.campaignSize === 'medium' ? 3 : 5;
          const position = this.gameState.opponentTopicPositions.get(testActionData.adTopic) || 'for';
          
          const microgroups: Microgroup[] = [
            'hardcore_dem', 'lean_dem', 'swingable_dem',
            'hardcore_rep', 'lean_rep', 'swingable_rep',
            'hardcore_dem_indie', 'lean_dem_indie', 'swingable_indie',
            'lean_rep_indie', 'hardcore_rep_indie',
          ];
          
          microgroups.forEach(mg => {
            const change = calculateTopicRelationshipChange(mg, testActionData.adTopic as TopicId, opponentCandidate, position);
            simulatedRelationships[mg] = Math.max(1, Math.min(10, simulatedRelationships[mg] + change * powerMultiplier));
          });
        } else if (testActionType === 'rally' && testActionData.rallyTopics) {
          // Rally affects relationships based on topics
          const simulated = applyTopicRelationshipChanges(
            simulatedRelationships,
            testActionData.rallyTopics as TopicId[],
            opponentCandidate,
            this.gameState.opponentTopicPositions
          );
          Object.assign(simulatedRelationships, simulated);
        } else if (testActionType === 'large_donor_fundraiser') {
          // Fundraiser slightly boosts all relationships
          Object.keys(simulatedRelationships).forEach(key => {
            simulatedRelationships[key as keyof MicrogroupRelationships] = Math.min(10,
              simulatedRelationships[key as keyof MicrogroupRelationships] + 0.1);
          });
        }
        
        // Calculate what polling would be with simulated relationships
        const demographics = calculateDetailedDemographics(testState);
        const isPlayerDem = this.gameState.playerCandidate === 'democrat';
        
        let demSupport = 0;
        let repSupport = 0;
        let undecidedSupport = 0;
        
        // Process each microgroup (same logic as updatePollingFromRelationships)
        const processMicrogroup = (
          relationship: number,
          weight: number,
          isDemGroup: boolean,
          isSwingable: boolean
        ) => {
          if (isSwingable) {
            if (relationship < 3) {
              if (isDemGroup) {
                repSupport += weight * 0.4;
                undecidedSupport += weight * 0.6;
              } else {
                demSupport += weight * 0.4;
                undecidedSupport += weight * 0.6;
              }
            } else if (relationship < 4) {
              undecidedSupport += weight;
            } else if (relationship >= 6) {
              if (isDemGroup) {
                demSupport += weight;
              } else {
                repSupport += weight;
              }
            } else if (relationship >= 4) {
              if (isDemGroup) {
                demSupport += weight * 0.6;
                undecidedSupport += weight * 0.4;
              } else {
                repSupport += weight * 0.6;
                undecidedSupport += weight * 0.4;
              }
            }
          } else {
            if (relationship < 3) {
              undecidedSupport += weight;
            } else if (relationship >= 5) {
              if (isDemGroup) {
                demSupport += weight;
              } else {
                repSupport += weight;
              }
            } else {
              if (isDemGroup) {
                demSupport += weight * 0.7;
                undecidedSupport += weight * 0.3;
              } else {
                repSupport += weight * 0.7;
                undecidedSupport += weight * 0.3;
              }
            }
          }
        };
        
        // Process all microgroups
        processMicrogroup(simulatedRelationships.hardcore_dem, demographics.democrats.hardcore, true, false);
        processMicrogroup(simulatedRelationships.lean_dem, demographics.democrats.likely, true, false);
        processMicrogroup(simulatedRelationships.swingable_dem, demographics.democrats.swingable, true, true);
        processMicrogroup(simulatedRelationships.hardcore_dem_indie, demographics.independents.demHardcore, true, false);
        processMicrogroup(simulatedRelationships.lean_dem_indie, demographics.independents.demLikely, true, true);
        processMicrogroup(simulatedRelationships.hardcore_rep, demographics.republicans.hardcore, false, false);
        processMicrogroup(simulatedRelationships.lean_rep, demographics.republicans.likely, false, false);
        processMicrogroup(simulatedRelationships.swingable_rep, demographics.republicans.swingable, false, true);
        processMicrogroup(simulatedRelationships.hardcore_rep_indie, demographics.independents.repHardcore, false, false);
        processMicrogroup(simulatedRelationships.lean_rep_indie, demographics.independents.repLikely, false, true);
        
        // Process swingable independents
        const swingableIndieWeight = demographics.independents.swingable;
        const indieRelationship = simulatedRelationships.swingable_indie;
        if (indieRelationship >= 6) {
          if (isPlayerDem) {
            demSupport += swingableIndieWeight;
          } else {
            repSupport += swingableIndieWeight;
          }
        } else if (indieRelationship < 4) {
          undecidedSupport += swingableIndieWeight;
        } else {
          if (isPlayerDem) {
            demSupport += swingableIndieWeight * 0.5;
            undecidedSupport += swingableIndieWeight * 0.5;
          } else {
            repSupport += swingableIndieWeight * 0.5;
            undecidedSupport += swingableIndieWeight * 0.5;
          }
        }
        
        undecidedSupport += demographics.undecided;
        
        // Normalize to percentages
        const total = demSupport + repSupport + undecidedSupport;
        if (total <= 0) return false;
        
        const simulatedOpponentSupport = opponentCandidate === 'democrat'
          ? (demSupport / total) * 100
          : (repSupport / total) * 100;
        
        // Action helps if it:
        // 1. Increases opponent support (direct polling gain)
        // 2. Maintains opponent support (prevents decline)
        // 3. Builds momentum (HQs always help with momentum)
        // 4. Is close to current support (within 0.5% - maintains advantage)
        
        const supportChange = simulatedOpponentSupport - currentOpponentSupport;
        
        // Always allow HQs - they build momentum which is critical
        if (testActionType === 'campaign_hq') {
          return true; // HQs always help with momentum
        }
        
        // Allow actions that increase support OR maintain it (within 0.5%)
        // This is less restrictive - allows actions that maintain advantage
        return supportChange >= -0.5; // Allow if support increases or stays within 0.5%
      };
      
    // Execute actions in target states, ensuring we take helpful actions
    const executeActionInState = (abbrev: string): boolean => {
      const state = this.states.get(abbrev);
      if (!state) return false;
      
      const polling = this.gameState.polling.get(abbrev);
      if (!polling) return false;
      
      // Determine which action to take based on difficulty
      let actionType: CampaignAction['type'] | undefined;
      let actionData: Partial<CampaignAction> = {};
      let actionFound = false;
      const maxAttempts = 10; // Try up to 10 different actions before giving up
      let attempts = 0;
      
      while (!actionFound && attempts < maxAttempts) {
        attempts++;
          
          if (difficulty === 'easy') {
            // Easy: Randomly choose action type
            const actionTypes: CampaignAction['type'][] = ['large_donor_fundraiser', 'launch_ads', 'campaign_hq', 'rally'];
            actionType = this.rng.pick(actionTypes);
            actionFound = true; // Easy doesn't check
          } else if (difficulty === 'medium' || difficulty === 'hard') {
            // Medium & Hard: Choose action that helps their base and indies
            // Find topics that would help opponent's base and indies
            // Get opponent's base microgroups
            const baseGroups = opponentCandidate === 'democrat' 
              ? ['hardcore_dem', 'lean_dem', 'swingable_dem', 'hardcore_dem_indie', 'lean_dem_indie']
              : ['hardcore_rep', 'lean_rep', 'swingable_rep', 'lean_rep_indie', 'hardcore_rep_indie'];
            
            // Score each topic based on how much it would help opponent's base
            // Only consider topics that help the base (rating > 5 for base groups)
            const topicScores = TOPICS.map(topic => {
              // Check if this topic helps the base (average rating > 5 for base groups)
              let baseScore = 0;
              baseGroups.forEach(mg => {
                const rating = TOPIC_RATINGS[mg as Microgroup][topic.id];
                baseScore += rating;
              });
              const avgBaseRating = baseScore / baseGroups.length;
              
              // Only consider topics that help the base (rating > 5)
              if (avgBaseRating <= 5) {
                return { topicId: topic.id, score: -1000 }; // Filter out topics that hurt base
              }
              
              let score = 0;
              baseGroups.forEach(mg => {
                const rating = TOPIC_RATINGS[mg as Microgroup][topic.id];
                // Higher rating = more helpful to base
                score += rating;
              });
              // Also consider indies (all indie groups)
              const indieGroups = ['hardcore_dem_indie', 'lean_dem_indie', 'swingable_indie', 'lean_rep_indie', 'hardcore_rep_indie'];
              indieGroups.forEach(mg => {
                const rating = TOPIC_RATINGS[mg as Microgroup][topic.id];
                score += rating * 0.5; // Weight indies less
              });
              return { topicId: topic.id, score };
            });
            
            // Filter out topics that hurt base and sort by score (highest first)
            const validTopics = topicScores.filter(t => t.score > -1000);
            
            // Check if positions are locked for opponent (needed for ads/rallies)
            const lockedTopicCount = this.gameState.opponentTopicPositions.size;
            const canDoAds = lockedTopicCount >= 1;
            const canDoRally = lockedTopicCount >= 3;
            
            if (validTopics.length === 0) {
              // Fallback: if no topics help base, use random action
              const actionTypes: CampaignAction['type'][] = ['large_donor_fundraiser', 'campaign_hq'];
              actionType = this.rng.pick(actionTypes);
            } else {
              validTopics.sort((a, b) => b.score - a.score);
            
              // Choose action type based on what's available
              // Prioritize momentum-building actions, especially in states where player has momentum
              const activities = this.gameState.campaignActivities.get(abbrev) || [];
              // Check opponent's HQ level (not player's)
              const hqActivity = activities.find(a => a.type === 'hq' && a.actor === 'opponent');
              const currentHqLevel = hqActivity?.hqLevel || 0;
              
              // Get momentum for both player and opponent
              const playerMomentum = this.gameState.stateMomentum.get(abbrev) || 0;
              const opponentMomentum = this.gameState.opponentStateMomentum.get(abbrev) || 0;
              const momentumDifference = playerMomentum - opponentMomentum;
              
              // If player has momentum advantage, be more aggressive (compete!)
              // Hard difficulty is more aggressive than Medium
              const isCompeting = momentumDifference > 0;
              const aggressionLevel = difficulty === 'hard' ? 0.7 : 0.5; // Hard: 70% chance, Medium: 50% chance
              
              // Get polling data to determine strategic value of large campaigns
              const polling = this.gameState.polling.get(abbrev);
              const state = this.states.get(abbrev);
              let shouldUseLargeCampaign = false;
              
              if (polling && state) {
                const demSupport = polling.democraticSupport;
                const repSupport = polling.republicanSupport;
                const opponentSupport = opponentCandidate === 'democrat' ? demSupport : repSupport;
                const playerSupport = opponentCandidate === 'democrat' ? repSupport : demSupport;
                const pollingMargin = opponentSupport - playerSupport; // Positive = opponent winning
                
                // Strategic conditions for large campaigns:
                // 1. Opponent is close to winning (within 5 points) - large campaign can flip it
                // 2. Opponent is behind in momentum but close in polling - large campaign can leapfrog
                // 3. Big state (high electoral votes) that's winnable - worth the investment
                // 4. Opponent needs major momentum boost to flip the state
                
                const isCloseToWinning = pollingMargin > -5 && pollingMargin < 5; // Within 5 points
                const isWinnable = pollingMargin > -15 && pollingMargin < 15; // Within 15 points
                const isBigState = state.electoralVotes >= 10; // 10+ electoral votes
                const canLeapfrog = momentumDifference > 0 && pollingMargin > -10; // Behind in momentum but close in polling
                const needsMomentumBoost = momentumDifference > 5 && isWinnable; // Significantly behind in momentum but winnable
                
                // Use large campaign if:
                // - Close to winning a big state (high value flip)
                // - Can leapfrog player (behind in momentum but close in polling)
                // - Needs major momentum boost to flip a winnable state
                shouldUseLargeCampaign = 
                  (isCloseToWinning && isBigState) || // Close to winning big state
                  (canLeapfrog && isBigState) || // Can leapfrog in big state
                  (needsMomentumBoost && isBigState) || // Needs momentum boost in big state
                  (isCloseToWinning && state.electoralVotes >= 5); // Close to winning medium state
              }
              
              // Prefer actions that help base (never hurt base) and build momentum
              // Only choose ads/rallies if positions are locked
              // Prioritize momentum-building actions when competing
              // On hard difficulty, be more aggressive with HQs
              // Prioritize HQs heavily - they build momentum which compounds over time
              const hqPriority = difficulty === 'hard' ? 0.8 : 0.5; // Hard: 80% chance, Medium: 50% chance
              
              if (isCompeting && currentHqLevel < 5 && this.rng.next() < aggressionLevel) {
                // When competing, prioritize HQs to build momentum
                actionType = 'campaign_hq';
                actionData.hqLevel = currentHqLevel + 1;
              } else if (currentHqLevel < 5 && this.rng.next() < hqPriority) {
                // Higher priority for HQs on hard difficulty
                actionType = 'campaign_hq';
                actionData.hqLevel = currentHqLevel + 1;
              } else if (canDoAds && (isCompeting ? this.rng.next() < aggressionLevel : this.rng.next() < 0.4)) {
                // Filter out topics that are already used for ads in this state
                const activities = this.gameState.campaignActivities.get(abbrev) || [];
                const usedAdTopics = new Set(
                  activities.filter(a => a.type === 'ads').map(a => a.adTopic).filter(Boolean)
                );
                const availableTopics = validTopics.filter(t => !usedAdTopics.has(t.topicId));
                
                if (availableTopics.length > 0) {
                  actionType = 'launch_ads';
                  actionData.adTopic = availableTopics[0].topicId;
                  // Strategically choose campaign size based on state value and opportunity
                  if (shouldUseLargeCampaign) {
                    actionData.campaignSize = 'large'; // Use large campaign for strategic advantage
                  } else if (state && state.electoralVotes >= 5) {
                    // Medium states: 50% chance of large, 50% medium
                    actionData.campaignSize = this.rng.next() < 0.5 ? 'large' : 'medium';
                  } else {
                    // Small states: prefer medium, occasional large
                    actionData.campaignSize = this.rng.next() < 0.3 ? 'large' : 'medium';
                  }
                } else {
                  // No available topics for ads, fallback to HQ or other action
                  if (currentHqLevel < 5) {
                    actionType = 'campaign_hq';
                    actionData.hqLevel = currentHqLevel + 1;
                  } else if (canDoRally && validTopics.length >= 3) {
                    actionType = 'rally';
                    actionData.rallyTopics = validTopics.slice(0, 3).map(t => t.topicId);
                  } else {
                    // Skip this state if no valid actions
                    return false;
                  }
                }
              } else if (canDoRally && validTopics.length >= 3 && (isCompeting ? this.rng.next() < aggressionLevel + 0.2 : this.rng.next() < 0.7)) {
                // Rallies build momentum - prioritize when competing
                actionType = 'rally';
                actionData.rallyTopics = validTopics.slice(0, 3).map(t => t.topicId);
              } else if (fundraisingState && abbrev === fundraisingState) {
                // If this state is already scheduled for fundraising, choose a different action
                // Prefer HQ if available, otherwise ads
                if (currentHqLevel < 5 && this.rng.next() < 0.5) {
                  actionType = 'campaign_hq';
                  actionData.hqLevel = currentHqLevel + 1;
                } else if (canDoAds) {
                  // Filter out topics that are already used for ads in this state
                  const activities = this.gameState.campaignActivities.get(abbrev) || [];
                  const usedAdTopics = new Set(
                    activities.filter(a => a.type === 'ads').map(a => a.adTopic).filter(Boolean)
                  );
                  const availableTopics = validTopics.filter(t => !usedAdTopics.has(t.topicId));
                  
                  if (availableTopics.length > 0) {
                    actionType = 'launch_ads';
                    actionData.adTopic = availableTopics[0].topicId;
                    // Strategically choose campaign size based on state value and opportunity
                    if (shouldUseLargeCampaign) {
                      actionData.campaignSize = 'large'; // Use large campaign for strategic advantage
                    } else if (state && state.electoralVotes >= 5) {
                      // Medium states: 50% chance of large, 50% medium
                      actionData.campaignSize = this.rng.next() < 0.5 ? 'large' : 'medium';
                    } else {
                      // Small states: prefer medium, occasional large
                      actionData.campaignSize = this.rng.next() < 0.3 ? 'large' : 'medium';
                    }
                  } else {
                    // No available topics for ads, skip this state
                    return false;
                  }
                } else {
                  // Fallback: choose HQ if possible
                  if (currentHqLevel < 5) {
                    actionType = 'campaign_hq';
                    actionData.hqLevel = currentHqLevel + 1;
                  } else {
                    // No valid actions, skip this state
                    return false;
                  }
                }
              } else {
                actionType = 'large_donor_fundraiser';
              }
            }
            
            // For medium/hard difficulty, check if action would help
            if (difficulty === 'medium' || difficulty === 'hard') {
              if (wouldActionHelp(actionType, actionData, abbrev)) {
                actionFound = true; // Found a helpful action
              } else {
                // Action wouldn't help, try a different one
                // BUT: Always allow HQs - they build momentum which is critical
                if (actionType === 'campaign_hq') {
                  actionFound = true; // Always allow HQs
                } else {
                  actionType = undefined;
                  actionData = {};
                  continue; // Try again
                }
              }
            } else {
              actionFound = true; // Easy doesn't check
            }
          }
          
          // If we couldn't find a helpful action after max attempts, try a fallback
          if (!actionFound || !actionType) {
            // Fallback: Try HQ if not at max level (HQs always help with momentum)
            const activities = this.gameState.campaignActivities.get(abbrev) || [];
            const hqActivity = activities.find(a => a.type === 'hq' && a.actor === 'opponent');
            const currentHqLevel = hqActivity?.hqLevel || 0;
            
            if (currentHqLevel < 5) {
              // Fallback to HQ - always helps with momentum
              actionType = 'campaign_hq';
              actionData.hqLevel = currentHqLevel + 1;
              actionFound = true;
            } else {
              // No valid action found, skip this state
              return false;
            }
          }
          
          // Execute the action
          if (actionType === 'campaign_hq') {
            this.executeOpponentHQ(abbrev);
          } else if (actionType === 'launch_ads' && actionData.adTopic) {
            this.executeOpponentAds(abbrev, opponentCandidate, actionData.adTopic, (actionData.campaignSize as 'small' | 'medium' | 'large') || 'medium');
          } else if (actionType === 'rally' && actionData.rallyTopics) {
            this.executeOpponentRally(abbrev, opponentCandidate, actionData.rallyTopics);
          } else if (actionType === 'large_donor_fundraiser') {
            this.executeOpponentFundraiser(abbrev);
          }
          
          return true;
        }

        return false;
      };

      // Execute actions in target states
      targetStates.forEach(abbrev => {
        executeActionInState(abbrev);
      });
  }

  /**
   * Process momentum effects on undecided voters AND swingable subgroups each turn
   * Each turn, a fraction of remaining undecided voters (week/25) are converted
   * based on the ratio between player and opponent momentum
   * Additionally, momentum differential affects swingable voters, converting them from opponent's side
   */
  private processMomentumUndecidedConversion(): void {
    // Calculate the fraction of undecided voters that can be affected this turn
    // Turn 1: 1/25, Turn 20: 20/25, Turn 25: 25/25 (100%)
    const weekFraction = this.gameState.currentWeek / 25;
    
    const isPlayerDem = this.gameState.playerCandidate === 'democrat';
    
    this.gameState.polling.forEach((polling, stateAbbrev) => {
      // Get player and opponent momentum for this state
      const playerMomentum = this.gameState.stateMomentum.get(stateAbbrev) || 0;
      const opponentMomentum = this.gameState.opponentStateMomentum.get(stateAbbrev) || 0;
      const totalMomentum = playerMomentum + opponentMomentum;
      const momentumDifference = playerMomentum - opponentMomentum;
      
      // If neither candidate has momentum, skip conversion
      if (totalMomentum <= 0) {
        return;
      }
      
      // Calculate the ratio of momentum
      const playerMomentumRatio = playerMomentum / totalMomentum;
      const opponentMomentumRatio = opponentMomentum / totalMomentum;
      
      // PART 1: Convert undecided voters based on momentum ratio
      const currentUndecided = 100 - polling.democraticSupport - polling.republicanSupport;
      
      if (currentUndecided > 0) {
        // Calculate how many undecided voters can be affected this turn
        const affectedUndecided = currentUndecided * weekFraction;
        
        // Distribute affected undecided voters based on momentum ratio
        const playerGain = affectedUndecided * playerMomentumRatio;
        const opponentGain = affectedUndecided * opponentMomentumRatio;
        
        // Convert undecided voters to decided voters
        if (isPlayerDem) {
          // Player is Democrat, opponent is Republican
          polling.democraticSupport += playerGain;
          polling.republicanSupport += opponentGain;
        } else {
          // Player is Republican, opponent is Democrat
          polling.republicanSupport += playerGain;
          polling.democraticSupport += opponentGain;
        }
      }
      
      // PART 2: Momentum differential affects swingable voters
      // If you have more momentum, you can convert swingable voters from opponent's side
      // The larger the momentum difference, the more swingable voters you can convert
      // This makes momentum differential critical for winning states
      
      if (Math.abs(momentumDifference) > 5) {
        // Only convert if there's a significant momentum difference (5+ points)
        // Calculate conversion rate based on momentum difference
        // Max conversion: 0.5% per week for a 50+ point momentum advantage
        const momentumConversionRate = Math.min(0.5, Math.abs(momentumDifference) / 100);
        const weekConversionRate = momentumConversionRate * weekFraction;
        
        // Get state demographics to estimate swingable voter pool
        const state = this.states.get(stateAbbrev);
        if (state) {
          // Use calculateDetailedDemographics to get detailed breakdown
          const demographics = calculateDetailedDemographics(state);
          // Estimate swingable voters: swingable dems, swingable reps, swingable indies, likely indies
          const swingableVoters = 
            demographics.democrats.swingable +
            demographics.republicans.swingable +
            demographics.independents.swingable +
            demographics.independents.demLikely +
            demographics.independents.repLikely;
          
          // Calculate how many swingable voters can be converted
          const affectedSwingable = swingableVoters * weekConversionRate;
          
          // Convert swingable voters based on momentum difference
          if (momentumDifference > 0) {
            // Player has momentum advantage - convert swingable voters to player's side
            if (isPlayerDem) {
              // Player is Democrat - convert from Rep to Dem
              const conversion = Math.min(affectedSwingable, polling.republicanSupport * 0.1); // Max 10% of Rep support
              polling.democraticSupport += conversion;
              polling.republicanSupport -= conversion;
            } else {
              // Player is Republican - convert from Dem to Rep
              const conversion = Math.min(affectedSwingable, polling.democraticSupport * 0.1); // Max 10% of Dem support
              polling.republicanSupport += conversion;
              polling.democraticSupport -= conversion;
            }
          } else {
            // Opponent has momentum advantage - convert swingable voters to opponent's side
            if (isPlayerDem) {
              // Opponent is Republican - convert from Dem to Rep
              const conversion = Math.min(affectedSwingable, polling.democraticSupport * 0.1); // Max 10% of Dem support
              polling.republicanSupport += conversion;
              polling.democraticSupport -= conversion;
            } else {
              // Opponent is Democrat - convert from Rep to Dem
              const conversion = Math.min(affectedSwingable, polling.republicanSupport * 0.1); // Max 10% of Rep support
              polling.democraticSupport += conversion;
              polling.republicanSupport -= conversion;
            }
          }
        }
      }
      
      // Ensure values are within bounds
      polling.democraticSupport = Math.max(0, Math.min(100, polling.democraticSupport));
      polling.republicanSupport = Math.max(0, Math.min(100, polling.republicanSupport));
      
      // Normalize polling so that demSupport + repSupport + undecided = 100%
      const totalDecided = polling.democraticSupport + polling.republicanSupport;
      if (totalDecided > 100) {
        const scaleFactor = 100 / totalDecided;
        polling.democraticSupport = polling.democraticSupport * scaleFactor;
        polling.republicanSupport = polling.republicanSupport * scaleFactor;
      }
    });
  }

  private updateNaturalPollingShifts(): void {
    // Small random shifts in polling each week
    this.gameState.polling.forEach((polling) => {
      const shift = (this.rng.next() - 0.5) * 0.5;
      polling.democraticSupport += shift;
      polling.republicanSupport -= shift;
      
      // Update margin of error (can fluctuate)
      polling.marginOfError = 3 + this.rng.next() * 7;
      
      polling.democraticSupport = Math.max(0, Math.min(100, polling.democraticSupport));
      polling.republicanSupport = Math.max(0, Math.min(100, polling.republicanSupport));
      
      // Normalize polling so that demSupport + repSupport + undecided = 100%
      const totalDecided = polling.democraticSupport + polling.republicanSupport;
      if (totalDecided > 100) {
        const scaleFactor = 100 / totalDecided;
        polling.democraticSupport = polling.democraticSupport * scaleFactor;
        polling.republicanSupport = polling.republicanSupport * scaleFactor;
      }
    });
  }

  private calculateElectoralVotes(): void {
    // Use the same logic as getStateColor to match what's shown on the map
    // Count states that are clearly blue or red (margin > 5), excluding grey and purple
    // This is for in-game projections only
    let demVotes = 0;
    let repVotes = 0;

    this.gameState.polling.forEach((polling, abbrev) => {
      const state = this.states.get(abbrev);
      if (!state) return;

      const demSupport = polling.democraticSupport;
      const repSupport = polling.republicanSupport;
      const undecidedPct = Math.max(0, 100 - demSupport - repSupport);
      
      // Check if undecideds have plurality (grey state) - exclude from count
      if (undecidedPct > demSupport && undecidedPct > repSupport) {
        return; // Grey state, don't count
      }
      
      const margin = demSupport - repSupport;
      const absMargin = Math.abs(margin);
      
      // Determine who has plurality
      const demHasPlurality = demSupport > repSupport;
      const repHasPlurality = repSupport > demSupport;
      
      // Only count states that are clearly won (margin > 5), matching map color logic
      // Exclude purple/swing states (margin <= 5)
      if (demHasPlurality && absMargin > 5) {
        // Clearly Democratic (blue on map)
        demVotes += state.electoralVotes;
      } else if (repHasPlurality && absMargin > 5) {
        // Clearly Republican (red on map)
        repVotes += state.electoralVotes;
      }
      // Otherwise it's a swing/purple state (margin <= 5) - don't count
    });

    this.gameState.electoralVotes = {
      democrat: demVotes,
      republican: repVotes,
    };
  }

  /**
   * Calculate final electoral votes for ALL states (used at end of game)
   * Resolves every state to one candidate or the other based on final polling
   */
  private calculateFinalElectoralVotes(): void {
    let demVotes = 0;
    let repVotes = 0;

    this.gameState.polling.forEach((polling, abbrev) => {
      const state = this.states.get(abbrev);
      if (!state) return;

      const demSupport = polling.democraticSupport;
      const repSupport = polling.republicanSupport;
      
      // Resolve every state - assign to whoever has more support
      // For ties, assign based on undecided split or historical lean
      if (demSupport > repSupport) {
        demVotes += state.electoralVotes;
      } else if (repSupport > demSupport) {
        repVotes += state.electoralVotes;
      } else {
        // Tie - assign based on historical lean or default to Democrat
        // In 1976, most states leaned one way or the other
        const historicalLean = state.historicalData.previousElectionResults;
        if (historicalLean.dem > historicalLean.rep) {
          demVotes += state.electoralVotes;
        } else {
          repVotes += state.electoralVotes;
        }
      }
    });

    this.gameState.electoralVotes = {
      democrat: demVotes,
      republican: repVotes,
    };
  }

  private checkWinConditions(): void {
    // Only check win conditions at the end of week 25 (Nov 2, election day)
    // After advancing the week, currentWeek will be 26 if we just finished week 25
    if (this.gameState.currentWeek <= this.gameState.totalWeeks) {
      return; // Game continues until week 25 is complete
    }

    // Game has ended (we've completed week 25) - calculate final results for ALL states
    this.calculateFinalElectoralVotes();
    
    const { democrat, republican } = this.gameState.electoralVotes;
    const isPlayerDem = this.gameState.playerCandidate === 'democrat';
    const playerVotes = isPlayerDem ? democrat : republican;
    const opponentVotes = isPlayerDem ? republican : democrat;

    // Check final results
    let playerWon = false;
    if (democrat > republican) {
      this.gameState.gameStatus = isPlayerDem ? 'won' : 'lost';
      playerWon = isPlayerDem;
    } else if (republican > democrat) {
      this.gameState.gameStatus = isPlayerDem ? 'lost' : 'won';
      playerWon = !isPlayerDem;
    } else {
      // Tie - player loses (historical: Carter won)
      this.gameState.gameStatus = 'lost';
      playerWon = false;
    }
    
    // End game logging
    gameLogger.endGame(playerWon, playerVotes, opponentVotes);
  }

  getStateColor(abbreviation: string): string {
    const state = this.states.get(abbreviation);
    if (!state) return '#808080'; // Grey fallback

    // If game is over, use actual results instead of polling
    const isGameOver = this.gameState.gameStatus === 'won' || this.gameState.gameStatus === 'lost';
    
    let demSupport: number;
    let repSupport: number;
    let undecidedPct: number;
    
    if (isGameOver) {
      // Use final polling results (not historical, but actual game results)
      const polling = this.gameState.polling.get(abbreviation);
      if (!polling) return '#808080';
      demSupport = polling.democraticSupport;
      repSupport = polling.republicanSupport;
      undecidedPct = 100 - demSupport - repSupport;
    } else {
      // Use current polling data
      const polling = this.gameState.polling.get(abbreviation);
      if (!polling) return '#808080';
      
      demSupport = polling.democraticSupport;
      repSupport = polling.republicanSupport;
      undecidedPct = Math.max(0, 100 - demSupport - repSupport); // Calculate undecided from polling
    }
    
    const margin = demSupport - repSupport;
    const absMargin = Math.abs(margin);
    
    // For final results, show only solid red or blue (no purple/gray)
    if (isGameOver) {
      if (demSupport > repSupport) {
        return '#1e3a8a'; // Solid blue for Dem win
      } else if (repSupport > demSupport) {
        return '#991b1b'; // Solid red for Rep win
      } else {
        return '#808080'; // Grey for tie (shouldn't happen)
      }
    }
    
    // For in-game, use the normal color logic
    // Check if undecideds have plurality (undecided > dem AND undecided > rep)
    if (undecidedPct > demSupport && undecidedPct > repSupport) {
      return '#808080'; // Grey for undecided plurality
    }
    
    // Determine who has plurality
    const demHasPlurality = demSupport > repSupport;
    const repHasPlurality = repSupport > demSupport;
    
    // Democrat colors (Dems have plurality AND margin >= 6)
    if (demHasPlurality && absMargin >= 6) {
      if (absMargin > 20) {
        return '#1e3a8a'; // Dark blue
      } else if (absMargin >= 11) {
        return '#3b82f6'; // Medium blue
      } else {
        return '#93c5fd'; // Light blue (margin 6-10)
      }
    }
    
    // Republican colors (Reps have plurality AND margin >= 6)
    if (repHasPlurality && absMargin >= 6) {
      if (absMargin > 20) {
        return '#991b1b'; // Dark red
      } else if (absMargin >= 11) {
        return '#dc2626'; // Medium red
      } else {
        return '#f87171'; // Light red (margin 6-10)
      }
    }
    
    // Swing colors (margin < 6, meaning margin <= 5)
    // This covers all cases where margin is 0-5
    if (absMargin < 6) {
      if (absMargin < 3) {
        return '#7c3aed'; // Purple (margin < 3)
      } else if (repHasPlurality && absMargin >= 4 && absMargin < 6) {
        return '#a855f7'; // Reddish purple (margin 4-5 for Reps, including 5.x)
      } else if (demHasPlurality && absMargin >= 4 && absMargin < 6) {
        return '#8b5cf6'; // Blueish purple (margin 4-5 for Dems, including 5.x)
      } else {
        // Margin 3-4, use purple
        return '#7c3aed'; // Purple for margin 3-4
      }
    }
    
    // Fallback to grey (shouldn't happen, but just in case)
    return '#808080';
  }
}

