import { createStateData } from './StateData';

export const Montana = createStateData({
  name: 'Montana',
  abbreviation: 'MT',
  electoralVotes: 4,
  population: {
    total: 749777,
    votingEligible: 524843,
    registeredVoters: 446116,
  },
  demographics: {
    democraticBase: 31.8,
    republicanBase: 37.0,
    independent: 24.0,
    undecided: 30.0,
  },
  historicalData: {
    previousElectionResults: {
      dem: 45.40,
      rep: 52.84,
      other: 0.00,
    },
    turnoutRate: 62.63,
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

