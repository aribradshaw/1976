import { createStateData } from './StateData';

export const NewMexico = createStateData({
  name: 'New Mexico',
  abbreviation: 'NM',
  electoralVotes: 4,
  population: {
    total: 1188136,
    votingEligible: 831695,
    registeredVoters: 706940,
  },
  demographics: {
    democraticBase: 33.8,
    republicanBase: 35.6,
    independent: 24.0,
    undecided: 30.0,
  },
  historicalData: {
    previousElectionResults: {
      dem: 48.28,
      rep: 50.75,
      other: 0.27,
    },
    turnoutRate: 50.09,
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

