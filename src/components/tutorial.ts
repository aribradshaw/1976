export const TUTORIAL_STORAGE_KEY = '1976-election-sim.campaign-tour-complete:v1';

export interface TutorialStep {
  id: string;
  target: string;
  eyebrow: string;
  title: string;
  body: string;
}

export const CAMPAIGN_TUTORIAL_STEPS: readonly TutorialStep[] = [
  {
    id: 'scoreboard',
    target: '[data-tutorial-target="campaign-header"]',
    eyebrow: 'Campaign desk',
    title: 'Read the race at a glance',
    body: 'Your candidate, current week, and saved campaign seed stay in view here. Every choice is part of one continuous historical campaign.',
  },
  {
    id: 'map',
    target: '.map-view-switcher',
    eyebrow: 'Electoral board',
    title: 'The map is your battlefield',
    body: 'Select a state to inspect its polling, voters, and local opportunities. The table view is available when you want to compare every state.',
  },
  {
    id: 'actions',
    target: '.right-panel .action-panel > h3',
    eyebrow: 'Campaign desk',
    title: 'Choose campaign actions',
    body: 'Select a state, then choose rallies, ads, headquarters, or fundraising here. Costs and local conditions shape your route.',
  },
  {
    id: 'week-plan',
    target: '.right-panel .end-turn-btn',
    eyebrow: 'Weekly rundown',
    title: 'Resolve the week',
    body: 'Schedule any actions you want, then advance. Empty days are allowed, but produce no campaign impact.',
  },
];

export function hasCompletedTutorial(storage: Pick<Storage, 'getItem'> | null = getBrowserStorage()): boolean {
  return storage?.getItem(TUTORIAL_STORAGE_KEY) === 'true';
}

export function markTutorialComplete(storage: Pick<Storage, 'setItem'> | null = getBrowserStorage()): void {
  storage?.setItem(TUTORIAL_STORAGE_KEY, 'true');
}

export function shouldLaunchTutorial(storage: Pick<Storage, 'getItem'> | null = getBrowserStorage()): boolean {
  return !hasCompletedTutorial(storage);
}

function getBrowserStorage(): Storage | null {
  try {
    return typeof window === 'undefined' ? null : window.localStorage;
  } catch {
    return null;
  }
}
