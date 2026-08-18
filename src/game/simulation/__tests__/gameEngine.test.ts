import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { GameEngine } from '../../GameEngine';
import { EVENTS_1976 } from '../../../data/events1976';

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

  it('applies a historical choice once with deterministic bounded resources', () => {
    const first = new GameEngine('democrat', 'medium', 'event-replay');
    const second = new GameEngine('democrat', 'medium', 'event-replay');
    const event = EVENTS_1976[0];

    const firstResult = first.applyHistoricalEventChoice(event, event.choices[0].id);
    const secondResult = second.applyHistoricalEventChoice(event, event.choices[0].id);

    expect(firstResult).toEqual(secondResult);
    expect(first.getGameState().historicalEvents).toHaveLength(1);
    expect(first.getGameState().resources.credibility).toBeGreaterThanOrEqual(0);
    expect(first.getGameState().resources.credibility).toBeLessThanOrEqual(100);
    expect(first.applyHistoricalEventChoice(event, event.choices[1].id)).toBeNull();
    expect(first.getGameState().historicalEvents).toHaveLength(1);
  });

  it('resolves all 538 electoral votes reproducibly on election night', () => {
    const first = new GameEngine('democrat', 'easy', 'election-night-replay');
    const second = new GameEngine('democrat', 'easy', 'election-night-replay');

    for (let week = 0; week < 25; week += 1) {
      first.endTurn();
      second.endTurn();
    }

    const firstState = first.getGameState();
    const secondState = second.getGameState();
    expect(firstState.finalResults.size).toBe(51);
    expect(firstState.electoralVotes.democrat + firstState.electoralVotes.republican).toBe(538);
    expect(Array.from(firstState.finalResults.entries())).toEqual(Array.from(secondState.finalResults.entries()));
    expect(firstState.electoralVotes).toEqual(secondState.electoralVotes);
  });

  it('saves, restores, and continues the same deterministic campaign', () => {
    const original = new GameEngine('republican', 'medium', 'campaign-save');
    original.applyHistoricalEventChoice(EVENTS_1976[0], EVENTS_1976[0].choices[1].id);
    original.endTurn();
    const restored = GameEngine.restoreCampaign(original.serializeCampaign());

    expect(restored.getGameState()).toEqual(original.getGameState());
    original.endTurn();
    restored.endTurn();
    expect(restored.getGameState()).toEqual(original.getGameState());
  });

  it('never soft-locks a cash-poor campaign on a required historical decision', () => {
    const engine = new GameEngine('democrat', 'medium', 'insolvent-campaign');
    const save = JSON.parse(engine.serializeCampaign()) as { state: { resources: { funds: number } } };
    save.state.resources.funds = 0;
    const restored = GameEngine.restoreCampaign(JSON.stringify(save));

    expect(restored.applyHistoricalEventChoice(EVENTS_1976[0], EVENTS_1976[0].choices[0].id)).not.toBeNull();
    expect(restored.getGameState().resources.funds).toBe(0);
    expect(restored.getGameState().historicalEvents).toHaveLength(1);
  });

  it('applies distinct historical coalition tradeoffs to distinct voter groups', () => {
    const reform = new GameEngine('democrat', 'medium', 'coalition-tradeoffs');
    const competence = new GameEngine('democrat', 'medium', 'coalition-tradeoffs');
    reform.applyHistoricalEventChoice(EVENTS_1976[0], 'clean-government');
    competence.applyHistoricalEventChoice(EVENTS_1976[0], 'competence-first');

    expect(reform.getGameState().microgroupRelationships.get('OH')).not.toEqual(
      competence.getGameState().microgroupRelationships.get('OH'),
    );
  });
});
