import { afterEach, describe, expect, it, vi } from 'vitest';
import { GameEngine } from '../../GameEngine';

describe('full-campaign batch simulation', () => {
  afterEach(() => vi.restoreAllMocks());

  it('finishes many candidate and difficulty combinations without corrupt state', () => {
    vi.spyOn(console, 'log').mockImplementation(() => undefined);
    const candidates = ['democrat', 'republican'] as const;
    const difficulties = ['easy', 'medium', 'hard'] as const;

    for (let run = 0; run < 24; run += 1) {
      const engine = new GameEngine(
        candidates[run % candidates.length],
        difficulties[run % difficulties.length],
        `batch-campaign-${run}`,
      );
      for (let week = 0; week < 25; week += 1) engine.endTurn();

      const state = engine.getGameState();
      expect(state.currentWeek).toBe(26);
      expect(state.gameStatus === 'won' || state.gameStatus === 'lost').toBe(true);
      expect(state.resources.funds).toBeGreaterThanOrEqual(0);
      expect(state.resources.energy).toBeGreaterThanOrEqual(0);
      expect(state.resources.energy).toBeLessThanOrEqual(100);
      expect(state.finalResults.size).toBe(51);
      expect(state.electoralVotes.democrat + state.electoralVotes.republican).toBe(538);
      state.polling.forEach(poll => {
        expect(Number.isFinite(poll.democraticSupport)).toBe(true);
        expect(Number.isFinite(poll.republicanSupport)).toBe(true);
        expect(poll.democraticSupport).toBeGreaterThanOrEqual(0);
        expect(poll.republicanSupport).toBeGreaterThanOrEqual(0);
        expect(poll.turnoutRate).toBeGreaterThanOrEqual(40);
        expect(poll.turnoutRate).toBeLessThanOrEqual(95);
      });
    }
  }, 20_000);
});
