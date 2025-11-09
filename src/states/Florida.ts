import { createStateData } from './StateData';

export const Florida = createStateData({
  name: 'Florida',
  abbreviation: 'FL',
  electoralVotes: 17,
  population: {
    total: 8563571,
    votingEligible: 5994499,
    registeredVoters: 5095324,
  },
  demographics: {
    democraticBase: 36.3,
    republicanBase: 32.6,
    independent: 24.0,
    undecided: 30.0,
  },
  historicalData: {
    previousElectionResults: {
      dem: 51.93,
      rep: 46.64,
      other: 0.00,
    },
    turnoutRate: 52.56,
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

