import { createStateData } from './StateData';

export const Alabama = createStateData({
  name: 'Alabama',
  abbreviation: 'AL',
  electoralVotes: 9,
  population: {
    total: 3713998,
    votingEligible: 2599798,
    registeredVoters: 2209828,
  },
  demographics: {
    democraticBase: 39.0,
    republicanBase: 29.8,
    independent: 22.0,
    undecided: 30.0,
  },
  historicalData: {
    previousElectionResults: {
      dem: 55.73,
      rep: 42.61,
      other: 0.13,
    },
    turnoutRate: 45.50,
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

