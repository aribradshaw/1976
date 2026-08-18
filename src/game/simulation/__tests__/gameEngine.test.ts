import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { GameEngine } from '../../GameEngine';

describe('GameEngine weekly resolution', () => {
  beforeEach(() => {
    vi.spyOn(console, 'log').mockImplementation(() => undefined);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('does not apply a planned action before the week resolves', () => {
    const engine = new GameEngine('democrat', 'easy', 'queue-purity');
    const before = engine.getGameState();

    const accepted = engine.executeAction({
      type: 'large_donor_fundraiser',
      targetState: 'CA',
      cost: 0,
      week: 1,
      description: 'California donor reception',
      fundraisingAmount: 750_000,
    });
    const planned = engine.getGameState();

    expect(accepted).toBe(true);
    expect(planned.fundraisingPotential.get('CA')).toBe(before.fundraisingPotential.get('CA'));
    expect(planned.campaignEvents.get('CA')).toBeUndefined();
    expect(planned.fundraisingBooths).toHaveLength(0);

    expect(engine.removeAction(0)).toBe(true);
    const removed = engine.getGameState();
    expect(removed.actionsThisWeek).toHaveLength(0);
    expect(removed.resources.actionsRemaining).toBe(6);
    expect(removed.resources.funds).toBe(before.resources.funds);
    expect(removed.fundraisingPotential.get('CA')).toBe(before.fundraisingPotential.get('CA'));
  });

  it('allows an early end and replays the same week from the same seed', () => {
    const first = new GameEngine('republican', 'medium', 'week-one-replay');
    const second = new GameEngine('republican', 'medium', 'week-one-replay');

    first.endTurn();
    second.endTurn();

    const firstState = first.getGameState();
    const secondState = second.getGameState();
    expect(firstState.currentWeek).toBe(2);
    expect(firstState.simulationSeed).toBe(secondState.simulationSeed);
    expect(Array.from(firstState.polling.entries())).toEqual(Array.from(secondState.polling.entries()));
    expect(Array.from(firstState.campaignActivities.entries())).toEqual(Array.from(secondState.campaignActivities.entries()));
  });
});
