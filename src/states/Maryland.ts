import { createStateData } from './StateData';

export const Maryland = createStateData({
  name: 'Maryland',
  abbreviation: 'MD',
  electoralVotes: 10,
  population: {
    total: 4099144,
    votingEligible: 2869400,
    registeredVoters: 2438990,
  },
  demographics: {
    democraticBase: 37.1,
    republicanBase: 32.9,
    independent: 24.0,
    undecided: 30.0,
  },
  historicalData: {
    previousElectionResults: {
      dem: 53.04,
      rep: 46.96,
      other: 0.00,
    },
    turnoutRate: 49.92,
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

