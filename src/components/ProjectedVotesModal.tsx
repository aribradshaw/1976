import { GameEngine } from '../game/GameEngine';
import { GameState, PollingData, StateData } from '../types/game';
import { FaDemocrat, FaRepublican } from 'react-icons/fa';
import { playClickSound } from '../utils/sounds';
import './ProjectedVotesModal.css';

interface ProjectedVotesModalProps {
  isOpen: boolean;
  onClose: () => void;
  gameEngine: GameEngine;
  gameState: GameState;
  party: 'democrat' | 'republican';
}

export default function ProjectedVotesModal({ 
  isOpen, 
  onClose, 
  gameEngine, 
  gameState,
  party 
}: ProjectedVotesModalProps) {
  if (!isOpen) return null;

  // Get all states and calculate projected votes
  const allStates = gameEngine.getAllStates();
  const stateProjections = allStates.map(state => {
    const polling = gameState.polling.get(state.abbreviation);
    if (!polling) return null;

    const turnoutRate = polling.turnoutRate || state.historicalData.turnoutRate;
    const projectedTurnout = state.population.registeredVoters * (turnoutRate / 100);
    
    // Calculate projected votes based on polling percentage
    const demSupport = polling.democraticSupport;
    const repSupport = polling.republicanSupport;
    const totalSupport = demSupport + repSupport;
    
    // If total support is 0, skip this state
    if (totalSupport === 0) return null;
    
    // Calculate projected votes for each party
    const demVotes = totalSupport > 0 ? (demSupport / totalSupport) * projectedTurnout : 0;
    const repVotes = totalSupport > 0 ? (repSupport / totalSupport) * projectedTurnout : 0;
    
    // Determine winner based on polling
    const margin = demSupport - repSupport;
    const winner = margin > 0 ? 'democrat' : margin < 0 ? 'republican' : 'tie';
    
    return {
      state,
      polling,
      projectedTurnout: Math.round(projectedTurnout),
      turnoutRate: turnoutRate.toFixed(1),
      demVotes: Math.round(demVotes),
      repVotes: Math.round(repVotes),
      demSupport: demSupport.toFixed(1),
      repSupport: repSupport.toFixed(1),
      margin: Math.abs(margin).toFixed(1),
      winner,
      electoralVotes: state.electoralVotes
    };
  }).filter(Boolean) as Array<{
    state: StateData;
    polling: PollingData;
    projectedTurnout: number;
    turnoutRate: string;
    demVotes: number;
    repVotes: number;
    demSupport: string;
    repSupport: string;
    margin: string;
    winner: 'democrat' | 'republican' | 'tie';
    electoralVotes: number;
  }>;

  // Sort by electoral votes (descending)
  stateProjections.sort((a, b) => b.electoralVotes - a.electoralVotes);

  // Show all states, but highlight the ones won by the selected party
  // Calculate totals for all states
  const totalElectoralVotesAll = stateProjections.reduce((sum, p) => sum + p.electoralVotes, 0);
  const totalProjectedVotes = stateProjections.reduce((sum, p) => 
    sum + (party === 'democrat' ? p.demVotes : p.repVotes), 0);
  
  // Count states won by the selected party
  const statesWon = stateProjections.filter(p => 
    party === 'democrat' ? p.winner === 'democrat' : p.winner === 'republican'
  ).length;
  
  // Calculate electoral votes for the selected party (only from states they're winning)
  const totalElectoralVotes = stateProjections
    .filter(p => party === 'democrat' ? p.winner === 'democrat' : p.winner === 'republican')
    .reduce((sum, p) => sum + p.electoralVotes, 0);

  return (
    <div className="projected-votes-modal-overlay" onClick={onClose}>
      <div className="projected-votes-modal" onClick={(e) => e.stopPropagation()}>
        <div className="projected-votes-modal-header">
          <h2>
            {party === 'democrat' ? (
              <>
                <FaDemocrat className="party-icon" />
                Democratic Projected Votes
              </>
            ) : (
              <>
                <FaRepublican className="party-icon" />
                Republican Projected Votes
              </>
            )}
          </h2>
          <button 
            className="projected-votes-close-btn" 
            onClick={() => {
              playClickSound();
              onClose();
            }}
          >
            ×
          </button>
        </div>
        
        <div className="projected-votes-modal-content">
          <div className="projected-votes-summary">
            <div className="summary-item">
              <span className="summary-label">Total Electoral Votes:</span>
              <span className="summary-value">{totalElectoralVotes}</span>
            </div>
            <div className="summary-item">
              <span className="summary-label">Total Projected Votes:</span>
              <span className="summary-value">{totalProjectedVotes.toLocaleString()}</span>
            </div>
            <div className="summary-item">
              <span className="summary-label">States Won:</span>
              <span className="summary-value">{statesWon}</span>
            </div>
          </div>

          <div className="projected-votes-list">
            <div className="projected-votes-list-header">
              <span>State</span>
              <span>Electoral Votes</span>
              <span>Projected Votes</span>
              <span>Support %</span>
              <span>Turnout</span>
            </div>
            {stateProjections.map((projection) => {
              const isWon = party === 'democrat' 
                ? projection.winner === 'democrat' 
                : projection.winner === 'republican';
              
              return (
                <div 
                  key={projection.state.abbreviation} 
                  className={`projected-votes-item ${isWon ? 'won' : ''} ${projection.winner === 'tie' ? 'tie' : ''}`}
                >
                  <span className="state-name">{projection.state.name}</span>
                  <span className="ev-count">{projection.electoralVotes}</span>
                  <span className="vote-count">
                    {(party === 'democrat' ? projection.demVotes : projection.repVotes).toLocaleString()}
                  </span>
                  <span className="support-percent">
                    {party === 'democrat' ? projection.demSupport : projection.repSupport}%
                  </span>
                  <span className="turnout-info">
                    {projection.projectedTurnout.toLocaleString()} ({projection.turnoutRate}%)
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}

