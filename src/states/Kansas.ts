import { createStateData } from './StateData';

export const Kansas = createStateData({
  name: 'Kansas',
  abbreviation: 'KS',
  electoralVotes: 7,
  population: {
    total: 2316838,
    votingEligible: 1621786,
    registeredVoters: 1378518,
  },
  demographics: {
    democraticBase: 31.4,
    republicanBase: 36.8,
    independent: 24.0,
    undecided: 30.0,
  },
  historicalData: {
    previousElectionResults: {
      dem: 44.94,
      rep: 52.49,
      other: 0.34,
    },
    turnoutRate: 59.06,
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

