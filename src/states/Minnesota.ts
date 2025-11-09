import { createStateData } from './StateData';

export const Minnesota = createStateData({
  name: 'Minnesota',
  abbreviation: 'MN',
  electoralVotes: 10,
  population: {
    total: 3967570,
    votingEligible: 2777299,
    registeredVoters: 2360704,
  },
  demographics: {
    democraticBase: 38.4,
    republicanBase: 29.4,
    independent: 22.0,
    undecided: 30.0,
  },
  historicalData: {
    previousElectionResults: {
      dem: 54.90,
      rep: 42.02,
      other: 0.18,
    },
    turnoutRate: 70.21,
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

