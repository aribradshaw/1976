import { useState, useEffect } from 'react';
import SpotifyPlayer from './SpotifyPlayer';
import { playClickSound, getSoundVolume, setSoundVolume } from '../utils/sounds';
import { GameState } from '../types/game';
import './SettingsModal.css';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  gameState?: GameState;
}

export default function SettingsModal({ isOpen, onClose, gameState }: SettingsModalProps) {
  const [soundVolume, setSoundVolumeState] = useState(() => {
    return getSoundVolume();
  });

  useEffect(() => {
    if (isOpen) {
      setSoundVolumeState(getSoundVolume());
    }
  }, [isOpen]);

  const handleVolumeChange = (volume: number) => {
    setSoundVolume(volume);
    setSoundVolumeState(volume);
    // Play a test sound at the new volume
    playClickSound();
  };

  const getDifficultyLabel = (difficulty: 'easy' | 'medium' | 'hard') => {
    switch (difficulty) {
      case 'easy':
        return 'Easy';
      case 'medium':
        return 'Medium';
      case 'hard':
        return 'Hard';
      default:
        return difficulty;
    }
  };

  if (!isOpen) return null;

  return (
    <div className="settings-modal-overlay" onClick={() => {
      playClickSound(); // Play click sound
      onClose();
    }}>
      <div className="settings-modal" onClick={(e) => e.stopPropagation()}>
        <div className="settings-modal-header">
          <h2>Settings</h2>
          <button className="settings-close-btn" onClick={() => {
            playClickSound(); // Play random click sound
            onClose();
          }}>×</button>
        </div>
        <div className="settings-modal-content">
          {gameState && (
            <div className="settings-section">
              <h3>Game Settings</h3>
              <div className="settings-item">
                <span className="settings-label">Difficulty:</span>
                <span className="settings-value">{getDifficultyLabel(gameState.difficulty)}</span>
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
              <label className="settings-label">Sound Effects Volume:</label>
              <div className="volume-control">
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={soundVolume * 100}
                  onChange={(e) => handleVolumeChange(parseInt(e.target.value) / 100)}
                  className="volume-slider"
                />
                <span className="volume-value">{Math.round(soundVolume * 100)}%</span>
              </div>
            </div>
          </div>

          <div className="settings-section">
            <h3>Spotify Integration</h3>
            <p className="settings-description">
              Connect your Spotify account to automatically play the #1 Billboard song from each week during gameplay.
            </p>
            <SpotifyPlayer currentWeek={gameState?.currentWeek || 1} disableAutoPlay={true} />
          </div>
        </div>
      </div>
    </div>
  );
}

