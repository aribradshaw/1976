import { useState, useEffect, useRef } from 'react';
import { Candidate } from '../types/game';
import CRTOverlay from './CRTOverlay';
import SpotifyPlayer from './SpotifyPlayer';
import SettingsModal from './SettingsModal';
import SpotifyConnectionModal from './SpotifyConnectionModal';
import { playClickSound, playEndTurnSound } from '../utils/sounds';
import { isSpotifyConnected } from '../utils/spotify';
import './StartScreen.css';

interface StartScreenProps {
  onStart: (candidate: Candidate, difficulty: 'easy' | 'medium' | 'hard') => void;
}

export default function StartScreen({ onStart }: StartScreenProps) {
  const [selectedDifficulty, setSelectedDifficulty] = useState<'easy' | 'medium' | 'hard'>('medium');
  const [selectedCandidate, setSelectedCandidate] = useState<Candidate | null>(null);
  const [showSettings, setShowSettings] = useState(false);
  const [spotifyConnected, setSpotifyConnected] = useState(false);
  const [showSpotifyModal, setShowSpotifyModal] = useState(false);
  const [hasUserInteracted, setHasUserInteracted] = useState(false);
  
  // Refs for TV static audio with fade in/out overlap
  const staticAudio1Ref = useRef<HTMLAudioElement | null>(null);
  const staticAudio2Ref = useRef<HTMLAudioElement | null>(null);
  const fadeIntervalRef = useRef<number | null>(null);
  const currentAudioRef = useRef<0 | 1>(0); // Track which audio is currently playing

  const handleCandidateSelect = (candidate: Candidate) => {
    playClickSound(); // Play click sound
    setSelectedCandidate(candidate);
  };

  const handleStart = () => {
    if (selectedCandidate) {
      playEndTurnSound(); // Play end week sound for start game
      // Stop TV static when starting game
      stopTVStatic();
      onStart(selectedCandidate, selectedDifficulty);
    }
  };

  const handleSpotifyModalConnect = () => {
    // Mark that user has interacted
    setHasUserInteracted(true);
    localStorage.setItem('spotify_modal_shown', 'true');
    setShowSpotifyModal(false);
    // connectSpotify() will redirect, so we don't need to do anything else
  };

  const handleSpotifyModalSkip = () => {
    // Mark that user has interacted
    setHasUserInteracted(true);
    localStorage.setItem('spotify_modal_shown', 'true');
    setShowSpotifyModal(false);
    // TV static will start automatically via useEffect
  };

  // Check Spotify connection status and show modal if needed
  useEffect(() => {
    const checkConnection = () => {
      const connected = isSpotifyConnected();
      setSpotifyConnected(connected);
      
      // Show modal on first load if not connected and user hasn't interacted yet
      if (!connected && !hasUserInteracted && !showSpotifyModal) {
        // Check if we've shown the modal before (stored in localStorage)
        const hasShownModal = localStorage.getItem('spotify_modal_shown') === 'true';
        if (!hasShownModal) {
          setShowSpotifyModal(true);
        } else {
          // If modal was shown before, user has interacted, so start static
          setHasUserInteracted(true);
        }
      }
    };
    
    // Check immediately
    checkConnection();
    // Check every second to detect when Spotify connects
    const interval = setInterval(checkConnection, 1000);
    
    return () => clearInterval(interval);
  }, [hasUserInteracted, showSpotifyModal]);

  // Play TV static with fade in/out overlap when Spotify is not connected
  // Only start after user interaction (from modal)
  useEffect(() => {
    if (spotifyConnected) {
      // Stop static if Spotify connects
      stopTVStatic();
      return;
    }

    // Only start static if user has interacted (clicked modal button)
    if (!hasUserInteracted) {
      return;
    }

    // Start playing TV static after user interaction
    startTVStaticAfterInteraction();

    return () => {
      stopTVStatic();
    };
  }, [spotifyConnected, hasUserInteracted]);

  const startTVStaticAfterInteraction = () => {
    if (!staticAudio1Ref.current || !staticAudio2Ref.current) {
      const BASE_URL = import.meta.env.BASE_URL;
      const staticPath = `${BASE_URL}audio/tvstatic.wav`;
      
      // Create two audio instances for seamless looping with fade
      staticAudio1Ref.current = new Audio(staticPath);
      staticAudio1Ref.current.loop = true;
      staticAudio1Ref.current.volume = 0;
      
      staticAudio2Ref.current = new Audio(staticPath);
      staticAudio2Ref.current.loop = true;
      staticAudio2Ref.current.volume = 0;
    }

    // Start playing with user interaction
    const startAudio = async () => {
      try {
        // Preload audio
        staticAudio1Ref.current!.load();
        staticAudio2Ref.current!.load();
        
        // Wait a bit for audio to load
        await new Promise(resolve => setTimeout(resolve, 200));
        
        console.log('Starting TV static after user interaction...');
        // Set volume to 0 before playing, then fade in
        staticAudio1Ref.current!.volume = 0;
        await staticAudio1Ref.current!.play();
        console.log('TV static playing, initial volume:', staticAudio1Ref.current!.volume, 'paused:', staticAudio1Ref.current!.paused, 'muted:', staticAudio1Ref.current!.muted);
        
        // Fade in first audio (2 seconds to match loop fade)
        fadeIn(staticAudio1Ref.current!, 2000);
        
        // Set up loop with fade overlap
        setupFadeLoop();
      } catch (error) {
        console.error('Could not play TV static:', error);
      }
    };

    startAudio();
  };


  const setupFadeLoop = () => {
    if (!staticAudio1Ref.current || !staticAudio2Ref.current) return;

    const fadeDuration = 2000; // 2 second fade for smooth overlap
    const switchInterval = 25000; // Switch every 25 seconds (audio is 27 seconds, so 2 second overlap)

    // Function to switch to next audio
    const switchToNext = () => {
      if (!staticAudio1Ref.current || !staticAudio2Ref.current) return;

      const currentAudio = currentAudioRef.current === 0 ? staticAudio1Ref.current : staticAudio2Ref.current;
      const nextAudio = currentAudioRef.current === 0 ? staticAudio2Ref.current : staticAudio1Ref.current;

      // Start next audio
      nextAudio.currentTime = 0;
      nextAudio.play().catch(() => {});
      
      // Fade out current, fade in next
      fadeOut(currentAudio, fadeDuration);
      fadeIn(nextAudio, fadeDuration);
      
      // Switch current audio
      currentAudioRef.current = currentAudioRef.current === 0 ? 1 : 0;
    };

    // Set up interval to switch between audio instances every 25 seconds
    // This creates a seamless loop with 2 second fade overlap
    const loopInterval = setInterval(() => {
      if (!staticAudio1Ref.current || !staticAudio2Ref.current) {
        clearInterval(loopInterval);
        return;
      }
      switchToNext();
    }, switchInterval);

    fadeIntervalRef.current = loopInterval as unknown as number;
  };

  const fadeIn = (audio: HTMLAudioElement, duration: number) => {
    if (!audio) return;
    
    const startVolume = audio.volume || 0;
    const targetVolume = 0.3; // 30% volume for TV static
    const startTime = Date.now();
    
    console.log('Fading in audio from', startVolume, 'to', targetVolume);
    
    const fade = () => {
      if (!audio) return;
      
      const elapsed = Date.now() - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const newVolume = startVolume + (targetVolume - startVolume) * progress;
      audio.volume = newVolume;
      
      if (progress < 1) {
        requestAnimationFrame(fade);
      } else {
        audio.volume = targetVolume; // Ensure we end at target volume
        console.log('Fade in complete, final volume:', audio.volume);
      }
    };
    
    fade();
  };

  const fadeOut = (audio: HTMLAudioElement, duration: number) => {
    if (!audio) return;
    
    const startVolume = audio.volume;
    const startTime = Date.now();
    
    const fade = () => {
      if (!audio) return;
      
      const elapsed = Date.now() - startTime;
      const progress = Math.min(elapsed / duration, 1);
      audio.volume = startVolume * (1 - progress);
      
      if (progress < 1) {
        requestAnimationFrame(fade);
      } else {
        audio.pause();
        audio.currentTime = 0;
        audio.volume = 0; // Reset volume
      }
    };
    
    fade();
  };

  const stopTVStatic = () => {
    if (fadeIntervalRef.current) {
      clearInterval(fadeIntervalRef.current);
      fadeIntervalRef.current = null;
    }

    if (staticAudio1Ref.current) {
      fadeOut(staticAudio1Ref.current, 500);
    }
    
    if (staticAudio2Ref.current) {
      fadeOut(staticAudio2Ref.current, 500);
    }
  };

  return (
    <div className="start-screen">
      <SpotifyConnectionModal
        isOpen={showSpotifyModal}
        onConnect={handleSpotifyModalConnect}
        onSkip={handleSpotifyModalSkip}
      />
      <div className="spotify-corner">
        <SpotifyPlayer currentWeek={1} />
      </div>
      <button className="settings-btn-corner" onClick={() => {
        playClickSound(); // Play click sound
        setShowSettings(true);
      }}>
        ⚙️ Settings
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
                          src={`${import.meta.env.BASE_URL}Jimmy_Carter_1977_cropped.jpg`}
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
                          src={`${import.meta.env.BASE_URL}Gerald_Ford_presidential_portrait_(cropped_2).jpg`}
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
                        onClick={() => {
                          playClickSound(); // Play click sound
                          setSelectedDifficulty('easy');
                        }}
                      >
                        Easy
                      </button>
                      <button
                        className={`difficulty-btn ${selectedDifficulty === 'medium' ? 'selected' : ''}`}
                        onClick={() => {
                          playClickSound(); // Play click sound
                          setSelectedDifficulty('medium');
                        }}
                      >
                        Medium
                      </button>
                      <button
                        className={`difficulty-btn ${selectedDifficulty === 'hard' ? 'selected' : ''}`}
                        onClick={() => {
                          playClickSound(); // Play click sound
                          setSelectedDifficulty('hard');
                        }}
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

