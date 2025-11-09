import { createStateData } from './StateData';

export const Indiana = createStateData({
  name: 'Indiana',
  abbreviation: 'IN',
  electoralVotes: 13,
  population: {
    total: 5371602,
    votingEligible: 3760121,
    registeredVoters: 3196102,
  },
  demographics: {
    democraticBase: 32.0,
    republicanBase: 37.3,
    independent: 24.0,
    undecided: 30.0,
  },
  historicalData: {
    previousElectionResults: {
      dem: 45.70,
      rep: 53.32,
      other: 0.00,
    },
    turnoutRate: 59.05,
  },
  campaignModifiers: {
    mediaMarketCost: 0.9,
    eventEffectiveness: 0.9,
    fundraisingPotential: 0.9,
  },
  regionalFactors: {
    urbanPercentage: 60,
    ruralPercentage: 40,
    swingVoterPercentage: 20.0,
  },
});

