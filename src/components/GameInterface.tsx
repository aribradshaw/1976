import { useState, useEffect } from 'react';
import { GameEngine } from '../game/GameEngine';
import { Candidate, CampaignAction } from '../types/game';
import StateMap from './StateMap';
import ProgressBar from './ProgressBar';
import ResourceDisplay from './ResourceDisplay';
import ActionPanel from './ActionPanel';
import StateDetail from './StateDetail';
import StateInfoPanel from './StateInfoPanel';
import NewsTicker from './NewsTicker';
import CRTOverlay from './CRTOverlay';
import WeeklyEventModal from './WeeklyEventModal';
import SpotifyPlayer from './SpotifyPlayer';
import { FaDemocrat, FaRepublican } from 'react-icons/fa';
import { TopicId } from '../data/topics';
import './GameInterface.css';

interface GameInterfaceProps {
  gameEngine: GameEngine;
  playerCandidate: Candidate;
  onReset: () => void;
  onSettings?: () => void;
}

export default function GameInterface({ gameEngine, playerCandidate, onReset, onSettings }: GameInterfaceProps) {
  const [gameState, setGameState] = useState(gameEngine.getGameState());
  const [selectedState, setSelectedState] = useState<string | null>(null);
  const [showStateDetail, setShowStateDetail] = useState(false);
  const [showActionPanel, setShowActionPanel] = useState(false);
  const [expandedEvParty, setExpandedEvParty] = useState<'democrat' | 'republican' | null>(null);
  const [preSelectedActionType, setPreSelectedActionType] = useState<CampaignAction['type'] | null>(null);
  const [showWeeklyEvent, setShowWeeklyEvent] = useState(false);

  useEffect(() => {
    // Update game state when it changes
    setGameState(gameEngine.getGameState());
  }, [gameEngine]);

  const handleAction = (action: CampaignAction) => {
    const success = gameEngine.executeAction(action);
    if (success) {
      setGameState(gameEngine.getGameState());
    }
  };

  const handleRemoveAction = (index: number) => {
    const success = gameEngine.removeAction(index);
    if (success) {
      setGameState(gameEngine.getGameState());
    }
  };

  const handleEndTurn = () => {
    // Process the turn, then show weekly event modal
    gameEngine.endTurn();
    setGameState(gameEngine.getGameState());
    setShowWeeklyEvent(true);
  };

  const handleWeeklyEventAnswer = (topicId: TopicId, position: 'for' | 'against') => {
    // Apply the weekly event effects (this also locks the position globally)
    gameEngine.applyWeeklyEvent(topicId, position);
    setGameState(gameEngine.getGameState());
    setShowWeeklyEvent(false);
  };

  const handleStateClick = (abbreviation: string) => {
    // Clicking a state toggles selection - if already selected, deselect
    if (selectedState === abbreviation) {
      setSelectedState(null);
      setShowStateDetail(false);
      setShowActionPanel(false);
    } else {
      setSelectedState(abbreviation);
      setShowStateDetail(false);
      setShowActionPanel(false);
    }
  };
  
  const handleStateDoubleClick = (abbreviation: string) => {
    // Double-clicking shows state details
    setSelectedState(abbreviation);
    setShowStateDetail(true);
  };

  const handleCloseStateDetail = () => {
    setShowStateDetail(false);
    setSelectedState(null);
  };

  if (gameState.gameStatus === 'won' || gameState.gameStatus === 'lost') {
    return (
      <div className="game-interface end-screen">
        <CRTOverlay />
        <div className="end-content">
          <h1>{gameState.gameStatus === 'won' ? 'Victory!' : 'Defeat'}</h1>
          <p>
            {gameState.gameStatus === 'won' 
              ? 'Congratulations! You won the election!'
              : 'You lost the election. Better luck next time!'}
          </p>
          <div className="final-results">
            <div className="result-item">
              <span>Democratic Electoral Votes:</span>
              <span className="result-value">{gameState.electoralVotes.democrat}</span>
            </div>
            <div className="result-item">
              <span>Republican Electoral Votes:</span>
              <span className="result-value">{gameState.electoralVotes.republican}</span>
            </div>
          </div>
          <button className="reset-btn" onClick={onReset}>
            Play Again
          </button>
        </div>
        <div className="final-map-container">
          <h2 className="final-map-title">Final Results Map</h2>
          <StateMap 
            gameEngine={gameEngine}
            onStateClick={() => {}}
            onStateDoubleClick={() => {}}
            onMapClick={() => {}}
            selectedState={null}
            isFinalResults={true}
          />
        </div>
      </div>
    );
  }

  return (
    <div className="game-interface">
      <CRTOverlay />
      <div className="game-header">
        <div className="header-left">
          <img 
            src={playerCandidate === 'democrat' ? '/Jimmy_Carter_1977_cropped.jpg' : '/Gerald_Ford_presidential_portrait_(cropped_2).jpg'}
            alt={playerCandidate === 'democrat' ? 'Jimmy Carter' : 'Gerald Ford'}
            className="header-candidate-image"
          />
          <div className="header-title-section">
            <h1>1976 Election Campaign</h1>
            <div className="candidate-info">
              Playing as: <strong>{playerCandidate === 'democrat' ? 'Jimmy Carter (D)' : 'Gerald Ford (R)'}</strong>
            </div>
          </div>
        </div>
        <button className="settings-btn-small" onClick={onSettings || onReset}>Settings</button>
      </div>

      <div className="game-main">
        <div className="left-panel">
          <ResourceDisplay gameEngine={gameEngine} resources={gameState.resources} />
          <SpotifyPlayer currentWeek={gameState.currentWeek} />
          <ProgressBar 
            currentWeek={gameState.currentWeek} 
            totalWeeks={gameState.totalWeeks}
            currentDate={gameState.currentDate}
            electionDate={gameState.electionDate}
          />
          <div className="electoral-votes">
            <h3>Electoral Votes</h3>
            <div className="ev-display">
              <div 
                className="ev-item democrat clickable"
                onClick={() => setExpandedEvParty(expandedEvParty === 'democrat' ? null : 'democrat')}
              >
                <span>
                  <FaDemocrat className="party-icon" />
                  Democrat:
                </span>
                <span className="ev-value">{gameEngine.getProjectedElectoralVotes().democrat}</span>
              </div>
              {expandedEvParty === 'democrat' && (() => {
                const statesWon = gameEngine.getStatesWonByParty();
                return statesWon.democrat.length > 0 ? (
                  <div className="ev-states-list democrat">
                    {statesWon.democrat.map(abbrev => {
                      const state = gameEngine.getStateData(abbrev);
                      return state ? (
                        <span key={abbrev} className="state-badge">
                          {state.abbreviation} ({state.electoralVotes})
                        </span>
                      ) : null;
                    })}
                  </div>
                ) : (
                  <div className="ev-states-list democrat empty">
                    No states clearly won yet
                  </div>
                );
              })()}
              <div 
                className="ev-item republican clickable"
                onClick={() => setExpandedEvParty(expandedEvParty === 'republican' ? null : 'republican')}
              >
                <span>
                  <FaRepublican className="party-icon" />
                  Republican:
                </span>
                <span className="ev-value">{gameEngine.getProjectedElectoralVotes().republican}</span>
              </div>
              {expandedEvParty === 'republican' && (() => {
                const statesWon = gameEngine.getStatesWonByParty();
                return statesWon.republican.length > 0 ? (
                  <div className="ev-states-list republican">
                    {statesWon.republican.map(abbrev => {
                      const state = gameEngine.getStateData(abbrev);
                      return state ? (
                        <span key={abbrev} className="state-badge">
                          {state.abbreviation} ({state.electoralVotes})
                        </span>
                      ) : null;
                    })}
                  </div>
                ) : (
                  <div className="ev-states-list republican empty">
                    No states clearly won yet
                  </div>
                );
              })()}
            </div>
          </div>
        </div>

        <div className="center-panel">
          <StateMap 
            gameEngine={gameEngine}
            onStateClick={(abbrev) => {
              // Single click toggles selection
              handleStateClick(abbrev);
            }}
            onStateDoubleClick={(abbrev) => {
              // Double-click shows details
              handleStateDoubleClick(abbrev);
            }}
            onMapClick={() => {
              // Clicking the map background deselects
              setSelectedState(null);
              setShowStateDetail(false);
              setShowActionPanel(false);
            }}
            selectedState={selectedState}
          />
        </div>

        <div className="right-panel">
          {selectedState && !showActionPanel ? (
            <StateInfoPanel
              gameEngine={gameEngine}
              gameState={gameState}
              stateAbbreviation={selectedState}
              onClose={() => {
                setSelectedState(null);
                setShowActionPanel(false);
              }}
              onActionSelect={(abbrev, actionType) => {
                // Switch to ActionPanel with state pre-selected and action type
                setShowActionPanel(true);
                setSelectedState(abbrev);
                setPreSelectedActionType(actionType || null);
              }}
            />
          ) : (
            <ActionPanel
              gameEngine={gameEngine}
              gameState={gameState}
              onAction={(action) => {
                handleAction(action);
                setPreSelectedActionType(null); // Clear after action
                setSelectedState(null); // Deselect state after action
                setShowActionPanel(false); // Reset to show StateInfoPanel if state is selected again
              }}
              onEndTurn={handleEndTurn}
              selectedState={selectedState}
              playerCandidate={playerCandidate}
              onStateSelect={(state) => {
                if (state === null) {
                  setSelectedState(null);
                  setShowActionPanel(false);
                  setPreSelectedActionType(null);
                } else {
                  setSelectedState(state);
                  setShowActionPanel(false);
                  setPreSelectedActionType(null);
                }
              }}
              onRemoveAction={handleRemoveAction}
              onCancel={() => {
                // Go back to StateInfoPanel
                setShowActionPanel(false);
                setPreSelectedActionType(null);
              }}
              preSelectedActionType={preSelectedActionType}
            />
          )}
        </div>
      </div>

      {showStateDetail && selectedState && (
        <StateDetail
          gameEngine={gameEngine}
          stateAbbreviation={selectedState}
          onClose={handleCloseStateDetail}
          onActionSelect={(abbrev) => {
            setSelectedState(abbrev);
            setShowStateDetail(false);
          }}
        />
      )}
      
      <NewsTicker currentWeek={gameState.currentWeek} />
      
      {showWeeklyEvent && (
        <WeeklyEventModal
          gameEngine={gameEngine}
          gameState={gameState}
          playerCandidate={playerCandidate}
          onAnswer={handleWeeklyEventAnswer}
        />
      )}
    </div>
  );
}

