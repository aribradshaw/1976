import { HISTORICAL_1976_SCENARIO } from './historical1976';
import { ScenarioDefinition } from './types';

export const SCENARIOS: readonly ScenarioDefinition[] = [HISTORICAL_1976_SCENARIO];

export function getScenario(id: string): ScenarioDefinition | undefined {
  return SCENARIOS.find(scenario => scenario.id === id);
}

export function listScenarios(): readonly ScenarioDefinition[] {
  return SCENARIOS;
}
