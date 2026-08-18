import { FaDemocrat, FaRepublican } from 'react-icons/fa';
import type { GameEngine } from '../game/GameEngine';
import { buildElectoralForecast, ForecastBand } from '../game/simulation/forecast';
import { buildRoadTo270 } from '../game/strategy/roadTo270';
import { GameState } from '../types/game';
import { playClickSound } from '../utils/sounds';
import './ProjectedVotesModal.css';

interface ProjectedVotesModalProps {
  isOpen: boolean;
  onClose: () => void;
  gameEngine: GameEngine;
  gameState: GameState;
  party: 'democrat' | 'republican';
}

export default function ProjectedVotesModal({ isOpen, onClose, gameEngine, gameState, party }: ProjectedVotesModalProps) {
  if (!isOpen) return null;

  const allStates = gameEngine.getAllStates();
  const forecast = buildElectoralForecast(allStates, gameState.polling);
  const road = buildRoadTo270({ states: allStates, pollingByState: gameState.polling, candidate: party });
  const stateNames = new Map(allStates.map(state => [state.abbreviation, state.name]));
  const stateProjections = forecast.stateForecasts
    .map(state => ({
      ...state,
      name: stateNames.get(state.state) ?? state.state,
      polling: gameState.polling.get(state.state),
      winProbability: party === 'democrat' ? state.democraticWinProbability : state.republicanWinProbability,
    }))
    .sort((left, right) => Math.abs(left.winProbability - 0.5) - Math.abs(right.winProbability - 0.5));

  const likelyElectoralVotes = forecast.likelyElectoralVotes[party];
  const expectedElectoralVotes = Math.round(forecast.expectedElectoralVotes[party]);
  const statesFavored = stateProjections.filter(state => state.winProbability >= 0.5).length;

  return (
    <div className="projected-votes-modal-overlay" onClick={onClose}>
      <div className="projected-votes-modal" role="dialog" aria-modal="true" aria-labelledby="forecast-title" onClick={event => event.stopPropagation()}>
        <div className="projected-votes-modal-header">
          <h2 id="forecast-title">
            {party === 'democrat' ? <FaDemocrat className="party-icon" /> : <FaRepublican className="party-icon" />}
            {party === 'democrat' ? 'Democratic' : 'Republican'} Electoral Forecast
          </h2>
          <button
            className="projected-votes-close-btn"
            aria-label="Close forecast"
            onClick={() => {
              playClickSound();
              onClose();
            }}
          >
            ×
          </button>
        </div>

        <div className="projected-votes-modal-content">
          <p className="projected-votes-explainer">
            Expected EV weights every state's live win chance. Likely EV assigns each state to its current favorite. Neither is a guarantee.
          </p>
          <div className="projected-votes-summary">
            <div className="summary-item">
              <span className="summary-label">Likely EV</span>
              <span className="summary-value">{likelyElectoralVotes}</span>
            </div>
            <div className="summary-item">
              <span className="summary-label">Expected EV</span>
              <span className="summary-value">{expectedElectoralVotes}</span>
            </div>
            <div className="summary-item">
              <span className="summary-label">States favored</span>
              <span className="summary-value">{statesFavored}</span>
            </div>
          </div>

          <div className="projected-votes-route">
            <strong>Road to 270:</strong>{' '}
            {road.pathsTo270[0]?.label ?? `${road.electoralVotesNeeded} EV needed, with no complete path on the current board.`}
          </div>

          <div className="projected-votes-list">
            <div className="projected-votes-list-header">
              <span>State</span>
              <span>EV</span>
              <span>Win chance</span>
              <span>Race rating</span>
              <span>Poll confidence</span>
            </div>
            {stateProjections.map(projection => (
              <div
                key={projection.state}
                className={`projected-votes-item ${projection.winProbability >= 0.5 ? 'won' : ''} ${projection.band === 'toss_up' ? 'tie' : ''}`}
              >
                <span className="state-name">{projection.name}</span>
                <span className="ev-count">{projection.electoralVotes}</span>
                <span className="vote-count">{Math.round(projection.winProbability * 100)}%</span>
                <span className="support-percent">{formatBand(projection.band)}</span>
                <span className="turnout-info">
                  {projection.polling ? `Wk ${projection.polling.lastUpdated} · ±${projection.polling.marginOfError.toFixed(1)}` : 'No live poll'}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

function formatBand(band: ForecastBand): string {
  return band.split('_').map(word => word[0].toUpperCase() + word.slice(1)).join(' ');
}
