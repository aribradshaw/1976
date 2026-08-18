import { describe, expect, it } from 'vitest';
import { getAllStates } from '../../../states';
import { PollingData } from '../../../types/game';
import { buildElectoralForecast, democraticWinProbability, forecastState } from '../forecast';
import { SeededRng } from '../rng';

describe('forecast helpers', () => {
  it('preserves all 538 electoral votes', () => {
    const forecast = buildElectoralForecast(getAllStates(), new Map());

    expect(forecast.totalElectoralVotes).toBe(538);
    expect(forecast.likelyElectoralVotes.democrat + forecast.likelyElectoralVotes.republican).toBe(538);
    expect(forecast.expectedElectoralVotes.democrat + forecast.expectedElectoralVotes.republican).toBe(538);
  });

  it('keeps probabilities finite and bounded over many seeded polling boards', () => {
    const states = getAllStates();

    for (let seed = 1; seed <= 250; seed += 1) {
      const rng = new SeededRng(seed);
      const polling = new Map<string, PollingData>(states.map(state => [state.abbreviation, {
        state: state.abbreviation,
        democraticSupport: rng.next() * 150 - 25,
        republicanSupport: rng.next() * 150 - 25,
        marginOfError: rng.next() * 30 - 5,
        turnoutRate: rng.next() * 100,
        lastUpdated: 1,
      }]));
      const forecast = buildElectoralForecast(states, polling);

      expect(Number.isFinite(forecast.expectedElectoralVotes.democrat)).toBe(true);
      expect(Number.isFinite(forecast.expectedElectoralVotes.republican)).toBe(true);
      for (const state of forecast.stateForecasts) {
        expect(state.democraticWinProbability).toBeGreaterThan(0);
        expect(state.democraticWinProbability).toBeLessThan(1);
        expect(state.democraticWinProbability + state.republicanWinProbability).toBeCloseTo(1, 12);
      }
    }
  });

  it('increases Democratic probability when a polling margin improves', () => {
    expect(democraticWinProbability(52, 48, 3)).toBeGreaterThan(democraticWinProbability(48, 52, 3));
    expect(forecastState(getAllStates()[0], undefined).band).toBeDefined();
  });
});
