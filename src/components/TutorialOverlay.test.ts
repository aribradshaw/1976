import { describe, expect, it } from 'vitest';
import {
  CAMPAIGN_TUTORIAL_STEPS,
  TUTORIAL_STORAGE_KEY,
  hasCompletedTutorial,
  markTutorialComplete,
  shouldLaunchTutorial,
} from './tutorial';

describe('campaign tutorial contract', () => {
  it('keeps each guided step tied to a live campaign target', () => {
    expect(CAMPAIGN_TUTORIAL_STEPS).toHaveLength(4);
    expect(CAMPAIGN_TUTORIAL_STEPS.map(step => step.id)).toEqual(['scoreboard', 'map', 'actions', 'week-plan']);
    expect(CAMPAIGN_TUTORIAL_STEPS.every(step => step.target.length > 0 && step.title.length > 0 && step.body.length > 0)).toBe(true);
  });

  it('launches only until the player completes or skips the tour', () => {
    const values = new Map<string, string>();
    const storage = {
      getItem: (key: string) => values.get(key) ?? null,
      setItem: (key: string, value: string) => values.set(key, value),
    };

    expect(shouldLaunchTutorial(storage)).toBe(true);
    expect(hasCompletedTutorial(storage)).toBe(false);
    markTutorialComplete(storage);
    expect(values.get(TUTORIAL_STORAGE_KEY)).toBe('true');
    expect(hasCompletedTutorial(storage)).toBe(true);
    expect(shouldLaunchTutorial(storage)).toBe(false);
  });
});
