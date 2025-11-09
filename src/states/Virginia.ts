import { createStateData } from './StateData';

export const Virginia = createStateData({
  name: 'Virginia',
  abbreviation: 'VA',
  electoralVotes: 12,
  population: {
    total: 5067488,
    votingEligible: 3547241,
    registeredVoters: 3015154,
  },
  demographics: {
    democraticBase: 33.6,
    republicanBase: 34.5,
    independent: 24.0,
    undecided: 30.0,
  },
  historicalData: {
    previousElectionResults: {
      dem: 47.96,
      rep: 49.29,
      other: 0.27,
    },
    turnoutRate: 47.84,
  },
  campaignModifiers: {
    mediaMarketCost: 0.9,
    eventEffectiveness: 0.9,
    fundraisingPotential: 0.9,
  },
  regionalFactors: {
    urbanPercentage: 60,
    ruralPercentage: 40,
    swingVoterPercentage: 20.0,
  },
});

