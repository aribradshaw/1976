import { useState } from 'react';
import { Candidate } from '../types/game';
import CRTOverlay from './CRTOverlay';
import './StartScreen.css';

interface StartScreenProps {
  onStart: (candidate: Candidate, difficulty: 'easy' | 'medium' | 'hard') => void;
}

export default function StartScreen({ onStart }: StartScreenProps) {
  const [selectedDifficulty, setSelectedDifficulty] = useState<'easy' | 'medium' | 'hard'>('medium');
  const [selectedCandidate, setSelectedCandidate] = useState<Candidate | null>(null);

  const handleCandidateSelect = (candidate: Candidate) => {
    setSelectedCandidate(candidate);
  };

  const handleStart = () => {
    if (selectedCandidate) {
      onStart(selectedCandidate, selectedDifficulty);
    }
  };

  return (
    <div className="start-screen">
      <div className="tv-cabinet">
        <div className="tv-screen-area">
          <div className="tv-screen-bezel">
            <div className="tv-screen">
              <CRTOverlay />
              <div className="start-content">
                <h1 className="game-title">1976</h1>
                <p className="game-subtitle">As Seen on TV!</p>
                <p className="game-description">
                  Take control of a presidential campaign in one of the closest elections in U.S. history.
                  Navigate 25 weeks of campaigning across all 50 states to secure 270 electoral votes.
                </p>
                {!selectedCandidate ? (
                  <div className="candidate-selection">
                    <h2>Choose Your Candidate</h2>
                    <div className="candidate-buttons">
                      <button 
                        className="candidate-btn democrat"
                        onClick={() => handleCandidateSelect('democrat')}
                      >
                        <img 
                          src="/Jimmy_Carter_1977_cropped.jpg" 
                          alt="Jimmy Carter" 
                          className="candidate-image"
                        />
                        <div className="candidate-name">Jimmy Carter</div>
                        <div className="candidate-party">Democrat</div>
                      </button>
                      <button 
                        className="candidate-btn republican"
                        onClick={() => handleCandidateSelect('republican')}
                      >
                        <img 
                          src="/Gerald_Ford_presidential_portrait_(cropped_2).jpg" 
                          alt="Gerald Ford" 
                          className="candidate-image"
                        />
                        <div className="candidate-name">Gerald Ford</div>
                        <div className="candidate-party">Republican</div>
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="difficulty-selection">
                    <h2>Select Difficulty</h2>
                    <div className="difficulty-buttons">
                      <button
                        className={`difficulty-btn ${selectedDifficulty === 'easy' ? 'selected' : ''}`}
                        onClick={() => setSelectedDifficulty('easy')}
                      >
                        Easy
                      </button>
                      <button
                        className={`difficulty-btn ${selectedDifficulty === 'medium' ? 'selected' : ''}`}
                        onClick={() => setSelectedDifficulty('medium')}
                      >
                        Medium
                      </button>
                      <button
                        className={`difficulty-btn ${selectedDifficulty === 'hard' ? 'selected' : ''}`}
                        onClick={() => setSelectedDifficulty('hard')}
                      >
                        Hard
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

