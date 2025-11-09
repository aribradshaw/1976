import { StateData } from '../types/game';

// Helper function to create state data
export function createStateData(data: Partial<StateData> & { name: string; abbreviation: string; electoralVotes: number }): StateData {
  return {
    name: data.name,
    abbreviation: data.abbreviation,
    electoralVotes: data.electoralVotes,
    population: data.population || {
      total: 0,
      votingEligible: 0,
      registeredVoters: 0,
    },
    demographics: data.demographics || {
      democraticBase: 0,
      republicanBase: 0,
      independent: 0,
      undecided: 0,
    },
    historicalData: data.historicalData || {
      previousElectionResults: {
        dem: 0,
        rep: 0,
        other: 0,
      },
      turnoutRate: 0,
    },
    campaignModifiers: data.campaignModifiers || {
      mediaMarketCost: 1.0,
      eventEffectiveness: 1.0,
      fundraisingPotential: 1.0,
    },
    regionalFactors: data.regionalFactors || {
      urbanPercentage: 0,
      ruralPercentage: 0,
      swingVoterPercentage: 0,
    },
  };
}


