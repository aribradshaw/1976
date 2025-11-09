import { createStateData } from './StateData';

export const Wisconsin = createStateData({
  name: 'Wisconsin',
  abbreviation: 'WI',
  electoralVotes: 11,
  population: {
    total: 4590552,
    votingEligible: 3213386,
    registeredVoters: 2731378,
  },
  demographics: {
    democraticBase: 34.7,
    republicanBase: 33.5,
    independent: 24.0,
    undecided: 30.0,
  },
  historicalData: {
    previousElectionResults: {
      dem: 49.50,
      rep: 47.83,
      other: 0.18,
    },
    turnoutRate: 65.39,
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

