import { createStateData } from './StateData';

export const Michigan = createStateData({
  name: 'Michigan',
  abbreviation: 'MI',
  electoralVotes: 21,
  population: {
    total: 9107280,
    votingEligible: 6375096,
    registeredVoters: 5418831,
  },
  demographics: {
    democraticBase: 32.5,
    republicanBase: 36.3,
    independent: 24.0,
    undecided: 30.0,
  },
  historicalData: {
    previousElectionResults: {
      dem: 46.44,
      rep: 51.83,
      other: 0.15,
    },
    turnoutRate: 57.31,
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

