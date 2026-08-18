import { describe, expect, it } from 'vitest';
import { getAllStates } from '../../states';
import { HISTORICAL_1976_SCENARIO } from '../historical1976';
import { getScenario, listScenarios } from '../registry';
import { createScenarioSession, validateScenario } from '../validation';

const stateLookup = new Map(getAllStates().map(state => [state.abbreviation, state]));

describe('scenario boundary', () => {
  it('validates the editable historical 1976 scenario against the current state catalog', () => {
    expect(validateScenario(HISTORICAL_1976_SCENARIO, stateLookup)).toEqual([]);
    expect(HISTORICAL_1976_SCENARIO.totalElectoralVotes).toBe(538);
    expect(HISTORICAL_1976_SCENARIO.eventTimelineId).toBe('1976');
  });

  it('provides deterministic scenario sessions without depending on GameEngine', () => {
    const first = createScenarioSession(HISTORICAL_1976_SCENARIO, 'democrat', 'medium');
    const second = createScenarioSession(HISTORICAL_1976_SCENARIO, 'democrat', 'medium');
    expect(first).toEqual(second);
    expect(first.seed).toBe(19761102);
  });

  it('exposes scenarios through the registry', () => {
    expect(getScenario(HISTORICAL_1976_SCENARIO.id)).toBe(HISTORICAL_1976_SCENARIO);
    expect(listScenarios()).toContain(HISTORICAL_1976_SCENARIO);
  });
});
