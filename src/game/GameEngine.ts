import { GameState, CampaignAction, PollingData, Candidate, CampaignActivity, FundraisingBooth, MicrogroupRelationships } from '../types/game';
import { StateData } from '../types/game';
import { getAllStates } from '../states/index';
import { initializeRelationships, applyTopicRelationshipChanges, calculateTopicRelationshipChange } from './relationshipCalculator';
import { TopicId, Microgroup, TOPIC_RATINGS, TOPICS } from '../data/topics';

export class GameEngine {
  private gameState: GameState;
  private states: Map<string, StateData>;

  constructor(playerCandidate: Candidate = 'democrat', difficulty: 'easy' | 'medium' | 'hard' = 'medium') {
    this.states = new Map();
    const allStates = getAllStates();
    allStates.forEach(state => {
      this.states.set(state.abbreviation, state);
    });

    this.gameState = this.initializeGame(playerCandidate, difficulty);
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
      let demSupport = Math.max(0, Math.min(100, baseDem + (Math.random() - 0.5) * 10));
      let repSupport = Math.max(0, Math.min(100, baseRep + (Math.random() - 0.5) * 10));
      
      // Ensure at least 30% undecided (dem + rep <= 70%)
      const totalDecided = demSupport + repSupport;
      if (totalDecided > 70) {
        // Scale down proportionally to ensure 30% undecided minimum
        const scaleFactor = 70 / totalDecided;
        demSupport = demSupport * scaleFactor;
        repSupport = repSupport * scaleFactor;
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
    
    this.states.forEach((state, abbrev) => {
      microgroupRelationships.set(abbrev, initializeRelationships());
      fundraisingPotential.set(abbrev, 100);  // Start at 100%
      stateMomentum.set(abbrev, 0);  // Start at 0 momentum
    });

    return {
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
      polling,
      electoralVotes: {
        democrat: 0,
        republican: 0,
      },
      actionsThisWeek: [],
      campaignActivities: new Map<string, CampaignActivity[]>(),
      fundraisingBooths: [],
      microgroupRelationships,
      fundraisingPotential,
      topicPositions: new Map<string, 'for' | 'against'>(),
      gameStatus: 'playing',
      difficulty,
    };
  }

  private getRandomMarginOfError(): number {
    // Returns a margin of error between 3% and 10%
    return 3 + Math.random() * 7;
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
      fundraisingBooths: [...this.gameState.fundraisingBooths],
      microgroupRelationships: new Map(this.gameState.microgroupRelationships),
      fundraisingPotential: new Map(this.gameState.fundraisingPotential),
      topicPositions: new Map(this.gameState.topicPositions),
      stateMomentum: new Map(this.gameState.stateMomentum),
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
  
  getStatesWonByParty(): { democrat: string[], republican: string[] } {
    // Use the same logic as getStateColor to match what's shown on the map
    const demStates: string[] = [];
    const repStates: string[] = [];
    
    this.gameState.polling.forEach((polling, abbrev) => {
      const state = this.states.get(abbrev);
      if (!state) return;
      
      const demSupport = polling.democraticSupport;
      const repSupport = polling.republicanSupport;
      const undecidedPct = state.demographics.undecided;
      
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
    const baseAmount = 500000 + Math.random() * 500000; // $500K - $1M
    
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
      const undecidedPct = state.demographics.undecided;
      
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
    activities.push(activity);
    this.gameState.campaignActivities.set(stateAbbreviation, activities);
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

    // Validate action-specific requirements
    if (action.type === 'launch_ads' && !action.adTopic) {
      return false; // Ads require a topic
    }
    
    if (action.type === 'rally' && (!action.rallyTopics || action.rallyTopics.length !== 3)) {
      return false; // Rally requires exactly 3 topics
    }
    
    if (action.type === 'campaign_hq' && (!action.hqLevel || action.hqLevel < 1 || action.hqLevel > 5)) {
      return false; // HQ requires level 1-5
    }

    // Execute the action
    this.gameState.resources.funds -= action.cost;
    this.gameState.resources.actionsRemaining -= 1;
    this.gameState.actionsThisWeek.push(action);

    // Apply action effects
    this.applyActionEffects(action);

    return true;
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
      const baseAmount = 500000 + Math.random() * 500000; // $500K - $1M
      
      // Normalize by registered voters (reference: 2.5M registered voters = 1.0 multiplier)
      // Smaller states will have proportionally lower fundraising
      const referenceVoters = 2500000; // Medium-sized state reference
      const voterMultiplier = state.population.registeredVoters / referenceVoters;
      
      const fundraisingAmount = baseAmount * state.campaignModifiers.fundraisingPotential * (currentPotential / 100) * voterMultiplier;
      
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
      this.addCampaignActivity(action.targetState, {
        type: 'ads',
        state: action.targetState,
        weekCreated: this.gameState.currentWeek,
        adTopic: action.adTopic,
      });
      
      // Update relationships based on ad topic
      const updatedRelationships = applyTopicRelationshipChanges(
        relationships,
        [action.adTopic as any],
        this.gameState.playerCandidate,
        this.gameState.topicPositions
      );
      this.gameState.microgroupRelationships.set(action.targetState, updatedRelationships);
    }
    
    // Handle Campaign HQ (Set Up or Upgrade)
    if (action.type === 'campaign_hq' && action.hqLevel) {
      const activities = this.gameState.campaignActivities.get(action.targetState) || [];
      const existingHQ = activities.find(a => a.type === 'hq');
      
      if (existingHQ) {
        // Upgrade existing HQ
        existingHQ.hqLevel = action.hqLevel;
      } else {
        // Create new HQ
        this.addCampaignActivity(action.targetState, {
          type: 'hq',
          state: action.targetState,
          weekCreated: this.gameState.currentWeek,
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
    }
    
    // Handle Rally (with 3 topics)
    if (action.type === 'rally' && action.rallyTopics && action.rallyTopics.length === 3) {
      // Update relationships based on rally topics
      const updatedRelationships = applyTopicRelationshipChanges(
        relationships,
        action.rallyTopics as any[],
        this.gameState.playerCandidate,
        this.gameState.topicPositions
      );
      this.gameState.microgroupRelationships.set(action.targetState, updatedRelationships);
      
      // Rally also boosts momentum in the target state
      const currentMomentum = this.gameState.stateMomentum.get(action.targetState) || 0;
      this.gameState.stateMomentum.set(action.targetState, Math.min(100, currentMomentum + 2));
    }

    // Update polling based on relationships
    this.updatePollingFromRelationships(action.targetState);
    
    // Reduce energy
    this.gameState.resources.energy = Math.max(0, this.gameState.resources.energy - 5);
  }
  
  private updatePollingFromRelationships(stateAbbreviation: string): void {
    const relationships = this.gameState.microgroupRelationships.get(stateAbbreviation);
    const state = this.states.get(stateAbbreviation);
    const polling = this.gameState.polling.get(stateAbbreviation);
    const momentum = this.gameState.stateMomentum.get(stateAbbreviation) || 0;
    
    if (!relationships || !state || !polling) return;
    
    // Calculate weighted support based on relationships and demographics
    const demGroups = [
      relationships.hardcore_dem,
      relationships.lean_dem,
      relationships.swingable_dem,
      relationships.hardcore_dem_indie,
      relationships.lean_dem_indie,
    ];
    
    const repGroups = [
      relationships.hardcore_rep,
      relationships.lean_rep,
      relationships.swingable_rep,
      relationships.lean_rep_indie,
      relationships.hardcore_rep_indie,
    ];
    
    // Average relationship scores
    const avgDemRelationship = demGroups.reduce((a, b) => a + b, 0) / demGroups.length;
    const avgRepRelationship = repGroups.reduce((a, b) => a + b, 0) / repGroups.length;
    
    // Overall average relationship (affects turnout)
    const overallAvgRelationship = (avgDemRelationship + avgRepRelationship) / 2;
    
    // Convert relationship (1-10) to polling change
    // Relationship of 5 = neutral, 10 = +5%, 1 = -5%
    const demChange = (avgDemRelationship - 5) * 0.5;
    const repChange = (avgRepRelationship - 5) * 0.5;
    
    const isPlayerDem = this.gameState.playerCandidate === 'democrat';
    
    if (isPlayerDem) {
      polling.democraticSupport += demChange;
      polling.republicanSupport -= repChange * 0.5;
    } else {
      polling.republicanSupport += repChange;
      polling.democraticSupport -= demChange * 0.5;
    }
    
    // Apply momentum effects:
    // 1. Boost the candidate's party's turnout across the board
    // 2. Influence swingable voters from indies and opposing party
    const momentumEffect = momentum / 100; // Convert to 0-1 scale
    
    // Momentum boosts turnout for candidate's party
    const turnoutBoost = momentumEffect * 5; // Up to 5% turnout boost
    
    // Momentum influences swingable voters:
    // - Swingable dems/reps: influenced by momentum
    // - Swingable indies: influenced by momentum
    const swingableInfluence = momentumEffect * 2; // Up to 2% support change
    
    if (isPlayerDem) {
      // Boost Democratic turnout
      polling.turnoutRate += turnoutBoost;
      // Influence swingable voters toward Dems
      polling.democraticSupport += swingableInfluence;
      polling.republicanSupport -= swingableInfluence * 0.5;
    } else {
      // Boost Republican turnout
      polling.turnoutRate += turnoutBoost;
      // Influence swingable voters toward Reps
      polling.republicanSupport += swingableInfluence;
      polling.democraticSupport -= swingableInfluence * 0.5;
    }
    
    // Clamp values
    polling.democraticSupport = Math.max(0, Math.min(100, polling.democraticSupport));
    polling.republicanSupport = Math.max(0, Math.min(100, polling.republicanSupport));
    
    // Update turnout rate based on relationships
    // Higher relationships = higher turnout, lower relationships = lower turnout
    // Relationship of 5 = base turnout, 10 = +10% turnout, 1 = -10% turnout
    const turnoutChange = (overallAvgRelationship - 5) * 2; // Scale: -10% to +10%
    const baseTurnoutRate = state.historicalData.turnoutRate;
    const newTurnoutRate = baseTurnoutRate + turnoutChange;
    
    // Cap turnout between 40% and 95% of registered voters
    polling.turnoutRate = Math.max(40, Math.min(95, newTurnoutRate));
    
    polling.lastUpdated = this.gameState.currentWeek;
  }

  endTurn(): void {
    if (this.gameState.gameStatus !== 'playing') {
      return;
    }

    // Process opponent actions (AI or random)
    this.processOpponentTurn();

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
   * Apply weekly event effects to all microgroups in all states
   * @param topicId The topic that was selected
   * @param position The position chosen (for/against)
   */
  applyWeeklyEvent(topicId: string, position: 'for' | 'against'): void {
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

    // Apply relationship changes to all states
    this.gameState.microgroupRelationships.forEach((relationships, stateAbbrev) => {
      const updated: MicrogroupRelationships = { ...relationships };
      
      microgroups.forEach(microgroup => {
        const change = calculateTopicRelationshipChange(
          microgroup,
          topicId as TopicId,
          this.gameState.playerCandidate,
          position
        );
        
        // Apply the change (capped at 1-10)
        updated[microgroup] = Math.max(1, Math.min(10, updated[microgroup] + change));
      });
      
      this.gameState.microgroupRelationships.set(stateAbbrev, updated);
      
      // Update polling based on new relationships
      this.updatePollingFromRelationships(stateAbbrev);
    });
  }
  
  /**
   * Get the number of locked topic positions
   */
  getLockedTopicCount(): number {
    return this.gameState.topicPositions.size;
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
    
    this.gameState.campaignActivities.forEach((activities, stateAbbrev) => {
      const hqActivity = activities.find(a => a.type === 'hq');
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

  private processOpponentTurn(): void {
    const opponentCandidate = this.gameState.playerCandidate === 'democrat' ? 'republican' : 'democrat';
    const difficulty = this.gameState.difficulty;
    
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
    
    // If AI has taken many expensive actions, prioritize fundraising
    const needsFundraising = expensiveActionCount > 5;
    
    if (needsFundraising) {
      // Find the highest paying state for fundraising
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
        // Schedule fundraising in the highest paying state
        // (Fundraiser doesn't affect relationships, just generates money)
        // We'll just skip the action execution since opponent doesn't track funds
        // But we'll mark it as done by updating fundraising potential
        const currentPotential = this.gameState.fundraisingPotential.get(bestState) || 100;
        this.gameState.fundraisingPotential.set(bestState, Math.max(50, currentPotential * 0.5));
        return; // Exit early after scheduling fundraising
      }
    }
    
    // Determine which states to target based on difficulty
    let targetStates: string[] = [];
    
    if (difficulty === 'easy') {
      // Easy: Randomly choose states
      const allStates = Array.from(this.states.keys());
      const numActions = Math.floor(Math.random() * 3) + 1; // 1-3 actions
      targetStates = allStates.sort(() => Math.random() - 0.5).slice(0, numActions);
    } else if (difficulty === 'medium') {
      // Medium: Randomly choose states (but smarter action selection)
      const allStates = Array.from(this.states.keys());
      const numActions = Math.floor(Math.random() * 3) + 2; // 2-4 actions
      targetStates = allStates.sort(() => Math.random() - 0.5).slice(0, numActions);
    } else if (difficulty === 'hard') {
      // Hard: Always target purple or gray (swing) states
      const swingStates = Array.from(this.gameState.polling.entries())
        .filter(([abbrev, polling]) => {
          const color = this.getStateColor(abbrev);
          return color === '#7c3aed' || color === '#a855f7' || color === '#8b5cf6' || color === '#808080';
        })
        .map(([abbrev, _]) => abbrev);
      
      if (swingStates.length > 0) {
        const numActions = Math.min(swingStates.length, 4); // Up to 4 actions
        targetStates = swingStates.sort(() => Math.random() - 0.5).slice(0, numActions);
      } else {
        // Fallback: choose competitive states
        const competitiveStates = Array.from(this.gameState.polling.entries())
          .filter(([_, polling]) => Math.abs(polling.democraticSupport - polling.republicanSupport) < 10)
          .map(([abbrev, _]) => abbrev)
          .slice(0, 4);
        targetStates = competitiveStates;
      }
    }
    
    // Execute actions in target states
    targetStates.forEach(abbrev => {
      const state = this.states.get(abbrev);
      if (!state) return;
      
      const polling = this.gameState.polling.get(abbrev);
      if (!polling) return;
      
      // Determine which action to take based on difficulty
      let actionType: CampaignAction['type'];
      let actionData: any = {};
      
      if (difficulty === 'easy') {
        // Easy: Randomly choose action type
        const actionTypes: CampaignAction['type'][] = ['large_donor_fundraiser', 'launch_ads', 'campaign_hq', 'rally'];
        actionType = actionTypes[Math.floor(Math.random() * actionTypes.length)];
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
        if (validTopics.length === 0) {
          // Fallback: if no topics help base, use random action
          const actionTypes: CampaignAction['type'][] = ['large_donor_fundraiser', 'campaign_hq'];
          actionType = actionTypes[Math.floor(Math.random() * actionTypes.length)];
        } else {
          validTopics.sort((a, b) => b.score - a.score);
        
          // Choose action type based on what's available
          const activities = this.gameState.campaignActivities.get(abbrev) || [];
          const hqActivity = activities.find(a => a.type === 'hq');
          const currentHqLevel = hqActivity?.hqLevel || 0;
          
          // Prefer actions that help base (never hurt base)
          if (currentHqLevel < 5 && Math.random() < 0.3) {
            actionType = 'campaign_hq';
            actionData.hqLevel = currentHqLevel + 1;
          } else if (Math.random() < 0.4) {
            actionType = 'launch_ads';
            actionData.adTopic = validTopics[0].topicId;
            actionData.campaignSize = Math.random() < 0.5 ? 'medium' : 'large';
          } else if (Math.random() < 0.7 && validTopics.length >= 3) {
            actionType = 'rally';
            actionData.rallyTopics = validTopics.slice(0, 3).map(t => t.topicId);
          } else {
            actionType = 'large_donor_fundraiser';
          }
        }
      }
      
      // Execute the action
      if (actionType === 'campaign_hq') {
        const activities = this.gameState.campaignActivities.get(abbrev) || [];
        const hqActivity = activities.find(a => a.type === 'hq');
        const currentLevel = hqActivity?.hqLevel || 0;
        const nextLevel = Math.min(5, currentLevel + 1);
        
        if (currentLevel < 5) {
          // Apply HQ effects
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
                hqLevel: nextLevel,
              });
              this.gameState.campaignActivities.set(abbrev, activities);
            }
          }
        }
      } else if (actionType === 'launch_ads' && actionData.adTopic) {
        const relationships = this.gameState.microgroupRelationships.get(abbrev);
        if (relationships) {
          const powerMultiplier = actionData.campaignSize === 'small' ? 1 : actionData.campaignSize === 'medium' ? 3 : 5;
          const position = this.gameState.topicPositions.get(actionData.adTopic) || 'for';
          
          const microgroups: Microgroup[] = [
            'hardcore_dem', 'lean_dem', 'swingable_dem',
            'hardcore_rep', 'lean_rep', 'swingable_rep',
            'hardcore_dem_indie', 'lean_dem_indie', 'swingable_indie',
            'lean_rep_indie', 'hardcore_rep_indie',
          ];
          
          const updated = { ...relationships };
          microgroups.forEach(mg => {
            const change = calculateTopicRelationshipChange(mg, actionData.adTopic as TopicId, opponentCandidate, position);
            updated[mg] = Math.max(1, Math.min(10, updated[mg] + change * powerMultiplier));
          });
          this.gameState.microgroupRelationships.set(abbrev, updated);
        }
      } else if (actionType === 'rally' && actionData.rallyTopics) {
        const relationships = this.gameState.microgroupRelationships.get(abbrev);
        if (relationships) {
          const updated = applyTopicRelationshipChanges(
            relationships,
            actionData.rallyTopics as TopicId[],
            opponentCandidate,
            this.gameState.topicPositions
          );
          this.gameState.microgroupRelationships.set(abbrev, updated);
        }
      } else if (actionType === 'large_donor_fundraiser') {
        // Fundraiser doesn't affect relationships, just generates money
        // (Opponent doesn't have a funds system, so we skip this)
      }
      
      // Update polling based on new relationships
      this.updatePollingFromRelationships(abbrev);
    });
  }

  private updateNaturalPollingShifts(): void {
    // Small random shifts in polling each week
    this.gameState.polling.forEach((polling, abbrev) => {
      const shift = (Math.random() - 0.5) * 0.5;
      polling.democraticSupport += shift;
      polling.republicanSupport -= shift;
      
      // Update margin of error (can fluctuate)
      polling.marginOfError = 3 + Math.random() * 7;
      
      polling.democraticSupport = Math.max(0, Math.min(100, polling.democraticSupport));
      polling.republicanSupport = Math.max(0, Math.min(100, polling.republicanSupport));
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
      const undecidedPct = state.demographics.undecided;
      
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

    // Check final results
    if (democrat > republican) {
      this.gameState.gameStatus = isPlayerDem ? 'won' : 'lost';
    } else if (republican > democrat) {
      this.gameState.gameStatus = isPlayerDem ? 'lost' : 'won';
    } else {
      // Tie - player loses (historical: Carter won)
      this.gameState.gameStatus = 'lost';
    }
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
      undecidedPct = state.demographics.undecided;
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
    
    // Democrat colors (Dems have plurality AND margin > 5)
    if (demHasPlurality && absMargin > 5) {
      if (absMargin > 20) {
        return '#1e3a8a'; // Dark blue
      } else if (absMargin >= 11) {
        return '#3b82f6'; // Medium blue
      } else if (absMargin >= 6) {
        return '#93c5fd'; // Light blue
      }
    }
    
    // Republican colors (Reps have plurality AND margin > 5)
    if (repHasPlurality && absMargin > 5) {
      if (absMargin > 20) {
        return '#991b1b'; // Dark red
      } else if (absMargin >= 11) {
        return '#dc2626'; // Medium red
      } else if (absMargin >= 6) {
        return '#f87171'; // Light red
      }
    }
    
    // Swing colors (Dems or Reps have plurality AND margin < 5)
    if (absMargin < 5) {
      if (absMargin < 3) {
        return '#7c3aed'; // Purple (margin < 3)
      } else if (repHasPlurality && absMargin >= 4) {
        return '#a855f7'; // Reddish purple (margin 4-5 for Reps)
      } else if (demHasPlurality && absMargin >= 4) {
        return '#8b5cf6'; // Blueish purple (margin 4-5 for Dems)
      }
    }
    
    // Fallback to grey
    return '#808080';
  }
}

