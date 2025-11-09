import { createStateData } from './StateData';

export const Vermont = createStateData({
  name: 'Vermont',
  abbreviation: 'VT',
  electoralVotes: 3,
  population: {
    total: 484605,
    votingEligible: 339223,
    registeredVoters: 288339,
  },
  demographics: {
    democraticBase: 30.2,
    republicanBase: 38.0,
    independent: 24.0,
    undecided: 30.0,
  },
  historicalData: {
    previousElectionResults: {
      dem: 43.14,
      rep: 54.34,
      other: 0.00,
    },
    turnoutRate: 55.38,
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

