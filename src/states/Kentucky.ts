import { createStateData } from './StateData';

export const Kentucky = createStateData({
  name: 'Kentucky',
  abbreviation: 'KY',
  electoralVotes: 9,
  population: {
    total: 3483948,
    votingEligible: 2438763,
    registeredVoters: 2072948,
  },
  demographics: {
    democraticBase: 37.0,
    republicanBase: 31.9,
    independent: 22.0,
    undecided: 30.0,
  },
  historicalData: {
    previousElectionResults: {
      dem: 52.75,
      rep: 45.57,
      other: 0.07,
    },
    turnoutRate: 47.86,
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

