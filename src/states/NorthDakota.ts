import { createStateData } from './StateData';

export const NorthDakota = createStateData({
  name: 'North Dakota',
  abbreviation: 'ND',
  electoralVotes: 3,
  population: {
    total: 638734,
    votingEligible: 447113,
    registeredVoters: 380046,
  },
  demographics: {
    democraticBase: 32.1,
    republicanBase: 36.2,
    independent: 24.0,
    undecided: 30.0,
  },
  historicalData: {
    previousElectionResults: {
      dem: 45.80,
      rep: 51.66,
      other: 0.09,
    },
    turnoutRate: 66.45,
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

