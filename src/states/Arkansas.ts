import { createStateData } from './StateData';

export const Arkansas = createStateData({
  name: 'Arkansas',
  abbreviation: 'AR',
  electoralVotes: 6,
  population: {
    total: 2141179,
    votingEligible: 1498825,
    registeredVoters: 1274001,
  },
  demographics: {
    democraticBase: 45.4,
    republicanBase: 24.4,
    independent: 22.0,
    undecided: 30.0,
  },
  historicalData: {
    previousElectionResults: {
      dem: 64.94,
      rep: 34.93,
      other: 0.00,
    },
    turnoutRate: 51.33,
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

