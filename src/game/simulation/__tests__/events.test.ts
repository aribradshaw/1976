import { describe, expect, it } from 'vitest';
import { EVENTS_1976 } from '../../../data/events1976';
import { EVENT_EFFECT_BOUNDS, getDebateEvents, getEventForWeek, resolveCampaignEvent, validateEventTimeline } from '../events';
import { SeededRng } from '../rng';

describe('1976 event timeline', () => {
  it('schedules exactly one sourced, meaningful decision for each campaign week', () => {
    expect(EVENTS_1976).toHaveLength(25);
    expect(validateEventTimeline(EVENTS_1976)).toEqual([]);
    expect(getEventForWeek(EVENTS_1976, 19)?.id).toBe('w19-presidential-debate-one');
    expect(getEventForWeek(EVENTS_1976, 26)).toBeUndefined();
  });

  it('contains the three presidential debates and the first vice-presidential debate at their correct campaign weeks', () => {
    const debates = getDebateEvents(EVENTS_1976);
    expect(debates.filter(event => event.debate === 'presidential').map(event => event.week)).toEqual([19, 21, 23]);
    expect(debates.filter(event => event.debate === 'vice_presidential').map(event => event.week)).toEqual([22]);
    expect(debates.map(event => event.date)).toEqual(['1976-09-21', '1976-10-05', '1976-10-12', '1976-10-19']);
  });

  it('replays a selected event exactly from the same seed', () => {
    const event = getEventForWeek(EVENTS_1976, 19);
    if (!event) throw new Error('Missing first debate event.');

    const first = resolveCampaignEvent(event, 'kitchen-table', new SeededRng('debate-night'));
    const second = resolveCampaignEvent(event, 'kitchen-table', new SeededRng('debate-night'));
    expect(first).toEqual(second);
  });

  it('keeps all resolved effects finite and bounded across every choice and many seeds', () => {
    for (const event of EVENTS_1976) {
      for (const choice of event.choices) {
        for (let seed = 1; seed <= 40; seed += 1) {
          const resolved = resolveCampaignEvent(event, choice.id, new SeededRng(seed));
          expect(Math.abs(resolved.effects.funds)).toBeLessThanOrEqual(EVENT_EFFECT_BOUNDS.funds);
          expect(Math.abs(resolved.effects.energy)).toBeLessThanOrEqual(EVENT_EFFECT_BOUNDS.energy);
          expect(Math.abs(resolved.effects.credibility)).toBeLessThanOrEqual(EVENT_EFFECT_BOUNDS.credibility);
          expect(Math.abs(resolved.effects.nationalMomentum)).toBeLessThanOrEqual(EVENT_EFFECT_BOUNDS.nationalMomentum);
          for (const delta of Object.values(resolved.effects.coalition)) {
            expect(Number.isFinite(delta)).toBe(true);
            expect(Math.abs(delta ?? 0)).toBeLessThanOrEqual(EVENT_EFFECT_BOUNDS.coalition);
          }
        }
      }
    }
  });
});
