import { useState, useEffect, useRef } from 'react';
import type { GameEngine } from '../game/GameEngine';
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
import SettingsModal from './SettingsModal';
import ProjectedVotesModal from './ProjectedVotesModal';
import CampaignDesk from './CampaignDesk';
import WeeklyRecapModal, { WeekRecap } from './WeeklyRecapModal';
import HistoricalEventModal from './HistoricalEventModal';
import ElectionNight from './ElectionNight';
import StateTable from './StateTable';
import { FaDemocrat, FaRepublican } from 'react-icons/fa';
import { TopicId, TOPICS } from '../data/topics';
import { buildElectoralForecast } from '../game/simulation/forecast';
import { EVENTS_1976 } from '../data/events1976';
import { getEventForWeek } from '../game/simulation/events';
import { CAMPAIGN_SAVE_KEY } from '../game/persistence';
import { playClickSound, playStateSelectSound, playStateDeselectSound } from '../utils/sounds';
import { isSpotifyConnected, searchTrack, playTrack } from '../utils/spotify';
import './GameInterface.css';

interface GameInterfaceProps {
  gameEngine: GameEngine;
  playerCandidate: Candidate;
  onReset: () => void;
}

export default function GameInterface({ gameEngine, playerCandidate, onReset }: GameInterfaceProps) {
  const [gameState, setGameState] = useState(gameEngine.getGameState());
  const [selectedState, setSelectedState] = useState<string | null>(null);
  const [showStateDetail, setShowStateDetail] = useState(false);
  const [showActionPanel, setShowActionPanel] = useState(false);
  const [expandedEvParty] = useState<'democrat' | 'republican' | null>(null);
  const [preSelectedActionType, setPreSelectedActionType] = useState<CampaignAction['type'] | null>(null);
  const [showWeeklyEvent, setShowWeeklyEvent] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [showProjectedVotes, setShowProjectedVotes] = useState<'democrat' | 'republican' | null>(null);
  const [weekRecap, setWeekRecap] = useState<WeekRecap | null>(null);
  const [showHistoricalEvent, setShowHistoricalEvent] = useState(false);
  const [mapView, setMapView] = useState<'map' | 'table'>('map');
  const resolutionBaseline = useRef(gameState);

  useEffect(() => {
    // Update game state when it changes
    setGameState(gameEngine.getGameState());
  }, [gameEngine]);

  useEffect(() => {
    if (gameState.gameStatus === 'playing') {
      localStorage.setItem(CAMPAIGN_SAVE_KEY, gameEngine.serializeCampaign());
    }
  }, [gameEngine, gameState]);

  // Play "Rock'n Me" by Steve Miller Band when game ends (it was #1 the week of the election)
  useEffect(() => {
    if (gameState.gameStatus === 'won' || gameState.gameStatus === 'lost') {
      const playElectionSong = async () => {
        if (!isSpotifyConnected()) return;
        
        try {
          // Search for "Rock'n Me" by Steve Miller Band
          const trackId = await searchTrack('Steve Miller Band', "Rock'n Me");
          if (trackId) {
            await playTrack(trackId);
          }
        } catch (error) {
          console.error('Error playing election song:', error);
        }
      };
      
      // Play after a short delay to ensure game state is fully updated
      const timeout = setTimeout(playElectionSong, 500);
      return () => clearTimeout(timeout);
    }
  }, [gameState.gameStatus]);

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

  const resolveWeek = () => {
    const baseline = resolutionBaseline.current;
    const week = baseline.currentWeek;
    const fundsBefore = baseline.resources.funds;
    const actionsResolved = baseline.actionsThisWeek.length;
    const states = gameEngine.getAllStates();
    const forecastBefore = buildElectoralForecast(states, baseline.polling);
    const beforeByState = new Map(forecastBefore.stateForecasts.map(state => [state.state, state]));
    const expectedEvBefore = forecastBefore.expectedElectoralVotes[baseline.playerCandidate];

    gameEngine.endTurn();
    const nextState = gameEngine.getGameState();
    const forecastAfter = buildElectoralForecast(states, nextState.polling);
    const expectedEvAfter = forecastAfter.expectedElectoralVotes[nextState.playerCandidate];
    const movers = forecastAfter.stateForecasts
      .map(state => {
        const before = beforeByState.get(state.state);
        const beforeProbability = nextState.playerCandidate === 'democrat'
          ? before?.democraticWinProbability ?? 0.5
          : before?.republicanWinProbability ?? 0.5;
        const afterProbability = nextState.playerCandidate === 'democrat'
          ? state.democraticWinProbability
          : state.republicanWinProbability;
        return {
          state: state.state,
          electoralVotes: state.electoralVotes,
          probabilityChange: afterProbability - beforeProbability,
        };
      })
      .sort((a, b) => Math.abs(b.probabilityChange) - Math.abs(a.probabilityChange))
      .slice(0, 5);

    setGameState(nextState);
    setWeekRecap({
      week,
      actionsResolved,
      fundsChange: nextState.resources.funds - fundsBefore,
      expectedEvBefore,
      expectedEvAfter,
      movers,
    });
    setShowWeeklyEvent(false);
  };

  const handleEndTurn = () => {
    resolutionBaseline.current = gameState;
    const weeklyEvent = getEventForWeek(EVENTS_1976, gameState.currentWeek);
    const alreadyResolved = weeklyEvent && gameState.historicalEvents.some(record => record.eventId === weeklyEvent.id);
    if (weeklyEvent && !alreadyResolved) {
      setShowHistoricalEvent(true);
      return;
    }

    // The interview is part of this week's plan and must affect the same polling
    // window as the opponent's response. If every issue is already locked, skip it.
    if (gameState.topicPositions.size < TOPICS.length) {
      setShowWeeklyEvent(true);
      return;
    }
    resolveWeek();
  };

  const handleHistoricalEventChoice = (choiceId: string): boolean => {
    const event = getEventForWeek(EVENTS_1976, gameState.currentWeek);
    if (!event) return false;
    const resolved = gameEngine.applyHistoricalEventChoice(event, choiceId);
    if (!resolved) return false;

    const nextState = gameEngine.getGameState();
    setGameState(nextState);
    setShowHistoricalEvent(false);
    if (nextState.topicPositions.size < TOPICS.length) {
      setShowWeeklyEvent(true);
    } else {
      resolveWeek();
    }
    return true;
  };

  const handleWeeklyEventAnswer = (topicId: TopicId, position: 'for' | 'against') => {
    // Apply the weekly interview effects (this also locks the position globally)
    // Weekly interviews have national impact on all subgroups in all states
    gameEngine.applyWeeklyEvent(topicId, position);
    resolveWeek();
  };

  const handleStateClick = (abbreviation: string) => {
    // Clicking a state toggles selection - if already selected, deselect
    if (selectedState === abbreviation) {
      playStateDeselectSound(); // Play deselect sound
      setSelectedState(null);
      setShowStateDetail(false);
      setShowActionPanel(false);
    } else {
      playStateSelectSound(); // Play select sound
      setSelectedState(abbreviation);
      setShowStateDetail(false);
      setShowActionPanel(false);
    }
  };
  
  const handleStateDoubleClick = (abbreviation: string) => {
    // Double-clicking shows state details
    if (selectedState !== abbreviation) {
      playStateSelectSound(); // Play select sound if selecting a new state
    }
    setSelectedState(abbreviation);
    setShowStateDetail(true);
  };

  const handleCloseStateDetail = () => {
    playStateDeselectSound(); // Play deselect sound
    setShowStateDetail(false);
    setSelectedState(null);
  };

  if (gameState.gameStatus === 'won' || gameState.gameStatus === 'lost') {
    return (
      <div className="game-interface end-screen">
        <ElectionNight
          gameState={gameState}
          states={gameEngine.getAllStates()}
          playerCandidate={playerCandidate}
          onPlayAgain={onReset}
        />
      </div>
    );
  }

  const liveForecast = buildElectoralForecast(gameEngine.getAllStates(), gameState.polling);

  return (
    <div className="game-interface">
      <CRTOverlay />
      <div className="game-header">
        <div className="header-left">
          <img 
            src={playerCandidate === 'democrat' ? `${import.meta.env.BASE_URL}Jimmy_Carter_1977_cropped.jpg` : `${import.meta.env.BASE_URL}Gerald_Ford_presidential_portrait_(cropped_2).jpg`}
            alt={playerCandidate === 'democrat' ? 'Jimmy Carter' : 'Gerald Ford'}
            className="header-candidate-image"
          />
          <div className="header-title-section">
            <h1>1976: As Seen on TV!</h1>
            <div className="candidate-info">
              Playing as: <strong>{playerCandidate === 'democrat' ? 'Jimmy Carter (D)' : 'Gerald Ford (R)'}</strong>
            </div>
            <div className="campaign-meta">Autosaved · Seed {gameState.simulationSeed}</div>
          </div>
        </div>
        <button className="settings-btn-small" onClick={() => {
          playClickSound(); // Play random click sound
          setShowSettings(true);
        }}>Settings</button>
      </div>
      <SettingsModal 
        isOpen={showSettings} 
        onClose={() => setShowSettings(false)}
        gameState={gameState}
      />

      <div className="game-main">
        <div className="left-panel">
          <ResourceDisplay gameEngine={gameEngine} resources={gameState.resources} />
          <ProgressBar 
            currentWeek={gameState.currentWeek} 
            totalWeeks={gameState.totalWeeks}
            currentDate={gameState.currentDate}
          />
          <CampaignDesk
            gameState={gameState}
            states={gameEngine.getAllStates()}
            onOpenForecast={() => setShowProjectedVotes(gameState.playerCandidate)}
          />
          <SpotifyPlayer currentWeek={gameState.currentWeek} />
          <div className="electoral-votes">
            <h3>Expected Electoral Votes</h3>
            <div className="ev-display">
              <button
                className="ev-item democrat clickable"
                aria-label="Open Democratic electoral forecast"
                onClick={() => {
                  playClickSound(); // Play random click sound
                  setShowProjectedVotes('democrat');
                }}
              >
                <FaDemocrat className="party-icon" />
                <span className="ev-value">{Math.round(liveForecast.expectedElectoralVotes.democrat)}</span>
              </button>
              <button
                className="ev-item republican clickable"
                aria-label="Open Republican electoral forecast"
                onClick={() => {
                  playClickSound(); // Play random click sound
                  setShowProjectedVotes('republican');
                }}
              >
                <FaRepublican className="party-icon" />
                <span className="ev-value">{Math.round(liveForecast.expectedElectoralVotes.republican)}</span>
              </button>
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

        <div className="center-panel">
          <div className="map-workspace">
            <div className="map-view-switcher" aria-label="State board view">
              <button className={mapView === 'map' ? 'active' : ''} aria-pressed={mapView === 'map'} onClick={() => setMapView('map')}>Map</button>
              <button className={mapView === 'table' ? 'active' : ''} aria-pressed={mapView === 'table'} onClick={() => setMapView('table')}>State table</button>
            </div>
            {mapView === 'map' ? (
              <StateMap
                gameEngine={gameEngine}
                onStateClick={handleStateClick}
                onStateDoubleClick={handleStateDoubleClick}
                onMapClick={() => {
                  if (selectedState !== null) playStateDeselectSound();
                  setSelectedState(null);
                  setShowStateDetail(false);
                  setShowActionPanel(false);
                }}
                selectedState={selectedState}
              />
            ) : (
              <StateTable
                states={gameEngine.getAllStates()}
                gameState={gameState}
                onSelect={handleStateClick}
              />
            )}
          </div>
        </div>

        <div className="right-panel">
          {selectedState && !showActionPanel ? (
            <StateInfoPanel
              gameEngine={gameEngine}
              gameState={gameState}
              stateAbbreviation={selectedState}
              onClose={() => {
                playStateDeselectSound(); // Play deselect sound
                setSelectedState(null);
                setShowActionPanel(false);
              }}
              onActionSelect={(abbrev, actionType) => {
                // Check if HQ is at max level before opening ActionPanel
                if (actionType === 'campaign_hq') {
                  const activities = gameEngine.getStateActivities(abbrev);
                  const hqActivity = activities.find(a => a.type === 'hq' && a.actor === 'player');
                  const currentLevel = hqActivity?.hqLevel || 0;
                  
                  // If already at max level, don't open ActionPanel
                  if (currentLevel >= 5) {
                    // HQ is at max level - don't open panel
                    return;
                  }
                }
                
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
                playStateDeselectSound(); // Play deselect sound
                setSelectedState(null); // Deselect state after action
                setShowActionPanel(false); // Reset to show StateInfoPanel if state is selected again
              }}
              onEndTurn={handleEndTurn}
              selectedState={selectedState}
              playerCandidate={playerCandidate}
              onStateSelect={(state) => {
                if (state === null) {
                  playStateDeselectSound(); // Play deselect sound
                  setSelectedState(null);
                  setShowActionPanel(false);
                  setPreSelectedActionType(null);
                } else {
                  playStateSelectSound(); // Play select sound
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
      
      <NewsTicker 
        currentWeek={gameState.currentWeek} 
        gameEngine={gameEngine}
        gameState={gameState}
      />
      
      {showWeeklyEvent && (
        <WeeklyEventModal
          gameState={gameState}
          onAnswer={handleWeeklyEventAnswer}
          onClose={resolveWeek}
        />
      )}
      
      {showProjectedVotes && (
        <ProjectedVotesModal
          isOpen={true}
          onClose={() => setShowProjectedVotes(null)}
          gameEngine={gameEngine}
          gameState={gameState}
          party={showProjectedVotes}
        />
      )}

      {showHistoricalEvent && (() => {
        const event = getEventForWeek(EVENTS_1976, gameState.currentWeek);
        return event ? (
          <HistoricalEventModal
            event={event}
            funds={gameState.resources.funds}
            onChoose={handleHistoricalEventChoice}
          />
        ) : null;
      })()}

      {weekRecap && (
        <WeeklyRecapModal recap={weekRecap} onContinue={() => setWeekRecap(null)} />
      )}
    </div>
  );
}

