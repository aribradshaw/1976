import { ScenarioDefinition, ScenarioSession, StateLookup } from './types';

export function validateScenario(scenario: ScenarioDefinition, states: StateLookup): string[] {
  const errors: string[] = [];
  if (!/^[a-z0-9-]+$/.test(scenario.id)) errors.push('Scenario id must use lowercase letters, digits, and hyphens.');
  if (!Number.isInteger(scenario.year) || scenario.year < 1789) errors.push('Scenario year must be a valid presidential-election-era year.');
  if (!Number.isInteger(scenario.totalWeeks) || scenario.totalWeeks < 1 || scenario.totalWeeks > 52) errors.push('Scenario totalWeeks must be between 1 and 52.');
  if (!Number.isInteger(scenario.totalElectoralVotes) || scenario.totalElectoralVotes < 1) errors.push('Scenario must declare total electoral votes.');
  if (scenario.sourceUrls.length === 0) errors.push('Scenario needs at least one source URL.');
  if (scenario.tickets.democrat.candidate !== 'democrat' || scenario.tickets.republican.candidate !== 'republican') errors.push('Scenario tickets must include one Democratic and one Republican candidate.');
  if (scenario.startingResources.funds < 0 || scenario.startingResources.actionsPerWeek < 1 || scenario.startingResources.energy < 0 || scenario.startingResources.credibility < 0) errors.push('Scenario starting resources are invalid.');

  Object.entries(scenario.stateOverrides).forEach(([abbreviation, override]) => {
    if (!states.has(abbreviation)) errors.push(`Unknown state override: ${abbreviation}.`);
    if (!override.note.trim()) errors.push(`${abbreviation} needs a contributor note.`);
    if (override.sourceUrls.length === 0) errors.push(`${abbreviation} needs a source URL.`);
    if (override.polling) {
      const { democraticSupport, republicanSupport, marginOfError, turnoutRate } = override.polling;
      if (![democraticSupport, republicanSupport, marginOfError, turnoutRate].every(Number.isFinite)) errors.push(`${abbreviation} polling must be finite.`);
      if (democraticSupport < 0 || republicanSupport < 0 || democraticSupport + republicanSupport > 100) errors.push(`${abbreviation} polling support must be between 0 and 100.`);
      if (marginOfError < 0 || marginOfError > 20) errors.push(`${abbreviation} margin of error must be between 0 and 20.`);
      if (turnoutRate < 0 || turnoutRate > 100) errors.push(`${abbreviation} turnout must be between 0 and 100.`);
    }
  });
  return errors;
}

/** A pure handoff object for an eventual GameEngine scenario constructor. */
export function createScenarioSession(
  scenario: ScenarioDefinition,
  playerCandidate: ScenarioSession['playerCandidate'],
  difficulty: ScenarioSession['difficulty'],
  seed = scenario.seed,
): ScenarioSession {
  if (!Number.isInteger(seed)) throw new RangeError('Scenario seed must be an integer.');
  return { scenario, playerCandidate, difficulty, seed };
}
