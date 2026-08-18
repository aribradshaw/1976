export interface AccessibilityPreferences {
  reducedMotion: boolean;
  crtEffects: boolean;
}

const STORAGE_KEY = '1976-election-sim.accessibility-preferences';
export const PREFERENCES_CHANGE_EVENT = '1976-election-sim:preferences-change';

export function getAccessibilityPreferences(): AccessibilityPreferences {
  const saved = readSavedPreferences();
  return {
    // The system setting is the default until a player explicitly chooses a preference.
    reducedMotion: saved?.reducedMotion ?? prefersReducedMotion(),
    crtEffects: saved?.crtEffects ?? true,
  };
}

export function setAccessibilityPreferences(preferences: AccessibilityPreferences): void {
  if (typeof window !== 'undefined') {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(preferences));
  }
  applyAccessibilityPreferences(preferences);
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new Event(PREFERENCES_CHANGE_EVENT));
  }
}

/** Applies preferences at the document root, independent of the app shell. */
export function applyAccessibilityPreferences(preferences = getAccessibilityPreferences()): AccessibilityPreferences {
  if (typeof document !== 'undefined') {
    document.documentElement.dataset.reducedMotion = String(preferences.reducedMotion);
    document.documentElement.dataset.crtEffects = String(preferences.crtEffects);
  }
  return preferences;
}

function readSavedPreferences(): Partial<AccessibilityPreferences> | null {
  if (typeof window === 'undefined') return null;
  try {
    const value: unknown = JSON.parse(window.localStorage.getItem(STORAGE_KEY) ?? 'null');
    if (!value || typeof value !== 'object') return null;
    const candidate = value as Record<string, unknown>;
    return {
      ...(typeof candidate.reducedMotion === 'boolean' ? { reducedMotion: candidate.reducedMotion } : {}),
      ...(typeof candidate.crtEffects === 'boolean' ? { crtEffects: candidate.crtEffects } : {}),
    };
  } catch {
    return null;
  }
}

function prefersReducedMotion(): boolean {
  return typeof window !== 'undefined'
    && typeof window.matchMedia === 'function'
    && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

// Apply the system-derived default before the first visual component paints.
if (typeof document !== 'undefined') {
  applyAccessibilityPreferences();
}
