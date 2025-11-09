import { GameEngine } from '../game/GameEngine';
import { calculateDetailedDemographics } from '../utils/demographics';
import { FaDemocrat, FaRepublican, FaDollarSign, FaAdversal } from 'react-icons/fa';
import { RiHqFill } from 'react-icons/ri';
import './StateDetail.css';

interface StateDetailProps {
  gameEngine: GameEngine;
  stateAbbreviation: string;
  onClose: () => void;
  onActionSelect?: (stateAbbreviation: string) => void;
}

export default function StateDetail({ gameEngine, stateAbbreviation, onClose, onActionSelect }: StateDetailProps) {
  const state = gameEngine.getStateData(stateAbbreviation);
  const gameState = gameEngine.getGameState();
  const polling = gameState.polling.get(stateAbbreviation);

  if (!state || !polling) {
    return null;
  }

  const demActual = polling.democraticSupport;
  const repActual = polling.republicanSupport;
  const margin = demActual - repActual;
  
  // Calculate detailed demographics
  const detailedDemos = state.detailedDemographics || calculateDetailedDemographics(state);
  
  // Get campaign activities
  const activities = gameEngine.getStateActivities(stateAbbreviation);
  
  // Calculate projected turnout based on current turnout rate (capped between 40% and 95%)
  const turnoutRate = polling.turnoutRate || state.historicalData.turnoutRate;
  const projectedTurnout = state.population.registeredVoters * (turnoutRate / 100);
  
  // Get fundraising booth info if exists
  const fundraisingBooth = gameState.fundraisingBooths.find(b => b.state === stateAbbreviation);

  return (
    <div className="state-detail-overlay" onClick={onClose}>
      <div className="state-detail-modal" onClick={(e) => e.stopPropagation()}>
        <button className="close-btn" onClick={onClose}>×</button>
        <h2>{state.name}</h2>
        
        <div className="state-info">
          <div className="info-section">
            <h3>Electoral Votes</h3>
            <p className="ev-count">{state.electoralVotes}</p>
          </div>

          <div className="info-section">
            <h3>Voter Statistics</h3>
            <div className="voter-stats">
              <div className="stat-item">
                <span>Total Population:</span>
                <span>{state.population.total.toLocaleString()}</span>
              </div>
              <div className="stat-item">
                <span>Registered Voters:</span>
                <span>{state.population.registeredVoters.toLocaleString()}</span>
              </div>
              <div className="stat-item">
                <span>Projected Turnout:</span>
                <span>{Math.round(projectedTurnout).toLocaleString()} ({turnoutRate.toFixed(1)}%)</span>
              </div>
            </div>
          </div>

          <div className="info-section">
            <h3>Latest Polling</h3>
            <div className="polling-meta">
              <div className="meta-item">
                <span>Last Updated:</span>
                <span>Week {polling.lastUpdated}</span>
              </div>
            </div>
            <div className="polling-display">
              <div className="polling-item democrat">
                  <span className="polling-label">
                    <FaDemocrat className="party-icon" />
                    Jimmy Carter (D):
                  </span>
                <span>{demActual.toFixed(1)}%</span>
              </div>
              <div className="polling-item republican">
                  <span className="polling-label">
                    <FaRepublican className="party-icon" />
                    Gerald Ford (R):
                  </span>
                <span>{repActual.toFixed(1)}%</span>
              </div>
              <div className="polling-margin">
                <span>Margin:</span>
                <span className={margin > 0 ? 'democrat' : 'republican'}>
                    {margin > 0 ? <FaDemocrat className="party-icon-inline" /> : <FaRepublican className="party-icon-inline" />}
                    {Math.abs(margin).toFixed(1)}% {margin > 0 ? 'Carter' : 'Ford'} Lead
                </span>
              </div>
              <div className="polling-error">
                <span>Margin of Error:</span>
                <span>±{polling.marginOfError.toFixed(1)}%</span>
              </div>
            </div>
          </div>

          <div className="info-section">
            <h3>Demographics</h3>
            <div className="demographics">
              <div className="demo-group">
                <h4>Democrats ({state.demographics.democraticBase.toFixed(1)}%)</h4>
                <div className="demo-item">
                  <span>Hardcore:</span>
                  <span>{detailedDemos.democrats.hardcore.toFixed(1)}%</span>
                </div>
                <div className="demo-item">
                  <span>Likely:</span>
                  <span>{detailedDemos.democrats.likely.toFixed(1)}%</span>
                </div>
                <div className="demo-item">
                  <span>Swingable:</span>
                  <span>{detailedDemos.democrats.swingable.toFixed(1)}%</span>
                </div>
              </div>
              
              <div className="demo-group">
                <h4>Independents ({state.demographics.independent.toFixed(1)}%)</h4>
                <div className="demo-item">
                  <span>Dem Hardcore:</span>
                  <span>{detailedDemos.independents.demHardcore.toFixed(1)}%</span>
                </div>
                <div className="demo-item">
                  <span>Dem Likely:</span>
                  <span>{detailedDemos.independents.demLikely.toFixed(1)}%</span>
                </div>
                <div className="demo-item">
                  <span>Swingable:</span>
                  <span>{detailedDemos.independents.swingable.toFixed(1)}%</span>
                </div>
              <div className="demo-item">
                  <span>Rep Likely:</span>
                  <span>{detailedDemos.independents.repLikely.toFixed(1)}%</span>
              </div>
              <div className="demo-item">
                  <span>Rep Hardcore:</span>
                  <span>{detailedDemos.independents.repHardcore.toFixed(1)}%</span>
                </div>
              </div>
              
              <div className="demo-group">
                <h4>Republicans ({state.demographics.republicanBase.toFixed(1)}%)</h4>
                <div className="demo-item">
                  <span>Hardcore:</span>
                  <span>{detailedDemos.republicans.hardcore.toFixed(1)}%</span>
              </div>
              <div className="demo-item">
                  <span>Likely:</span>
                  <span>{detailedDemos.republicans.likely.toFixed(1)}%</span>
              </div>
                <div className="demo-item">
                  <span>Swingable:</span>
                  <span>{detailedDemos.republicans.swingable.toFixed(1)}%</span>
                </div>
              </div>
              
              <div className="demo-group">
                <h4>Undecided</h4>
              <div className="demo-item">
                <span>Undecided:</span>
                  <span>{detailedDemos.undecided.toFixed(1)}%</span>
                </div>
              </div>
            </div>
          </div>

          <div className="info-section">
            <h3>Campaign Activity</h3>
            {activities.length > 0 ? (
              <div className="campaign-activities">
                {activities.map((activity, index) => {
                  let activityName = '';
                  let ActivityIconComponent: React.ComponentType | null = null;
                  let activityDetails = '';
                  
                  if (activity.type === 'hq') {
                    activityName = 'Campaign Headquarters';
                    ActivityIconComponent = RiHqFill;
                    activityDetails = `Established Week ${activity.weekCreated}`;
                  } else if (activity.type === 'ads') {
                    activityName = 'Media Campaign (Ads)';
                    ActivityIconComponent = FaAdversal;
                    activityDetails = `Running since Week ${activity.weekCreated}`;
                  } else if (activity.type === 'fundraising_booth') {
                    activityName = 'Fundraising Booth';
                    ActivityIconComponent = FaDollarSign;
                    if (fundraisingBooth) {
                      const weeksSinceCreation = gameState.currentWeek - fundraisingBooth.weekCreated;
                      const currentDrip = fundraisingBooth.initialAmount / Math.pow(2, weeksSinceCreation);
                      activityDetails = `Week ${activity.weekCreated} • Initial: $${(activity.initialValue || 0).toLocaleString()} • Current Drip: $${currentDrip.toLocaleString()}/week`;
                    } else {
                      activityDetails = `Established Week ${activity.weekCreated}`;
                    }
                  }
                  
                  return (
                    <div key={index} className="activity-item">
                      <span className="activity-icon">
                        {ActivityIconComponent && <ActivityIconComponent />}
                      </span>
                      <div className="activity-info">
                        <div className="activity-name">{activityName}</div>
                        <div className="activity-details">{activityDetails}</div>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="no-activities">No campaign activity in this state yet.</div>
            )}
          </div>

          <div className="info-section">
            <h3>Campaign Costs</h3>
            <div className="costs">
              <div className="cost-item">
                <span>Media Market Cost:</span>
                <span>{(state.campaignModifiers.mediaMarketCost * 100).toFixed(0)}% of base</span>
              </div>
              <div className="cost-item">
                <span>Event Effectiveness:</span>
                <span>{(state.campaignModifiers.eventEffectiveness * 100).toFixed(0)}% of base</span>
              </div>
              <div className="cost-item">
                <span>Fundraising Potential:</span>
                <span>{(state.campaignModifiers.fundraisingPotential * 100).toFixed(0)}% of base</span>
              </div>
            </div>
          </div>
          
          {onActionSelect && (
            <div className="info-section">
              <button 
                className="action-on-state-btn"
                onClick={() => {
                  onActionSelect(stateAbbreviation);
                  onClose();
                }}
              >
                Plan Action in {state.name}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

