import { describe, expect, it } from 'vitest';
import { PollingData, StateData } from '../../types/game';
import { buildRoadTo270 } from './roadTo270';

function state(abbreviation: string, electoralVotes: number): StateData {
  return {
    name: abbreviation,
    abbreviation,
    electoralVotes,
    population: { total: 1, votingEligible: 1, registeredVoters: 1 },
    demographics: { democraticBase: 50, republicanBase: 50, independent: 0, undecided: 0 },
    historicalData: { previousElectionResults: { dem: 50, rep: 50, other: 0 }, turnoutRate: 50 },
    campaignModifiers: { mediaMarketCost: 1, eventEffectiveness: 1, fundraisingPotential: 1 },
    regionalFactors: { urbanPercentage: 50, ruralPercentage: 50, swingVoterPercentage: 50 },
  };
}

function polling(stateId: string, democraticSupport: number, republicanSupport: number): PollingData {
  return {
    state: stateId,
    democraticSupport,
    republicanSupport,
    marginOfError: 4,
    lastUpdated: 1,
    turnoutRate: 55,
  };
}

describe('buildRoadTo270', () => {
  it('identifies live projected EVs, must-holds, tipping points, and a Democratic path', () => {
    const states = [state('A', 180), state('B', 80), state('C', 70), state('D', 208)];
    const board = new Map([
      ['A', polling('A', 55, 45)],
      ['B', polling('B', 51, 49)],
      ['C', polling('C', 49, 51)],
      ['D', polling('D', 44, 56)],
    ]);

    const plan = buildRoadTo270({ states, pollingByState: board, candidate: 'democrat' });

    expect(plan.totalElectoralVotes).toBe(538);
    expect(plan.projectedElectoralVotes).toEqual({ democrat: 260, republican: 278 });
    expect(plan.electoralVotesNeeded).toBe(10);
    expect(plan.mustHolds.map(item => item.abbreviation)).toEqual(['B', 'A']);
    expect(plan.tippingPointStates.map(item => item.abbreviation)).toContain('C');
    expect(plan.bestFlips[0].abbreviation).toBe('C');
    expect(plan.pathsTo270).toHaveLength(2);
    expect(plan.pathsTo270[0].statesToFlip.map(item => item.abbreviation)).toEqual(['C']);
    expect(plan.pathsTo270[0].projectedElectoralVotes).toBe(330);
  });

  it('uses the candidate perspective for Republican projections and leaves inputs unchanged', () => {
    const states = [state('A', 300), state('B', 238)];
    const board = new Map([
      ['A', polling('A', 47, 53)],
      ['B', polling('B', 52, 48)],
    ]);

    const plan = buildRoadTo270({ states, pollingByState: board, candidate: 'republican' });

    expect(plan.projectedElectoralVotes).toEqual({ democrat: 238, republican: 300 });
    expect(plan.candidateProjectedElectoralVotes).toBe(300);
    expect(plan.electoralVotesNeeded).toBe(0);
    expect(plan.pathsTo270[0]).toMatchObject({
      statesToFlip: [],
      projectedElectoralVotes: 300,
      weakestLinkProbability: 1,
    });
    expect(board.get('A')?.republicanSupport).toBe(53);
    expect(states[0].electoralVotes).toBe(300);
  });

  it('returns no impossible route when the available flip states cannot reach the target', () => {
    const states = [state('A', 100), state('B', 100)];
    const board = new Map([
      ['A', polling('A', 49, 51)],
      ['B', polling('B', 40, 60)],
    ]);

    const plan = buildRoadTo270({ states, pollingByState: board, candidate: 'democrat', targetElectoralVotes: 270 });

    expect(plan.candidateProjectedElectoralVotes).toBe(0);
    expect(plan.pathsTo270).toEqual([]);
  });
});
