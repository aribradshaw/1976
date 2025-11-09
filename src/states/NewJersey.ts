import { createStateData } from './StateData';

export const NewJersey = createStateData({
  name: 'New Jersey',
  abbreviation: 'NJ',
  electoralVotes: 17,
  population: {
    total: 7286159,
    votingEligible: 5100311,
    registeredVoters: 4335264,
  },
  demographics: {
    democraticBase: 33.5,
    republicanBase: 35.0,
    independent: 24.0,
    undecided: 30.0,
  },
  historicalData: {
    previousElectionResults: {
      dem: 47.92,
      rep: 50.08,
      other: 0.31,
    },
    turnoutRate: 59.10,
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

