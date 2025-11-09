import { createStateData } from './StateData';

export const RhodeIsland = createStateData({
  name: 'Rhode Island',
  abbreviation: 'RI',
  electoralVotes: 4,
  population: {
    total: 946982,
    votingEligible: 662887,
    registeredVoters: 563453,
  },
  demographics: {
    democraticBase: 38.8,
    republicanBase: 30.9,
    independent: 22.0,
    undecided: 30.0,
  },
  historicalData: {
    previousElectionResults: {
      dem: 55.36,
      rep: 44.08,
      other: 0.17,
    },
    turnoutRate: 62.03,
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

