import { useState } from 'react';
import { Candidate } from '../types/game';
import CRTOverlay from './CRTOverlay';
import SpotifyPlayer from './SpotifyPlayer';
import SettingsModal from './SettingsModal';
import { playClickSound, playEndTurnSound } from '../utils/sounds';
import packageJson from '../../package.json';
import './StartScreen.css';

interface StartScreenProps {
  onStart: (candidate: Candidate, difficulty: 'easy' | 'medium' | 'hard') => void;
  onResume?: () => void;
  hasSavedGame?: boolean;
}

export default function StartScreen({ onStart, onResume, hasSavedGame = false }: StartScreenProps) {
  const [selectedDifficulty, setSelectedDifficulty] = useState<'easy' | 'medium' | 'hard'>('medium');
  const [selectedCandidate, setSelectedCandidate] = useState<Candidate | null>(null);
  const [showSettings, setShowSettings] = useState(false);
  
  const handleCandidateSelect = (candidate: Candidate) => {
    playClickSound(); // Play click sound
    setSelectedCandidate(candidate);
  };

  const handleStart = () => {
    if (selectedCandidate) {
      playEndTurnSound(); // Play end week sound for start game
      onStart(selectedCandidate, selectedDifficulty);
    }
  };

  return (
    <div className="start-screen">
      <div className="spotify-corner">
        <SpotifyPlayer currentWeek={1} />
      </div>
      <button className="settings-btn-corner" onClick={() => {
        playClickSound(); // Play click sound
        setShowSettings(true);
      }}>
        Settings
      </button>
      <SettingsModal 
        isOpen={showSettings} 
        onClose={() => {
          playClickSound(); // Play click sound
          setShowSettings(false);
        }} 
      />
      <div className="tv-cabinet">
        <div className="tv-screen-area">
          <div className="tv-screen-bezel">
            <div className="tv-screen">
              <CRTOverlay />
              <div className="start-content">
                <h1 className="game-title">1976</h1>
                <p className="game-subtitle">As Seen on TV!</p>
                <p className="game-version">v{packageJson.version}</p>
                <p className="game-description">
                  Take control of a presidential campaign in one of the closest elections in U.S. history.
                  Navigate 25 weeks of campaigning across all 50 states to secure 270 electoral votes.
                </p>
                {!selectedCandidate ? (
                  <div className="candidate-selection">
                    <h2>Choose Your Candidate</h2>
                    {hasSavedGame && onResume ? (
                      <button className="resume-campaign-btn" onClick={onResume}>
                        Resume saved campaign
                      </button>
                    ) : null}
                    <div className="candidate-buttons">
                      <button 
                        className="candidate-btn democrat"
                        onClick={() => handleCandidateSelect('democrat')}
                      >
                        <img 
                          src={`${import.meta.env.BASE_URL}Jimmy_Carter_1977_cropped.jpg`}
                          alt="Jimmy Carter" 
                          className="candidate-image"
                        />
                        <div className="candidate-name">Jimmy Carter</div>
                        <div className="candidate-party">Democrat</div>
                        <p className="candidate-strategy">Outsider trust, Southern reach, and persuasion upside.</p>
                      </button>
                      <button 
                        className="candidate-btn republican"
                        onClick={() => handleCandidateSelect('republican')}
                      >
                        <img 
                          src={`${import.meta.env.BASE_URL}Gerald_Ford_presidential_portrait_(cropped_2).jpg`}
                          alt="Gerald Ford" 
                          className="candidate-image"
                        />
                        <div className="candidate-name">Gerald Ford</div>
                        <div className="candidate-party">Republican</div>
                        <p className="candidate-strategy">Incumbency, governing credibility, and organizational strength.</p>
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="difficulty-selection">
                    <h2>Select Difficulty</h2>
                    <div className="difficulty-buttons">
                      <button
                        className={`difficulty-btn ${selectedDifficulty === 'easy' ? 'selected' : ''}`}
                        onClick={() => {
                          playClickSound(); // Play click sound
                          setSelectedDifficulty('easy');
                        }}
                      >
                        <strong>Easy</strong>
                        <span>More forgiving opponent planning</span>
                      </button>
                      <button
                        className={`difficulty-btn ${selectedDifficulty === 'medium' ? 'selected' : ''}`}
                        onClick={() => {
                          playClickSound(); // Play click sound
                          setSelectedDifficulty('medium');
                        }}
                      >
                        <strong>Medium</strong>
                        <span>Fair budgets and strategic counterplay</span>
                      </button>
                      <button
                        className={`difficulty-btn ${selectedDifficulty === 'hard' ? 'selected' : ''}`}
                        onClick={() => {
                          playClickSound(); // Play click sound
                          setSelectedDifficulty('hard');
                        }}
                      >
                        <strong>Hard</strong>
                        <span>Sharper targeting with no hidden bonus actions</span>
                      </button>
                    </div>
                    <button
                      className="start-game-btn"
                      onClick={handleStart}
                    >
                      Start Game
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
          <div className="tv-controls">
            <div className="tv-control-panel">
              <div className="tv-indicator-light"></div>
              <div className="tv-knob tv-knob-large">
                <div className="knob-indicator"></div>
              </div>
              <div className="tv-knob tv-knob-small">
                <div className="knob-indicator"></div>
              </div>
            </div>
            <div className="tv-speaker-grille">
              <div className="grille-slat"></div>
              <div className="grille-slat"></div>
              <div className="grille-slat"></div>
              <div className="grille-slat"></div>
              <div className="grille-slat"></div>
              <div className="grille-slat"></div>
              <div className="grille-slat"></div>
              <div className="grille-slat"></div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

