import { createStateData } from './StateData';

export const Wyoming = createStateData({
  name: 'Wyoming',
  abbreviation: 'WY',
  electoralVotes: 3,
  population: {
    total: 414700,
    votingEligible: 290290,
    registeredVoters: 246746,
  },
  demographics: {
    democraticBase: 27.9,
    republicanBase: 41.5,
    independent: 24.0,
    undecided: 30.0,
  },
  historicalData: {
    previousElectionResults: {
      dem: 39.81,
      rep: 59.30,
      other: 0.06,
    },
    turnoutRate: 53.86,
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

