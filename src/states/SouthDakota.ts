import { createStateData } from './StateData';

export const SouthDakota = createStateData({
  name: 'South Dakota',
  abbreviation: 'SD',
  electoralVotes: 4,
  population: {
    total: 680663,
    votingEligible: 476464,
    registeredVoters: 404994,
  },
  demographics: {
    democraticBase: 34.2,
    republicanBase: 35.3,
    independent: 24.0,
    undecided: 30.0,
  },
  historicalData: {
    previousElectionResults: {
      dem: 48.91,
      rep: 50.39,
      other: 0.54,
    },
    turnoutRate: 63.11,
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

