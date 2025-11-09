import { createStateData } from './StateData';

export const Tennessee = createStateData({
  name: 'Tennessee',
  abbreviation: 'TN',
  electoralVotes: 10,
  population: {
    total: 4324146,
    votingEligible: 3026902,
    registeredVoters: 2572866,
  },
  demographics: {
    democraticBase: 39.1,
    republicanBase: 30.0,
    independent: 22.0,
    undecided: 30.0,
  },
  historicalData: {
    previousElectionResults: {
      dem: 55.94,
      rep: 42.94,
      other: 0.09,
    },
    turnoutRate: 48.77,
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

