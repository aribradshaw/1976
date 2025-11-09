import { createStateData } from './StateData';

export const Nevada = createStateData({
  name: 'Nevada',
  abbreviation: 'NV',
  electoralVotes: 3,
  population: {
    total: 675791,
    votingEligible: 473053,
    registeredVoters: 402095,
  },
  demographics: {
    democraticBase: 32.1,
    republicanBase: 35.1,
    independent: 24.0,
    undecided: 30.0,
  },
  historicalData: {
    previousElectionResults: {
      dem: 45.81,
      rep: 50.17,
      other: 0.75,
    },
    turnoutRate: 42.68,
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

