import { createStateData } from './StateData';

export const Georgia = createStateData({
  name: 'Georgia',
  abbreviation: 'GA',
  electoralVotes: 12,
  population: {
    total: 5113693,
    votingEligible: 3579585,
    registeredVoters: 3042647,
  },
  demographics: {
    democraticBase: 46.7,
    republicanBase: 23.1,
    independent: 22.0,
    undecided: 30.0,
  },
  historicalData: {
    previousElectionResults: {
      dem: 66.74,
      rep: 32.96,
      other: 0.01,
    },
    turnoutRate: 41.00,
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

