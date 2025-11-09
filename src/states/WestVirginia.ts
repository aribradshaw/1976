import { createStateData } from './StateData';

export const WestVirginia = createStateData({
  name: 'West Virginia',
  abbreviation: 'WV',
  electoralVotes: 6,
  population: {
    total: 1867481,
    votingEligible: 1307236,
    registeredVoters: 1111150,
  },
  demographics: {
    democraticBase: 40.7,
    republicanBase: 29.3,
    independent: 22.0,
    undecided: 30.0,
  },
  historicalData: {
    previousElectionResults: {
      dem: 58.07,
      rep: 41.93,
      other: 0.00,
    },
    turnoutRate: 57.42,
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

