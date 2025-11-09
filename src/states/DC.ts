import { createStateData } from './StateData';

export const DC = createStateData({
  name: 'District of Columbia',
  abbreviation: 'DC',
  electoralVotes: 3,
  population: {
    total: 697000,
    votingEligible: 487900,
    registeredVoters: 414715,
  },
  demographics: {
    democraticBase: 75.0,
    republicanBase: 20.0,
    independent: 25.0,
    undecided: 30.0,
  },
  historicalData: {
    previousElectionResults: {
      dem: 75.0,
      rep: 20.0,
      other: 5.0,
    },
    turnoutRate: 60.0,
  },
  campaignModifiers: {
    mediaMarketCost: 1.2,
    eventEffectiveness: 1.1,
    fundraisingPotential: 1.3,
  },
  regionalFactors: {
    urbanPercentage: 100,
    ruralPercentage: 0,
    swingVoterPercentage: 15.0,
  },
});

