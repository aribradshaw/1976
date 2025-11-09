import { createStateData } from './StateData';

export const Colorado = createStateData({
  name: 'Colorado',
  abbreviation: 'CO',
  electoralVotes: 7,
  population: {
    total: 2616882,
    votingEligible: 1831817,
    registeredVoters: 1557044,
  },
  demographics: {
    democraticBase: 29.8,
    republicanBase: 37.8,
    independent: 24.0,
    undecided: 30.0,
  },
  historicalData: {
    previousElectionResults: {
      dem: 42.58,
      rep: 54.05,
      other: 0.49,
    },
    turnoutRate: 59.02,
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

