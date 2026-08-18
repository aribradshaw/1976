import { PollingData, StateData } from '../../types/game';
import { ForecastBand, forecastState } from '../simulation/forecast';

export type StrategyCandidate = 'democrat' | 'republican';

export interface RoadTo270Input {
  states: readonly StateData[];
  pollingByState: ReadonlyMap<string, PollingData>;
  candidate: StrategyCandidate;
  targetElectoralVotes?: number;
  maxPaths?: number;
}

export interface RoadTo270State {
  abbreviation: string;
  name: string;
  electoralVotes: number;
  candidateWinProbability: number;
  projectedWinner: StrategyCandidate;
  margin: number;
  band: ForecastBand;
}

export interface RoadTo270Path {
  label: string;
  statesToFlip: RoadTo270State[];
  electoralVotesGained: number;
  projectedElectoralVotes: number;
  weakestLinkProbability: number;
}

export interface RoadTo270Plan {
  candidate: StrategyCandidate;
  targetElectoralVotes: number;
  totalElectoralVotes: number;
  projectedElectoralVotes: { democrat: number; republican: number };
  candidateProjectedElectoralVotes: number;
  electoralVotesNeeded: number;
  tippingPointStates: RoadTo270State[];
  mustHolds: RoadTo270State[];
  bestFlips: RoadTo270State[];
  pathsTo270: RoadTo270Path[];
}

const DEFAULT_TARGET = 270;
const DEFAULT_MAX_PATHS = 3;
const MAX_PATH_CANDIDATES = 12;

/**
 * Produces an explainable, deterministic strategy readout from the current
 * polling board. It does not mutate polling, state data, or the supplied map.
 */
export function buildRoadTo270(input: RoadTo270Input): RoadTo270Plan {
  const targetElectoralVotes = positiveInteger(input.targetElectoralVotes, DEFAULT_TARGET);
  const maxPaths = Math.min(3, positiveInteger(input.maxPaths, DEFAULT_MAX_PATHS));
  const states = input.states
    .map(state => toRoadState(state, input.pollingByState.get(state.abbreviation), input.candidate))
    .filter(state => state.electoralVotes > 0);
  const candidateStates = states.filter(state => state.projectedWinner === input.candidate);
  const oppositionStates = states.filter(state => state.projectedWinner !== input.candidate);
  const candidateProjectedElectoralVotes = sumElectoralVotes(candidateStates);
  const totalElectoralVotes = sumElectoralVotes(states);
  const projectedElectoralVotes = input.candidate === 'democrat'
    ? {
        democrat: candidateProjectedElectoralVotes,
        republican: totalElectoralVotes - candidateProjectedElectoralVotes,
      }
    : {
        democrat: totalElectoralVotes - candidateProjectedElectoralVotes,
        republican: candidateProjectedElectoralVotes,
      };
  const electoralVotesNeeded = Math.max(0, targetElectoralVotes - candidateProjectedElectoralVotes);
  const bestFlips = [...oppositionStates].sort(compareFlipPriority);
  const tippingPointStates = [...states]
    .filter(state => Math.abs(state.candidateWinProbability - 0.5) <= 0.15)
    .sort(compareTippingPoint);
  const mustHolds = candidateStates
    .filter(state => candidateProjectedElectoralVotes - state.electoralVotes < targetElectoralVotes)
    .sort(compareTippingPoint);

  return {
    candidate: input.candidate,
    targetElectoralVotes,
    totalElectoralVotes,
    projectedElectoralVotes,
    candidateProjectedElectoralVotes,
    electoralVotesNeeded,
    tippingPointStates,
    mustHolds,
    bestFlips,
    pathsTo270: buildPaths(candidateProjectedElectoralVotes, targetElectoralVotes, bestFlips, maxPaths),
  };
}

