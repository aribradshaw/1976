export interface DetailedDemographics {
  democrats: {
    hardcore: number;    // Percentage of total voters
    likely: number;      // Percentage of total voters
    swingable: number;  // Percentage of total voters
  };
  independents: {
    demHardcore: number;  // Percentage of total voters
    demLikely: number;    // Percentage of total voters
    swingable: number;    // Percentage of total voters
    repLikely: number;    // Percentage of total voters
    repHardcore: number;  // Percentage of total voters
  };
  republicans: {
    hardcore: number;    // Percentage of total voters
    likely: number;      // Percentage of total voters
    swingable: number;   // Percentage of total voters
  };
  undecided: number;     // Percentage of total voters
}

export interface StateData {
  name: string;
  abbreviation: string;
  electoralVotes: number;
  population: {
    total: number;
    votingEligible: number;
    registeredVoters: number;
  };
  demographics: {
    democraticBase: number;      // Percentage
    republicanBase: number;       // Percentage
    independent: number;          // Percentage
    undecided: number;            // Percentage
  };
  detailedDemographics?: DetailedDemographics;  // Optional detailed breakdown
  historicalData: {
    previousElectionResults: {
      dem: number;
      rep: number;
      other: number;
    };
    turnoutRate: number;
  };
  campaignModifiers: {
    mediaMarketCost: number;      // Cost multiplier for ads
    eventEffectiveness: number;   // Modifier for campaign events
    fundraisingPotential: number; // Fundraising effectiveness
  };
  regionalFactors: {
    urbanPercentage: number;
    ruralPercentage: number;
    swingVoterPercentage: number;
  };
}

export interface PollingData {
  state: string;
  democraticSupport: number;      // Percentage (with margin of error)
  republicanSupport: number;      // Percentage (with margin of error)
  marginOfError: number;          // 3-10%
  lastUpdated: number;            // Week number
  turnoutRate: number;            // Percentage of registered voters (40-95%)
}

export interface CampaignActivity {
  type: 'hq' | 'ads' | 'fundraising_booth';
  state: string;
  weekCreated: number;
  actor?: 'player' | 'opponent';  // Distinguish between player and opponent activities
  initialValue?: number;  // For fundraising booths, the initial fundraising amount
  hqLevel?: number;  // For HQ: level 1-5
  adTopic?: string;  // For ads: the topic used
  campaignSize?: 'small' | 'medium' | 'large';  // For ads: campaign size
}

export interface CampaignEvent {
  type: 'rally' | 'large_donor_fundraiser' | 'launch_ads' | 'campaign_hq';
  state: string;
  week: number;
  description: string;
  adTopic?: string;  // For ads: the topic used
  rallyTopics?: string[];  // For rallies: the topics used
  hqLevel?: number;  // For HQ: level 1-5
  campaignSize?: 'small' | 'medium' | 'large';  // For ads: campaign size
  fundraisingAmount?: number;  // For fundraisers: amount raised
  isOpponent?: boolean;  // True if this is an opponent action
}

export interface FundraisingBooth {
  state: string;
  weekCreated: number;
  initialAmount: number;  // Initial fundraising amount
  currentWeek: number;    // Current week for calculating taper
}

// Microgroup relationships per state (1-10 scale, 5 = neutral)
export interface MicrogroupRelationships {
  hardcore_dem: number;
  lean_dem: number;
  swingable_dem: number;
  hardcore_rep: number;
  lean_rep: number;
  swingable_rep: number;
  hardcore_dem_indie: number;
  lean_dem_indie: number;
  swingable_indie: number;
  lean_rep_indie: number;
  hardcore_rep_indie: number;
}

export interface GameState {
  simulationSeed: number;
  currentWeek: number;
  totalWeeks: number;
  currentDate: Date;  // Current Tuesday date
  electionDate: Date;  // November 2, 1976
  playerCandidate: 'democrat' | 'republican';
  resources: {
    funds: number;
    actionsRemaining: number;
    energy: number;               // 0-100
    credibility: number;          // 0-100 public trust in the campaign
    weeklyFundraising: number;      // Weekly fundraising amount
  };
  stateMomentum: Map<string, number>;  // State -> player momentum (-100 to 100)
  opponentStateMomentum: Map<string, number>;  // State -> opponent momentum (-100 to 100)
  polling: Map<string, PollingData>;
  electoralVotes: {
    democrat: number;
    republican: number;
  };
  actionsThisWeek: CampaignAction[];
  campaignActivities: Map<string, CampaignActivity[]>;  // State -> activities
  campaignEvents: Map<string, CampaignEvent[]>;  // State -> event log (all events)
  fundraisingBooths: FundraisingBooth[];  // Active fundraising booths
  microgroupRelationships: Map<string, MicrogroupRelationships>;  // State -> relationships
  fundraisingPotential: Map<string, number>;  // State -> fundraising potential (100-125%)
  topicPositions: Map<string, 'for' | 'against'>;  // Topic ID -> position (locked globally for player)
  opponentTopicPositions: Map<string, 'for' | 'against'>;  // Topic ID -> position (locked globally for opponent)
  historicalEvents: Array<{
    eventId: string;
    choiceId: string;
    week: number;
    publicReaction: 'muted' | 'as_expected' | 'strong';
  }>;
  gameStatus: 'playing' | 'won' | 'lost' | 'paused';
  difficulty: 'easy' | 'medium' | 'hard';
}

export interface CampaignAction {
  type: 'large_donor_fundraiser' | 'launch_ads' | 'campaign_hq' | 'rally';
  targetState: string;  // All actions now require a state
  cost: number;
  week: number;
  description: string;
  // For launch_ads: 1 topic
  adTopic?: string;
  // For rally: 3 topics
  rallyTopics?: string[];
  // For campaign_hq: level (1-5)
  hqLevel?: number;
  // Campaign size for ads
  campaignSize?: 'small' | 'medium' | 'large';
  // Locked when the player confirms a fundraiser so the quoted amount is the payout.
  fundraisingAmount?: number;
}

export type Candidate = 'democrat' | 'republican';

