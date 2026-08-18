import { createStateData } from './StateData';

export const Maine = createStateData({
  name: 'Maine',
  abbreviation: 'ME',
  electoralVotes: 4,
  population: {
    total: 1071615,
    votingEligible: 750130,
    registeredVoters: 637610,
  },
  demographics: {
    democraticBase: 33.7,
    republicanBase: 34.2,
    independent: 24.0,
    undecided: 30.0,
  },
  historicalData: {
    previousElectionResults: {
      dem: 48.07,
      rep: 48.91,
      other: 0.00,
    },
    turnoutRate: 64.42,
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

