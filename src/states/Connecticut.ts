import { createStateData } from './StateData';

export const Connecticut = createStateData({
  name: 'Connecticut',
  abbreviation: 'CT',
  electoralVotes: 8,
  population: {
    total: 3077229,
    votingEligible: 2154060,
    registeredVoters: 1830951,
  },
  demographics: {
    democraticBase: 32.8,
    republicanBase: 36.5,
    independent: 24.0,
    undecided: 30.0,
  },
  historicalData: {
    previousElectionResults: {
      dem: 46.90,
      rep: 52.06,
      other: 0.00,
    },
    turnoutRate: 64.14,
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

