import { createStateData } from './StateData';

export const Louisiana = createStateData({
  name: 'Louisiana',
  abbreviation: 'LA',
  electoralVotes: 10,
  population: {
    total: 3980062,
    votingEligible: 2786043,
    registeredVoters: 2368136,
  },
  demographics: {
    democraticBase: 36.2,
    republicanBase: 32.2,
    independent: 24.0,
    undecided: 30.0,
  },
  historicalData: {
    previousElectionResults: {
      dem: 51.73,
      rep: 45.95,
      other: 0.26,
    },
    turnoutRate: 45.89,
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

