import { createStateData } from './StateData';

export const Oklahoma = createStateData({
  name: 'Oklahoma',
  abbreviation: 'OK',
  electoralVotes: 8,
  population: {
    total: 2838865,
    votingEligible: 1987205,
    registeredVoters: 1689124,
  },
  demographics: {
    democraticBase: 34.2,
    republicanBase: 35.0,
    independent: 24.0,
    undecided: 30.0,
  },
  historicalData: {
    previousElectionResults: {
      dem: 48.75,
      rep: 49.96,
      other: 0.00,
    },
    turnoutRate: 54.96,
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

