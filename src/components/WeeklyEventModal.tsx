import { useMemo, useState } from 'react';
import { TOPICS, TopicId } from '../data/topics';
import { GameState } from '../types/game';
import './WeeklyEventModal.css';

interface WeeklyEventModalProps {
  gameState: GameState;
  onAnswer: (topicId: TopicId, position: 'for' | 'against') => void;
  onClose?: () => void;
}

export default function WeeklyEventModal({ gameState, onAnswer }: WeeklyEventModalProps) {
  const [selectedPosition, setSelectedPosition] = useState<'for' | 'against' | null>(null);
  const selectedTopic = useMemo(() => {
    const available = TOPICS.filter(topic => !gameState.topicPositions.has(topic.id));
    if (available.length === 0) return null;
    const index = (gameState.simulationSeed + gameState.currentWeek - 1) % available.length;
    return available[index];
  }, [gameState.currentWeek, gameState.simulationSeed, gameState.topicPositions]);

  if (!selectedTopic) return null;

  return (
    <div className="weekly-event-overlay" role="dialog" aria-modal="true" aria-labelledby="weekly-interview-title">
      <div className="weekly-event-modal">
        <span className="weekly-event-kicker">National television interview</span>
        <h2 id="weekly-interview-title">Define your position</h2>
        <p className="event-description">
          Your answer on <strong>{selectedTopic.name}</strong> becomes part of your permanent platform and affects voters nationwide.
        </p>
        <p className="weekly-event-warning">
          This position cannot be reversed. It also unlocks this issue for future ads and rallies.
        </p>
        <div className="position-selection" aria-label={`Position on ${selectedTopic.name}`}>
          <button
            className={`position-btn ${selectedPosition === 'for' ? 'selected' : ''}`}
            aria-pressed={selectedPosition === 'for'}
            onClick={() => setSelectedPosition('for')}
          >
            Support it
          </button>
          <button
            className={`position-btn ${selectedPosition === 'against' ? 'selected' : ''}`}
            aria-pressed={selectedPosition === 'against'}
            onClick={() => setSelectedPosition('against')}
          >
            Oppose it
          </button>
        </div>
        <div className="event-actions">
          <button
            className="confirm-btn"
            onClick={() => selectedPosition && onAnswer(selectedTopic.id, selectedPosition)}
            disabled={!selectedPosition}
          >
            Go on the record
          </button>
        </div>
      </div>
    </div>
  );
}
