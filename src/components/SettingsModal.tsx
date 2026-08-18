import { KeyboardEvent, MouseEvent, useEffect, useRef, useState } from 'react';
import { playClickSound, getSoundVolume, setSoundVolume } from '../utils/sounds';
import { GameState } from '../types/game';
import {
  AccessibilityPreferences,
  getAccessibilityPreferences,
  PREFERENCES_CHANGE_EVENT,
  setAccessibilityPreferences,
} from '../utils/preferences';
import './SettingsModal.css';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  gameState?: GameState;
}

export default function SettingsModal({ isOpen, onClose, gameState }: SettingsModalProps) {
  const [soundVolume, setSoundVolumeState] = useState(() => getSoundVolume());
  const [accessibility, setAccessibility] = useState<AccessibilityPreferences>(() => getAccessibilityPreferences());
  const dialogRef = useRef<HTMLDivElement>(null);
  const closeButtonRef = useRef<HTMLButtonElement>(null);
  const previousFocusRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    if (isOpen) {
      setSoundVolumeState(getSoundVolume());
      setAccessibility(getAccessibilityPreferences());
    }
  }, [isOpen]);

  useEffect(() => {
    const syncPreferences = () => setAccessibility(getAccessibilityPreferences());
    window.addEventListener(PREFERENCES_CHANGE_EVENT, syncPreferences);
    return () => window.removeEventListener(PREFERENCES_CHANGE_EVENT, syncPreferences);
  }, []);

  useEffect(() => {
    if (!isOpen) return undefined;
    previousFocusRef.current = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    closeButtonRef.current?.focus();

    const handleKeyDown = (event: globalThis.KeyboardEvent) => {
      if (event.key === 'Escape') {
        event.preventDefault();
        onClose();
      }
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      previousFocusRef.current?.focus();
    };
  }, [isOpen, onClose]);

  const handleVolumeChange = (volume: number) => {
    setSoundVolume(volume);
    setSoundVolumeState(volume);
    playClickSound();
  };

  const updateAccessibility = (change: Partial<AccessibilityPreferences>) => {
    const next = { ...accessibility, ...change };
    setAccessibility(next);
    setAccessibilityPreferences(next);
  };

  const closeModal = () => {
    playClickSound();
    onClose();
  };

  const handleDialogKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    if (event.key !== 'Tab') return;
    const focusable = dialogRef.current?.querySelectorAll<HTMLElement>(
      'button:not([disabled]), input:not([disabled]), [href], select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])',
    );
    if (!focusable || focusable.length === 0) return;
    const first = focusable[0];
    const last = focusable[focusable.length - 1];
    if (event.shiftKey && document.activeElement === first) {
      event.preventDefault();
      last.focus();
    } else if (!event.shiftKey && document.activeElement === last) {
      event.preventDefault();
      first.focus();
    }
  };

  const handleOverlayMouseDown = (event: MouseEvent<HTMLDivElement>) => {
    if (event.target === event.currentTarget) closeModal();
  };

  if (!isOpen) return null;

  return (
    <div className="settings-modal-overlay" onMouseDown={handleOverlayMouseDown}>
      <div
        className="settings-modal"
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="settings-modal-title"
        aria-describedby="settings-modal-description"
        onKeyDown={handleDialogKeyDown}
      >
        <div className="settings-modal-header">
          <h2 id="settings-modal-title">Settings</h2>
          <button className="settings-close-btn" ref={closeButtonRef} type="button" onClick={closeModal} aria-label="Close settings">
            ×
          </button>
        </div>
        <div className="settings-modal-content">
          <p className="settings-intro" id="settings-modal-description">Adjust sound effects, accessibility, and visual presentation.</p>
          {gameState && (
            <div className="settings-section">
              <h3>Game Settings</h3>
              <div className="settings-item">
                <span className="settings-label">Difficulty:</span>
                <span className="settings-value">{gameState.difficulty[0].toUpperCase()}{gameState.difficulty.slice(1)}</span>
              </div>
              <div className="settings-item">
                <span className="settings-label">Current Week:</span>
                <span className="settings-value">Week {gameState.currentWeek} of {gameState.totalWeeks}</span>
              </div>
            </div>
          )}

          <div className="settings-section">
            <h3>Audio Settings</h3>
            <div className="settings-item volume-settings-item">
              <label className="settings-label" htmlFor="sound-effects-volume">Sound Effects Volume:</label>
              <div className="volume-control">
                <input
                  id="sound-effects-volume"
                  type="range"
                  min="0"
                  max="100"
                  value={soundVolume * 100}
                  onChange={(event) => handleVolumeChange(parseInt(event.target.value, 10) / 100)}
                  className="volume-slider"
                />
                <span className="volume-value">{Math.round(soundVolume * 100)}%</span>
              </div>
            </div>
          </div>

          <div className="settings-section" aria-labelledby="accessibility-settings-heading">
            <h3 id="accessibility-settings-heading">Accessibility &amp; Visuals</h3>
            <p className="settings-description">Reduced motion follows your system preference until you change it here. Both choices are saved on this device.</p>
            <label className="settings-item settings-toggle">
              <span>
                <span className="settings-label">Reduce motion</span>
                <span className="settings-help">Stops nonessential animation and transitions throughout the game.</span>
              </span>
              <input
                type="checkbox"
                checked={accessibility.reducedMotion}
                onChange={(event) => updateAccessibility({ reducedMotion: event.target.checked })}
              />
              <span className="settings-switch" aria-hidden="true" />
            </label>
            <label className="settings-item settings-toggle">
              <span>
                <span className="settings-label">CRT visual effects</span>
                <span className="settings-help">Shows scanlines, grain, vignette, and television-style presentation.</span>
              </span>
              <input
                type="checkbox"
                checked={accessibility.crtEffects}
                onChange={(event) => updateAccessibility({ crtEffects: event.target.checked })}
              />
              <span className="settings-switch" aria-hidden="true" />
            </label>
          </div>
        </div>
      </div>
    </div>
  );
}
