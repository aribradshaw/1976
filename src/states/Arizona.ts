import { createStateData } from './StateData';

export const Arizona = createStateData({
  name: 'Arizona',
  abbreviation: 'AZ',
  electoralVotes: 6,
  population: {
    total: 2339289,
    votingEligible: 1637502,
    registeredVoters: 1391876,
  },
  demographics: {
    democraticBase: 27.9,
    republicanBase: 39.5,
    independent: 24.0,
    undecided: 30.0,
  },
  historicalData: {
    previousElectionResults: {
      dem: 39.80,
      rep: 56.37,
      other: 1.03,
    },
    turnoutRate: 45.36,
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

