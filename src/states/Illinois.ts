import { createStateData } from './StateData';

export const Illinois = createStateData({
  name: 'Illinois',
  abbreviation: 'IL',
  electoralVotes: 26,
  population: {
    total: 11301501,
    votingEligible: 7911050,
    registeredVoters: 6724392,
  },
  demographics: {
    democraticBase: 33.7,
    republicanBase: 35.0,
    independent: 24.0,
    undecided: 30.0,
  },
  historicalData: {
    previousElectionResults: {
      dem: 48.13,
      rep: 50.10,
      other: 0.17,
    },
    turnoutRate: 59.65,
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

