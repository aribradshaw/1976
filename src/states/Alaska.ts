import { createStateData } from './StateData';

export const Alaska = createStateData({
  name: 'Alaska',
  abbreviation: 'AK',
  electoralVotes: 3,
  population: {
    total: 361263,
    votingEligible: 252884,
    registeredVoters: 214951,
  },
  demographics: {
    democraticBase: 24.9,
    republicanBase: 40.5,
    independent: 26.0,
    undecided: 30.0,
  },
  historicalData: {
    previousElectionResults: {
      dem: 35.65,
      rep: 57.90,
      other: 5.49,
    },
    turnoutRate: 48.87,
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