function toRoadState(state: StateData, polling: PollingData | undefined, candidate: StrategyCandidate): RoadTo270State {
  const forecast = forecastState(state, polling);
  const candidateWinProbability = candidate === 'democrat'
    ? forecast.democraticWinProbability
    : forecast.republicanWinProbability;
  const democraticSupport = finitePercent(polling?.democraticSupport ?? state.demographics.democraticBase);
  const republicanSupport = finitePercent(polling?.republicanSupport ?? state.demographics.republicanBase);
  const margin = candidate === 'democrat'
    ? democraticSupport - republicanSupport
    : republicanSupport - democraticSupport;

  return {
    abbreviation: state.abbreviation,
    name: state.name,
    electoralVotes: Math.max(0, Math.floor(finiteNumber(state.electoralVotes))),
    candidateWinProbability,
    projectedWinner: candidateWinProbability >= 0.5 ? candidate : opposingCandidate(candidate),
    margin,
    band: forecast.band,
  };
}

function buildPaths(
  currentElectoralVotes: number,
  targetElectoralVotes: number,
  bestFlips: readonly RoadTo270State[],
  maxPaths: number,
): RoadTo270Path[] {
  if (currentElectoralVotes >= targetElectoralVotes) {
    return [{
      label: `Hold the current ${currentElectoralVotes}-EV map`,
      statesToFlip: [],
      electoralVotesGained: 0,
      projectedElectoralVotes: currentElectoralVotes,
      weakestLinkProbability: 1,
    }];
  }

  const candidates = bestFlips.slice(0, MAX_PATH_CANDIDATES);
  const paths: RoadTo270Path[] = [];
  const seenPaths = new Set<string>();

  for (let preferredIndex = 0; preferredIndex < Math.min(maxPaths, candidates.length); preferredIndex += 1) {
    const preferred = candidates[preferredIndex];
    const selection = preferred ? [preferred] : [];
    let projectedElectoralVotes = currentElectoralVotes + sumElectoralVotes(selection);

    for (const state of candidates) {
      if (projectedElectoralVotes >= targetElectoralVotes) break;
      if (state.abbreviation === preferred?.abbreviation) continue;
      selection.push(state);
      projectedElectoralVotes += state.electoralVotes;
    }

    if (projectedElectoralVotes < targetElectoralVotes) continue;

    const pathKey = selection.map(state => state.abbreviation).sort().join('|');
    if (seenPaths.has(pathKey)) continue;
    seenPaths.add(pathKey);

    const electoralVotesGained = sumElectoralVotes(selection);
    paths.push({
      label: `Flip ${selection.map(state => state.abbreviation).join(' + ')}`,
      statesToFlip: selection,
      electoralVotesGained,
      projectedElectoralVotes,
      weakestLinkProbability: Math.min(...selection.map(state => state.candidateWinProbability)),
    });
  }

  return paths;
}

function compareFlipPriority(left: RoadTo270State, right: RoadTo270State): number {
  if (right.candidateWinProbability !== left.candidateWinProbability) {
    return right.candidateWinProbability - left.candidateWinProbability;
  }
  return right.electoralVotes - left.electoralVotes;
}

function compareTippingPoint(left: RoadTo270State, right: RoadTo270State): number {
  const leftDistance = Math.abs(left.candidateWinProbability - 0.5);
  const rightDistance = Math.abs(right.candidateWinProbability - 0.5);
  if (leftDistance !== rightDistance) return leftDistance - rightDistance;
  return right.electoralVotes - left.electoralVotes;
}

function sumElectoralVotes(states: readonly RoadTo270State[]): number {
  return states.reduce((sum, state) => sum + state.electoralVotes, 0);
}

function opposingCandidate(candidate: StrategyCandidate): StrategyCandidate {
  return candidate === 'democrat' ? 'republican' : 'democrat';
}

function finiteNumber(value: number): number {
  return Number.isFinite(value) ? value : 0;
}

function finitePercent(value: number): number {
  return Math.max(0, Math.min(100, finiteNumber(value)));
}

function positiveInteger(value: number | undefined, fallback: number): number {
  if (!Number.isFinite(value) || !value || value < 1) return fallback;
  return Math.floor(value);
}
