import { createStateData } from './StateData';

export const Ohio = createStateData({
  name: 'Ohio',
  abbreviation: 'OH',
  electoralVotes: 25,
  population: {
    total: 10739384,
    votingEligible: 7517568,
    registeredVoters: 6389932,
  },
  demographics: {
    democraticBase: 34.2,
    republicanBase: 34.0,
    independent: 24.0,
    undecided: 30.0,
  },
  historicalData: {
    previousElectionResults: {
      dem: 48.92,
      rep: 48.65,
      other: 0.22,
    },
    turnoutRate: 54.70,
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

