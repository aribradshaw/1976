import { useState, useEffect } from 'react';
import { GameEngine } from '../game/GameEngine';
import { GameState, Candidate } from '../types/game';
import { TopicId, TOPICS } from '../data/topics';
import './WeeklyEventModal.css';

interface WeeklyEventModalProps {
  gameEngine: GameEngine;
  gameState: GameState;
  playerCandidate: Candidate;
  onAnswer: (topicId: TopicId, position: 'for' | 'against') => void;
  onClose?: () => void;
}

export default function WeeklyEventModal({ 
  gameEngine, 
  gameState, 
  playerCandidate,
  onAnswer,
  onClose
}: WeeklyEventModalProps) {
  const [randomTopic, setRandomTopic] = useState<TopicId | null>(null);
  const [selectedPosition, setSelectedPosition] = useState<'for' | 'against' | null>(null);
  const [showTip, setShowTip] = useState(() => {
    const tipDismissed = localStorage.getItem('weeklyEventTipDismissed');
    return tipDismissed !== 'true';
  });
  const [dontShowAgain, setDontShowAgain] = useState(false);

  useEffect(() => {
    // Get a random topic that hasn't been locked yet
    const lockedTopics = Array.from(gameState.topicPositions.keys());
    const availableTopics = TOPICS
      .map(t => t.id)
      .filter(topicId => !lockedTopics.includes(topicId));
    
    if (availableTopics.length === 0) {
      // All topics are locked, don't show event
      // Close the modal to prevent showing "Loading..." indefinitely
      setRandomTopic(null);
      // Close the modal if onClose callback is provided
      if (onClose) {
        // Use setTimeout to avoid calling onClose during render
        setTimeout(() => {
          onClose();
        }, 0);
      }
      return;
    }
    
    const randomIndex = Math.floor(Math.random() * availableTopics.length);
    setRandomTopic(availableTopics[randomIndex]);
    setSelectedPosition(null); // Reset position selection
    
    // Show tip on first weekly event (when no positions are locked yet)
    if (lockedTopics.length === 0 && showTip) {
      // First weekly event - tip will be shown
    }
  }, [gameState.currentWeek, gameState.topicPositions, showTip]);

  if (!randomTopic) {
    return (
      <div className="weekly-event-overlay">
        <div className="weekly-event-modal">
          <h2>Loading...</h2>
        </div>
      </div>
    );
  }

  const topic = TOPICS.find(t => t.id === randomTopic);
  if (!topic) {
    return null;
  }

  const handleTipDismiss = () => {
    if (dontShowAgain) {
      localStorage.setItem('weeklyEventTipDismissed', 'true');
    }
    setShowTip(false);
  };

  const handleConfirm = () => {
    if (selectedPosition && randomTopic) {
      // Dismiss tip if it's showing
      if (showTip) {
        handleTipDismiss();
      }
      onAnswer(randomTopic, selectedPosition);
    }
  };

  // Check if this is the first weekly event (no positions locked yet)
  const isFirstEvent = gameState.topicPositions.size === 0;

  return (
    <div className="weekly-event-overlay">
      {showTip && isFirstEvent && (
        <div className="tip-popup-overlay">
          <div className="tip-popup">
            <h4>⚠️ Strategic Decision Ahead!</h4>
            <p>
              <strong>Your position on this issue will be PERMANENT and LOCKED for the entire campaign.</strong>
            </p>
            <p>
              Once you choose FOR or AGAINST, you cannot change your position on this topic. This decision will affect:
            </p>
            <ul>
              <li>All future rallies and ads (you can only use topics you've locked positions on)</li>
              <li>Your relationship with voters across all states</li>
              <li>Your ability to campaign on this issue throughout the election</li>
            </ul>
            <p>
              <strong>Choose strategically!</strong> Consider how this position will appeal to your base, independents, and swing voters.
            </p>
            <div className="tip-checkbox">
              <input
                type="checkbox"
                id="dontShowAgain"
                checked={dontShowAgain}
                onChange={(e) => setDontShowAgain(e.target.checked)}
              />
              <label htmlFor="dontShowAgain">Don't show this tip again</label>
            </div>
            <button className="tip-dismiss-btn" onClick={handleTipDismiss}>
              I Understand
            </button>
          </div>
        </div>
      )}
      <div className="weekly-event-modal">
        <h2>Weekly Event</h2>
        <p className="event-description">
          A major news event has brought attention to an important issue. How will you respond?
        </p>
        <div className="event-topic">
          <h3>{topic.name}</h3>
        </div>
        <div className="position-selection">
          <button
            className={`position-btn ${selectedPosition === 'for' ? 'selected' : ''}`}
            onClick={() => setSelectedPosition('for')}
          >
            FOR
          </button>
          <button
            className={`position-btn ${selectedPosition === 'against' ? 'selected' : ''}`}
            onClick={() => setSelectedPosition('against')}
          >
            AGAINST
          </button>
        </div>
        <div className="event-actions">
          <button
            className="confirm-btn"
            onClick={handleConfirm}
            disabled={!selectedPosition}
          >
            Confirm Response
          </button>
        </div>
      </div>
    </div>
  );
}

