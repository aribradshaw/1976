import { createStateData } from './StateData';

export const NewHampshire = createStateData({
  name: 'New Hampshire',
  abbreviation: 'NH',
  electoralVotes: 4,
  population: {
    total: 847438,
    votingEligible: 593206,
    registeredVoters: 504225,
  },
  demographics: {
    democraticBase: 30.5,
    republicanBase: 38.4,
    independent: 24.0,
    undecided: 30.0,
  },
  historicalData: {
    previousElectionResults: {
      dem: 43.47,
      rep: 54.75,
      other: 0.28,
    },
    turnoutRate: 57.25,
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

