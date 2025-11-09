import { createStateData } from './StateData';

export const Washington = createStateData({
  name: 'Washington',
  abbreviation: 'WA',
  electoralVotes: 9,
  population: {
    total: 3842961,
    votingEligible: 2690072,
    registeredVoters: 2286561,
  },
  demographics: {
    democraticBase: 32.3,
    republicanBase: 35.0,
    independent: 24.0,
    undecided: 30.0,
  },
  historicalData: {
    previousElectionResults: {
      dem: 46.11,
      rep: 50.00,
      other: 0.32,
    },
    turnoutRate: 57.82,
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

