import { createStateData } from './StateData';

export const Hawaii = createStateData({
  name: 'Hawaii',
  abbreviation: 'HI',
  electoralVotes: 4,
  population: {
    total: 886239,
    votingEligible: 620367,
    registeredVoters: 527311,
  },
  demographics: {
    democraticBase: 35.4,
    republicanBase: 33.7,
    independent: 24.0,
    undecided: 30.0,
  },
  historicalData: {
    previousElectionResults: {
      dem: 50.59,
      rep: 48.06,
      other: 1.35,
    },
    turnoutRate: 46.96,
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

