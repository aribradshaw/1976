import { createStateData } from './StateData';

export const Delaware = createStateData({
  name: 'Delaware',
  abbreviation: 'DE',
  electoralVotes: 3,
  population: {
    total: 575844,
    votingEligible: 403090,
    registeredVoters: 342626,
  },
  demographics: {
    democraticBase: 36.4,
    republicanBase: 32.6,
    independent: 24.0,
    undecided: 30.0,
  },
  historicalData: {
    previousElectionResults: {
      dem: 51.98,
      rep: 46.57,
      other: 0.00,
    },
    turnoutRate: 58.51,
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

