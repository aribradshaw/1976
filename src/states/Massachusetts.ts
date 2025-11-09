import { createStateData } from './StateData';

export const Massachusetts = createStateData({
  name: 'Massachusetts',
  abbreviation: 'MA',
  electoralVotes: 14,
  population: {
    total: 5717890,
    votingEligible: 4002522,
    registeredVoters: 3402143,
  },
  demographics: {
    democraticBase: 39.3,
    republicanBase: 28.3,
    independent: 22.0,
    undecided: 30.0,
  },
  historicalData: {
    previousElectionResults: {
      dem: 56.11,
      rep: 40.44,
      other: 0.01,
    },
    turnoutRate: 63.65,
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

