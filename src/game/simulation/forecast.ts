import { PollingData, StateData } from '../../types/game';

export type ForecastBand = 'safe_democrat' | 'likely_democrat' | 'lean_democrat' | 'toss_up' | 'lean_republican' | 'likely_republican' | 'safe_republican';

export interface StateForecast {
  state: string;
  electoralVotes: number;
  democraticWinProbability: number;
  republicanWinProbability: number;
  band: ForecastBand;
}

export interface ElectoralForecast {
  totalElectoralVotes: number;
  expectedElectoralVotes: { democrat: number; republican: number };
  likelyElectoralVotes: { democrat: number; republican: number };
  stateForecasts: StateForecast[];
}

const PROBABILITY_EPSILON = 0.000001;

export function clamp(value: number, min: number, max: number): number {
  if (!Number.isFinite(value)) return min;
  return Math.max(min, Math.min(max, value));
}

/**
 * Translates a polling margin and its uncertainty into a bounded win
 * probability. A logistic curve is intentionally explainable and stable.
 */
export function democraticWinProbability(democraticSupport: number, republicanSupport: number, marginOfError: number): number {
  const dem = finitePercent(democraticSupport);
  const rep = finitePercent(republicanSupport);
  const uncertainty = clamp(Math.abs(finiteNumber(marginOfError, 5)), 1, 20);
  const scaledMargin = (dem - rep) / uncertainty;
  const probability = 1 / (1 + Math.exp(-scaledMargin));
  return clamp(probability, PROBABILITY_EPSILON, 1 - PROBABILITY_EPSILON);
}

export function forecastBand(probability: number): ForecastBand {
  const bounded = clamp(probability, 0, 1);
  if (bounded >= 0.9) return 'safe_democrat';
  if (bounded >= 0.7) return 'likely_democrat';
  if (bounded >= 0.55) return 'lean_democrat';
  if (bounded > 0.45) return 'toss_up';
  if (bounded > 0.3) return 'lean_republican';
  if (bounded > 0.1) return 'likely_republican';
  return 'safe_republican';
}

export function forecastState(state: StateData, polling: PollingData | undefined): StateForecast {
  const democraticProbability = democraticWinProbability(
    polling?.democraticSupport ?? state.demographics.democraticBase,
    polling?.republicanSupport ?? state.demographics.republicanBase,
    polling?.marginOfError ?? 5,
  );

  return {
    state: state.abbreviation,
    electoralVotes: Math.max(0, Math.floor(finiteNumber(state.electoralVotes, 0))),
    democraticWinProbability: democraticProbability,
    republicanWinProbability: 1 - democraticProbability,
    band: forecastBand(democraticProbability),
  };
}

export function buildElectoralForecast(states: readonly StateData[], pollingByState: ReadonlyMap<string, PollingData>): ElectoralForecast {
  const stateForecasts = states.map(state => forecastState(state, pollingByState.get(state.abbreviation)));
  const expectedDemocrat = stateForecasts.reduce((sum, state) => sum + state.electoralVotes * state.democraticWinProbability, 0);
  const totalElectoralVotes = stateForecasts.reduce((sum, state) => sum + state.electoralVotes, 0);
  const likelyDemocrat = stateForecasts
    .filter(state => state.democraticWinProbability >= 0.5)
    .reduce((sum, state) => sum + state.electoralVotes, 0);

  return {
    totalElectoralVotes,
    expectedElectoralVotes: {
      democrat: expectedDemocrat,
      republican: totalElectoralVotes - expectedDemocrat,
    },
    likelyElectoralVotes: {
      democrat: likelyDemocrat,
      republican: totalElectoralVotes - likelyDemocrat,
    },
    stateForecasts,
  };
}

function finiteNumber(value: number | undefined, fallback: number): number {
  return Number.isFinite(value) ? value as number : fallback;
}

function finitePercent(value: number | undefined): number {
  return clamp(finiteNumber(value, 0), 0, 100);
}
