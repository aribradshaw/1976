import { createStateData } from './StateData';

export const Missouri = createStateData({
  name: 'Missouri',
  abbreviation: 'MO',
  electoralVotes: 12,
  population: {
    total: 4820612,
    votingEligible: 3374428,
    registeredVoters: 2868263,
  },
  demographics: {
    democraticBase: 35.8,
    republicanBase: 33.2,
    independent: 24.0,
    undecided: 30.0,
  },
  historicalData: {
    previousElectionResults: {
      dem: 51.10,
      rep: 47.47,
      other: 0.00,
    },
    turnoutRate: 57.89,
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

