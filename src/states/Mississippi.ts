import { createStateData } from './StateData';

export const Mississippi = createStateData({
  name: 'Mississippi',
  abbreviation: 'MS',
  electoralVotes: 7,
  population: {
    total: 2399147,
    votingEligible: 1679402,
    registeredVoters: 1427491,
  },
  demographics: {
    democraticBase: 34.7,
    republicanBase: 33.4,
    independent: 24.0,
    undecided: 30.0,
  },
  historicalData: {
    previousElectionResults: {
      dem: 49.56,
      rep: 47.68,
      other: 0.36,
    },
    turnoutRate: 45.81,
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

