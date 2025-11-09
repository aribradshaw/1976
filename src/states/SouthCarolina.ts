import { createStateData } from './StateData';

export const SouthCarolina = createStateData({
  name: 'South Carolina',
  abbreviation: 'SC',
  electoralVotes: 8,
  population: {
    total: 2909298,
    votingEligible: 2036508,
    registeredVoters: 1731031,
  },
  demographics: {
    democraticBase: 39.3,
    republicanBase: 30.2,
    independent: 22.0,
    undecided: 30.0,
  },
  historicalData: {
    previousElectionResults: {
      dem: 56.17,
      rep: 43.13,
      other: 0.00,
    },
    turnoutRate: 39.41,
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

