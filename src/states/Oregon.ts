import { createStateData } from './StateData';

export const Oregon = createStateData({
  name: 'Oregon',
  abbreviation: 'OR',
  electoralVotes: 6,
  population: {
    total: 2416417,
    votingEligible: 1691491,
    registeredVoters: 1437767,
  },
  demographics: {
    democraticBase: 33.3,
    republicanBase: 33.5,
    independent: 24.0,
    undecided: 30.0,
  },
  historicalData: {
    previousElectionResults: {
      dem: 47.62,
      rep: 47.78,
      other: 0.00,
    },
    turnoutRate: 60.89,
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

