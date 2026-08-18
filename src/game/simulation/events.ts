import { CampaignEventChoice, CampaignEventDefinition, Coalition, EventEffects } from '../../data/events1976';
import { RandomSource } from './rng';

export const EVENT_EFFECT_BOUNDS = {
  funds: 1_000_000,
  energy: 10,
  credibility: 6,
  nationalMomentum: 8,
  coalition: 6,
} as const;

export interface ResolvedCampaignEvent {
  eventId: string;
  choiceId: string;
  week: number;
  publicReaction: 'muted' | 'as_expected' | 'strong';
  effects: EventEffects;
}

export function getEventForWeek(events: readonly CampaignEventDefinition[], week: number): CampaignEventDefinition | undefined {
  return events.find(event => event.week === week);
}

export function getDebateEvents(events: readonly CampaignEventDefinition[]): CampaignEventDefinition[] {
  return events.filter((event): event is CampaignEventDefinition & { debate: NonNullable<CampaignEventDefinition['debate']> } => event.debate !== undefined);
}

/**
 * Resolves only bounded public-reaction variance. Choice effects remain fully
 * inspectable before selection and the result is replayable for a given RNG.
 */
export function resolveCampaignEvent(
  event: CampaignEventDefinition,
  choiceId: string,
  random: RandomSource,
): ResolvedCampaignEvent {
  const choice = event.choices.find(candidate => candidate.id === choiceId);
  if (!choice) {
    throw new RangeError(`Unknown choice '${choiceId}' for event '${event.id}'.`);
  }

  const adjustment = random.nextInt(-choice.volatility, choice.volatility);
  return {
    eventId: event.id,
    choiceId: choice.id,
    week: event.week,
    publicReaction: reactionFor(adjustment),
    effects: resolveEffects(choice, adjustment),
  };
}

export function validateEventTimeline(events: readonly CampaignEventDefinition[], expectedWeeks = 25): string[] {
  const errors: string[] = [];
  const seenWeeks = new Set<number>();

  for (const event of events) {
    if (!Number.isInteger(event.week) || event.week < 1 || event.week > expectedWeeks) {
      errors.push(`${event.id} has an invalid week.`);
    }
    if (seenWeeks.has(event.week)) errors.push(`Week ${event.week} has more than one event.`);
    seenWeeks.add(event.week);
    if (event.choices.length < 2 || event.choices.length > 3) errors.push(`${event.id} must offer two or three choices.`);
    if (event.sourceUrls.length === 0) errors.push(`${event.id} is missing a primary source URL.`);
    if (event.choices.some(choice => !hasMeaningfulEffect(choice))) errors.push(`${event.id} has a choice without a meaningful effect.`);
    const effectSignatures = new Set(event.choices.map(effectSignature));
    if (effectSignatures.size !== event.choices.length) errors.push(`${event.id} has choices with identical effects.`);
  }

  for (let week = 1; week <= expectedWeeks; week += 1) {
    if (!seenWeeks.has(week)) errors.push(`Week ${week} has no event.`);
  }
  return errors;
}

export function hasMeaningfulEffect(choice: CampaignEventChoice): boolean {
  const { effects } = choice;
  return effects.funds !== 0
    || effects.energy !== 0
    || effects.credibility !== 0
    || effects.nationalMomentum !== 0
    || Object.values(effects.coalition).some(delta => delta !== 0);
}

function resolveEffects(choice: CampaignEventChoice, adjustment: number): EventEffects {
  const coalition = Object.fromEntries(
    Object.entries(choice.effects.coalition).map(([name, delta]) => [
      name,
      bounded((delta ?? 0) + adjustment, EVENT_EFFECT_BOUNDS.coalition),
    ]),
  ) as Partial<Record<Coalition, number>>;

  return {
    funds: bounded(choice.effects.funds + adjustment * 25_000, EVENT_EFFECT_BOUNDS.funds),
    energy: bounded(choice.effects.energy, EVENT_EFFECT_BOUNDS.energy),
    credibility: bounded(choice.effects.credibility + adjustment, EVENT_EFFECT_BOUNDS.credibility),
    nationalMomentum: bounded(choice.effects.nationalMomentum + adjustment, EVENT_EFFECT_BOUNDS.nationalMomentum),
    coalition,
  };
}

function bounded(value: number, absoluteLimit: number): number {
  return Math.max(-absoluteLimit, Math.min(absoluteLimit, Number.isFinite(value) ? value : 0));
}

function reactionFor(adjustment: number): ResolvedCampaignEvent['publicReaction'] {
  if (adjustment > 0) return 'strong';
  if (adjustment < 0) return 'muted';
  return 'as_expected';
}

function effectSignature(choice: CampaignEventChoice): string {
  return JSON.stringify({
    funds: choice.effects.funds,
    energy: choice.effects.energy,
    credibility: choice.effects.credibility,
    nationalMomentum: choice.effects.nationalMomentum,
    coalition: Object.entries(choice.effects.coalition).sort(([a], [b]) => a.localeCompare(b)),
  });
}
