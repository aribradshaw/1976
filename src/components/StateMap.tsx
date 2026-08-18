import { GameEngine } from '../game/GameEngine';
import './StateMap.css';
import statePathsData from '../data/state_paths.json';

interface StateMapProps {
  gameEngine: GameEngine;
  onStateClick: (abbreviation: string) => void;
  onStateDoubleClick?: (abbreviation: string) => void;
  onMapClick?: () => void;
  selectedState?: string | null;
}

interface StatePathData {
  viewBox: string;
  paths: Record<string, {
    d: string;
    transform: string;
    class: string;
  }>;
}

const statePaths = statePathsData as StatePathData;

export default function StateMap({ gameEngine, onStateClick, onStateDoubleClick, onMapClick, selectedState }: StateMapProps) {
  const states = gameEngine.getAllStates();

  return (
    <div className="state-map-container">
      <div className="state-map">
        <svg 
          viewBox={statePaths.viewBox} 
          className="map-svg" 
          preserveAspectRatio="xMidYMid meet"
        >
          {/* Background rectangle for map clicks */}
          <rect
            x={statePaths.viewBox.split(' ')[0]}
            y={statePaths.viewBox.split(' ')[1]}
            width={statePaths.viewBox.split(' ')[2]}
            height={statePaths.viewBox.split(' ')[3]}
            fill="transparent"
            onClick={(e) => {
              e.stopPropagation();
              onMapClick?.();
            }}
            style={{ cursor: 'default', pointerEvents: 'all' }}
          />
          {/* Render non-selected states first */}
          {states
            .filter(state => selectedState !== state.abbreviation)
            .map(state => {
              const color = gameEngine.getStateColor(state.abbreviation);
              const pathData = statePaths.paths[state.abbreviation];
              
              if (!pathData) {
                return null;
              }
              
              return (
                <g key={state.abbreviation}>
                  <path
                    d={pathData.d}
                    transform={pathData.transform}
                    fill={color}
                    stroke="#ffffff"
                    strokeWidth="0.5"
                    className="state-path"
                    onClick={(e) => {
                      e.stopPropagation();
                      onStateClick(state.abbreviation);
                    }}
                    onDoubleClick={(e) => {
                      e.stopPropagation();
                      onStateDoubleClick?.(state.abbreviation);
                    }}
                    style={{ cursor: 'pointer' }}
                  />
                </g>
              );
            })}
          {/* Render selected state last so it appears on top */}
          {selectedState && states
            .filter(state => selectedState === state.abbreviation)
            .map(state => {
            const color = gameEngine.getStateColor(state.abbreviation);
              const pathData = statePaths.paths[state.abbreviation];
              
              if (!pathData) {
                return null;
              }
            
            return (
              <g key={state.abbreviation}>
                  <path
                    d={pathData.d}
                    transform={pathData.transform}
                  fill={color}
                    stroke="#667eea"
                    strokeWidth="3"
                    className="state-path selected"
                    onClick={(e) => {
                      e.stopPropagation();
                      onStateClick(state.abbreviation);
                    }}
                    onDoubleClick={(e) => {
                      e.stopPropagation();
                      onStateDoubleClick?.(state.abbreviation);
                    }}
                  style={{ cursor: 'pointer' }}
                />
              </g>
            );
          })}
        </svg>
        {/* DC Box - separate clickable box */}
        <div className="dc-box-container">
          <div 
            className="dc-box"
            onClick={(e) => {
              e.stopPropagation();
              onStateClick('DC');
            }}
            onDoubleClick={(e) => {
              e.stopPropagation();
              onStateDoubleClick?.('DC');
            }}
            style={{
              backgroundColor: gameEngine.getStateColor('DC'),
              border: selectedState === 'DC' ? '3px solid #667eea' : '2px solid #ffffff',
              cursor: 'pointer',
            }}
          >
            <div className="dc-label">DC</div>
          </div>
        </div>
        <div className="map-legend">
          <div className="legend-group">
            <div className="legend-group-title">Dem</div>
            <div className="legend-items">
              <div className="legend-color" style={{ background: '#1e3a8a' }} title="Dark Blue: Dem margin > 20"></div>
              <div className="legend-color" style={{ background: '#3b82f6' }} title="Medium Blue: Dem margin 11-19"></div>
              <div className="legend-color" style={{ background: '#93c5fd' }} title="Light Blue: Dem margin 6-10"></div>
            </div>
          </div>
          <div className="legend-group">
            <div className="legend-group-title">Rep</div>
            <div className="legend-items">
              <div className="legend-color" style={{ background: '#991b1b' }} title="Dark Red: Rep margin > 20"></div>
              <div className="legend-color" style={{ background: '#dc2626' }} title="Medium Red: Rep margin 11-19"></div>
              <div className="legend-color" style={{ background: '#f87171' }} title="Light Red: Rep margin 6-10"></div>
            </div>
          </div>
          <div className="legend-group">
            <div className="legend-group-title">Swing</div>
            <div className="legend-items">
              <div className="legend-color" style={{ background: '#7c3aed' }} title="Purple: Margin < 3"></div>
              <div className="legend-color" style={{ background: '#a855f7' }} title="Reddish Purple: Rep margin 4-5"></div>
              <div className="legend-color" style={{ background: '#8b5cf6' }} title="Blueish Purple: Dem margin 4-5"></div>
          </div>
          </div>
          <div className="legend-group">
            <div className="legend-group-title">Undecided</div>
            <div className="legend-items">
              <div className="legend-color" style={{ background: '#808080' }} title="Grey: Undecided plurality"></div>
          </div>
          </div>
        </div>
      </div>
    </div>
  );
}

