import { createStateData } from './StateData';

export const NewYork = createStateData({
  name: 'New York',
  abbreviation: 'NY',
  electoralVotes: 41,
  population: {
    total: 17829630,
    votingEligible: 12480741,
    registeredVoters: 10608629,
  },
  demographics: {
    democraticBase: 36.4,
    republicanBase: 33.2,
    independent: 24.0,
    undecided: 30.0,
  },
  historicalData: {
    previousElectionResults: {
      dem: 51.95,
      rep: 47.52,
      other: 0.19,
    },
    turnoutRate: 52.28,
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

