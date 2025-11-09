import { createStateData } from './StateData';

export const NorthCarolina = createStateData({
  name: 'North Carolina',
  abbreviation: 'NC',
  electoralVotes: 13,
  population: {
    total: 5561883,
    votingEligible: 3893318,
    registeredVoters: 3309320,
  },
  demographics: {
    democraticBase: 38.7,
    republicanBase: 30.9,
    independent: 22.0,
    undecided: 30.0,
  },
  historicalData: {
    previousElectionResults: {
      dem: 55.27,
      rep: 44.22,
      other: 0.13,
    },
    turnoutRate: 43.10,
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

