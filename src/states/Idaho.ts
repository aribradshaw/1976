import { createStateData } from './StateData';

export const Idaho = createStateData({
  name: 'Idaho',
  abbreviation: 'ID',
  electoralVotes: 4,
  population: {
    total: 851387,
    votingEligible: 595970,
    registeredVoters: 506574,
  },
  demographics: {
    democraticBase: 26.0,
    republicanBase: 41.9,
    independent: 24.0,
    undecided: 30.0,
  },
  historicalData: {
    previousElectionResults: {
      dem: 37.12,
      rep: 59.88,
      other: 1.04,
    },
    turnoutRate: 57.21,
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

