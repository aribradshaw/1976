import { createStateData } from './StateData';

export const Nebraska = createStateData({
  name: 'Nebraska',
  abbreviation: 'NE',
  electoralVotes: 5,
  population: {
    total: 1535292,
    votingEligible: 1074704,
    registeredVoters: 913498,
  },
  demographics: {
    democraticBase: 27.0,
    republicanBase: 41.4,
    independent: 24.0,
    undecided: 30.0,
  },
  historicalData: {
    previousElectionResults: {
      dem: 38.46,
      rep: 59.19,
      other: 0.24,
    },
    turnoutRate: 56.54,
  },
  campaignModifiers: {
    mediaMarketCost: 0.8,
    eventEffectiveness: 1.0,
    fundraisingPotential: 0.9,
  },
  regionalFactors: {
    urbanPercentage: 50,
    ruralPercentage: 50,
    swingVoterPercentage: 20.0,
  },
});

