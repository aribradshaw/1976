import { GameEngine } from '../game/GameEngine';
import { GameState, CampaignAction } from '../types/game';
import { calculateDetailedDemographics } from '../utils/demographics';
import { FaDemocrat, FaRepublican, FaDollarSign, FaAdversal } from 'react-icons/fa';
import { RiHqFill } from 'react-icons/ri';
import { TbPodium } from 'react-icons/tb';
import './StateInfoPanel.css';

const actionIcons: Record<CampaignAction['type'], React.ComponentType> = {
  large_donor_fundraiser: FaDollarSign,
  launch_ads: FaAdversal,
  campaign_hq: RiHqFill,
  rally: TbPodium,
};

interface StateInfoPanelProps {
  gameEngine: GameEngine;
  gameState: GameState;
  stateAbbreviation: string | null;
  onClose: () => void;
  onActionSelect?: (stateAbbreviation: string, actionType?: CampaignAction['type']) => void;
}

export default function StateInfoPanel({ 
  gameEngine, 
  gameState, 
  stateAbbreviation, 
  onClose,
  onActionSelect 
}: StateInfoPanelProps) {
  if (!stateAbbreviation) {
    return null;
  }

  const state = gameEngine.getStateData(stateAbbreviation);
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
  
  // Check HQ level to determine if icon should be faded
  const hqActivity = activities.find(a => a.type === 'hq');
  const currentHqLevel = hqActivity?.hqLevel || 0;
  const isHqMaxLevel = currentHqLevel >= 5;
  
  // Check if action types have already been scheduled for this state this week
  const isActionTypeScheduledForState = (actionType: CampaignAction['type']): boolean => {
    return gameState.actionsThisWeek.some(
      action => action.type === actionType && action.targetState === stateAbbreviation
    );
  };
  
  // Check if enough positions are locked for ads/rallies
  const lockedTopicCount = gameState.topicPositions.size;
  const canDoAds = lockedTopicCount >= 1; // Need at least 1 locked position for ads
  const canDoRally = lockedTopicCount >= 3; // Need at least 3 locked positions for rallies
  
  const isFundraiserScheduled = isActionTypeScheduledForState('large_donor_fundraiser');
  const isAdsScheduled = isActionTypeScheduledForState('launch_ads');
  const isHqScheduled = isActionTypeScheduledForState('campaign_hq');
  const isRallyScheduled = isActionTypeScheduledForState('rally');
  
  // Calculate projected turnout based on current turnout rate (capped between 40% and 95%)
  const turnoutRate = polling.turnoutRate || state.historicalData.turnoutRate;
  const projectedTurnout = state.population.registeredVoters * (turnoutRate / 100);
  
  // Get fundraising booth info if exists
  const fundraisingBooth = gameState.fundraisingBooths.find(b => b.state === stateAbbreviation);

  return (
    <div className="state-info-panel">
      <div className="state-info-header">
        <h2>{state.name}</h2>
        <button className="close-state-info-btn" onClick={onClose}>×</button>
      </div>
      
      <div className="state-info-content">
        {/* Quick Action Icons */}
        {onActionSelect && (
          <div className="info-section quick-actions">
            <h3>Weekly Actions</h3>
            <div className="quick-action-buttons">
              <button
                className={`quick-action-btn ${isFundraiserScheduled ? 'faded' : ''}`}
                onClick={() => {
                  if (!isFundraiserScheduled) {
                    // Switch to ActionPanel to show fundraiser confirmation
                    onActionSelect?.(stateAbbreviation, 'large_donor_fundraiser');
                  }
                }}
                data-tooltip={isFundraiserScheduled ? "Once per week" : "Fundraiser"}
                disabled={isFundraiserScheduled}
              >
                <span className="quick-action-icon">
                  {(() => {
                    const IconComponent = actionIcons.large_donor_fundraiser;
                    return <IconComponent />;
                  })()}
                </span>
              </button>
              <button
                className={`quick-action-btn ${isAdsScheduled || !canDoAds ? 'faded' : ''}`}
                onClick={() => !isAdsScheduled && canDoAds && onActionSelect?.(stateAbbreviation, 'launch_ads')}
                data-tooltip={
                  isAdsScheduled ? "Once per week" : 
                  !canDoAds ? "Lock 1+ positions in weekly events" : 
                  "Launch Ads"
                }
                disabled={isAdsScheduled || !canDoAds}
              >
                <span className="quick-action-icon">
                  {(() => {
                    const IconComponent = actionIcons.launch_ads;
                    return <IconComponent />;
                  })()}
                </span>
              </button>
              <button
                className={`quick-action-btn ${isHqMaxLevel || isHqScheduled ? 'faded' : ''}`}
                onClick={() => !isHqMaxLevel && !isHqScheduled && onActionSelect?.(stateAbbreviation, 'campaign_hq')}
                data-tooltip={isHqScheduled ? "Once per week" : isHqMaxLevel ? "Campaign HQ (Max Level)" : "Campaign HQ"}
                disabled={isHqMaxLevel || isHqScheduled}
              >
                <span className="quick-action-icon">
                  {(() => {
                    const IconComponent = actionIcons.campaign_hq;
                    return <IconComponent />;
                  })()}
                </span>
              </button>
              <button
                className={`quick-action-btn ${isRallyScheduled || !canDoRally ? 'faded' : ''}`}
                onClick={() => !isRallyScheduled && canDoRally && onActionSelect?.(stateAbbreviation, 'rally')}
                data-tooltip={
                  isRallyScheduled ? "Once per week" : 
                  !canDoRally ? "Lock 3+ positions in weekly events" : 
                  "Hold Rally"
                }
                disabled={isRallyScheduled || !canDoRally}
              >
                <span className="quick-action-icon">
                  {(() => {
                    const IconComponent = actionIcons.rally;
                    return <IconComponent />;
                  })()}
                </span>
              </button>
            </div>
          </div>
        )}

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
              <span>{Math.round(projectedTurnout).toLocaleString()} ({polling.turnoutRate.toFixed(1)}%)</span>
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

      </div>
    </div>
  );
}

