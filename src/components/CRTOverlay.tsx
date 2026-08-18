import { useEffect, useState } from 'react';
import {
  AccessibilityPreferences,
  applyAccessibilityPreferences,
  getAccessibilityPreferences,
  PREFERENCES_CHANGE_EVENT,
} from '../utils/preferences';
import './CRTOverlay.css';

export default function CRTOverlay() {
  const [preferences, setPreferences] = useState<AccessibilityPreferences>(() => applyAccessibilityPreferences());

  useEffect(() => {
    const syncPreferences = () => setPreferences(getAccessibilityPreferences());
    window.addEventListener(PREFERENCES_CHANGE_EVENT, syncPreferences);
    return () => window.removeEventListener(PREFERENCES_CHANGE_EVENT, syncPreferences);
  }, []);

  if (!preferences.crtEffects) return null;

  return (
    <div className="crt-overlay" aria-hidden="true">
      <div className="crt-scanlines" />
      <div className="crt-noise" />
      <div className="crt-vignette" />
    </div>
  );
}
