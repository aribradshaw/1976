import type { GameEngine } from '../game/GameEngine';
import './ResourceDisplay.css';

interface ResourceDisplayProps {
  gameEngine: GameEngine;
  resources: {
    funds: number;
    actionsRemaining: number;
    energy: number;
    credibility: number;
    weeklyFundraising: number;
  };
}

export default function ResourceDisplay({ gameEngine, resources }: ResourceDisplayProps) {
  const overallMomentum = gameEngine.getOverallMomentum();
  
  return (
    <div className="resource-display">
      <h3>Resources</h3>
      <div className="resource-item">
        <span className="resource-label">Campaign Funds:</span>
        <span className="resource-value">${(resources.funds / 1000000).toFixed(2)}M</span>
      </div>
      <div className="resource-item">
        <span className="resource-label">Action Points:</span>
        <div className="energy-items">
          {[1, 2, 3, 4, 5, 6].map((index) => (
            <div
              key={index}
              className={`energy-item ${index <= resources.actionsRemaining ? 'active' : 'depleted'}`}
            />
          ))}
        </div>
      </div>
      <div className="resource-item resource-track-item">
        <span className="resource-label">Candidate Energy:</span>
        <div className="resource-track"><span style={{ width: `${resources.energy}%` }} /></div>
        <span className="resource-track-value">{Math.round(resources.energy)}/100</span>
      </div>
      <div className="resource-item resource-track-item">
        <span className="resource-label">Credibility:</span>
        <div className="resource-track credibility"><span style={{ width: `${resources.credibility}%` }} /></div>
        <span className="resource-track-value">{Math.round(resources.credibility)}/100</span>
      </div>
      <div className="resource-item">
        <span className="resource-label">Weekly Fundraising:</span>
        <span className="resource-value">${(resources.weeklyFundraising / 1000).toFixed(0)}K</span>
      </div>
      <div className="resource-item">
        <span className="resource-label">Momentum:</span>
        <span className={`resource-value ${overallMomentum >= 0 ? 'positive' : 'negative'}`}>
          {overallMomentum >= 0 ? '+' : ''}{overallMomentum.toFixed(1)}
        </span>
      </div>
    </div>
  );
}

