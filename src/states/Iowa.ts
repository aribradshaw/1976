import { createStateData } from './StateData';

export const Iowa = createStateData({
  name: 'Iowa',
  abbreviation: 'IA',
  electoralVotes: 8,
  population: {
    total: 2878035,
    votingEligible: 2014624,
    registeredVoters: 1712430,
  },
  demographics: {
    democraticBase: 34.0,
    republicanBase: 34.7,
    independent: 24.0,
    undecided: 30.0,
  },
  historicalData: {
    previousElectionResults: {
      dem: 48.46,
      rep: 49.47,
      other: 0.11,
    },
    turnoutRate: 63.50,
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

