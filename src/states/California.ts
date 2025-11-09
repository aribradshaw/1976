import { createStateData } from './StateData';

export const California = createStateData({
  name: 'California',
  abbreviation: 'CA',
  electoralVotes: 45,
  population: {
    total: 22181994,
    votingEligible: 15527395,
    registeredVoters: 13198285,
  },
  demographics: {
    democraticBase: 33.3,
    republicanBase: 34.5,
    independent: 25.0,
    undecided: 30.0,
  },
  historicalData: {
    previousElectionResults: {
      dem: 47.57,
      rep: 49.35,
      other: 0.72,
    },
    turnoutRate: 50.67,
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

