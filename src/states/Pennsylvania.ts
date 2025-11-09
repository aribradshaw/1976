import { createStateData } from './StateData';

export const Pennsylvania = createStateData({
  name: 'Pennsylvania',
  abbreviation: 'PA',
  electoralVotes: 27,
  population: {
    total: 11835900,
    votingEligible: 8285129,
    registeredVoters: 7042359,
  },
  demographics: {
    democraticBase: 35.3,
    republicanBase: 33.4,
    independent: 24.0,
    undecided: 30.0,
  },
  historicalData: {
    previousElectionResults: {
      dem: 50.40,
      rep: 47.73,
      other: 0.00,
    },
    turnoutRate: 55.77,
  },
  campaignModifiers: {
    mediaMarketCost: 1.0,
    eventEffectiveness: 0.9,
    fundraisingPotential: 1.0,
  },
  regionalFactors: {
    urbanPercentage: 70,
    ruralPercentage: 30,
    swingVoterPercentage: 20.0,
  },
});

