import { createStateData } from './StateData';

export const Texas = createStateData({
  name: 'Texas',
  abbreviation: 'TX',
  electoralVotes: 26,
  population: {
    total: 13016206,
    votingEligible: 9111344,
    registeredVoters: 7744642,
  },
  demographics: {
    democraticBase: 35.8,
    republicanBase: 33.6,
    independent: 24.0,
    undecided: 30.0,
  },
  historicalData: {
    previousElectionResults: {
      dem: 51.14,
      rep: 47.97,
      other: 0.01,
    },
    turnoutRate: 44.69,
  },
  campaignModifiers: {
    mediaMarketCost: 1.0,
    eventEffectiveness: 0.9,
    fundraisingPotential: 1.0,
  },
  regionalFactors: {
    urbanPercentage: 70,
    ruralPercentage: 30,
    swingVoterPercentage: 20.0,
  },
});

