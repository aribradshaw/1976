import { createStateData } from './StateData';

export const Utah = createStateData({
  name: 'Utah',
  abbreviation: 'UT',
  electoralVotes: 4,
  population: {
    total: 1300331,
    votingEligible: 910231,
    registeredVoters: 773696,
  },
  demographics: {
    democraticBase: 23.5,
    republicanBase: 43.7,
    independent: 24.0,
    undecided: 30.0,
  },
  historicalData: {
    previousElectionResults: {
      dem: 33.65,
      rep: 62.44,
      other: 0.45,
    },
    turnoutRate: 59.46,
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

