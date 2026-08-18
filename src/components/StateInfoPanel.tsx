import { GameEngine } from '../game/GameEngine';
import { GameState, CampaignAction } from '../types/game';
import { FaDemocrat, FaRepublican, FaDollarSign, FaAdversal } from 'react-icons/fa';
import { RiHqFill } from 'react-icons/ri';
import { TbPodium } from 'react-icons/tb';
import { playClickSound } from '../utils/sounds';
import { TOPICS } from '../data/topics';
import './StateInfoPanel.css';

// Polling Pie Chart Component
function PollingPieChart({ democrat, republican, undecided }: { democrat: number; republican: number; undecided: number }) {
  // Values are already percentages, normalize to 100% total for pie chart
  const total = democrat + republican + undecided;
  const demPercent = total > 0 ? (democrat / total) * 100 : 0;
  const repPercent = total > 0 ? (republican / total) * 100 : 0;
  const undecidedPercent = total > 0 ? (undecided / total) * 100 : 0;
  
  // Calculate angles for pie chart (in degrees)
  const demAngle = (demPercent / 100) * 360;
  const repAngle = (repPercent / 100) * 360;
  const undecidedAngle = (undecidedPercent / 100) * 360;
  
  // Calculate SVG path for pie chart
  const radius = 50;
  const centerX = 50;
  const centerY = 50;
  
  // Helper function to create arc path
  const createArc = (startAngle: number, endAngle: number) => {
    const start = (startAngle - 90) * (Math.PI / 180);
    const end = (endAngle - 90) * (Math.PI / 180);
    const x1 = centerX + radius * Math.cos(start);
    const y1 = centerY + radius * Math.sin(start);
    const x2 = centerX + radius * Math.cos(end);
    const y2 = centerY + radius * Math.sin(end);
    const largeArc = endAngle - startAngle > 180 ? 1 : 0;
    return `M ${centerX} ${centerY} L ${x1} ${y1} A ${radius} ${radius} 0 ${largeArc} 1 ${x2} ${y2} Z`;
  };
  
  let currentAngle = 0;
  const demPath = createArc(currentAngle, currentAngle + demAngle);
  currentAngle += demAngle;
  const repPath = createArc(currentAngle, currentAngle + repAngle);
  currentAngle += repAngle;
  const undecidedPath = createArc(currentAngle, currentAngle + undecidedAngle);
  
  return (
    <div className="polling-pie-chart">
      <svg viewBox="0 0 100 100" className="pie-svg">
        <path
          d={demPath}
          fill="#3b82f6"
          stroke="#f5f5dc"
          strokeWidth="0.5"
        />
        <path
          d={repPath}
          fill="#ef4444"
          stroke="#f5f5dc"
          strokeWidth="0.5"
        />
        <path
          d={undecidedPath}
          fill="#808080"
          stroke="#f5f5dc"
          strokeWidth="0.5"
        />
      </svg>
      <div className="pie-legend">
        <div className="legend-item">
          <span className="legend-color" style={{ backgroundColor: '#3b82f6' }}></span>
          <span className="legend-label">D: {democrat.toFixed(1)}%</span>
        </div>
        <div className="legend-item">
          <span className="legend-color" style={{ backgroundColor: '#ef4444' }}></span>
          <span className="legend-label">R: {republican.toFixed(1)}%</span>
        </div>
        <div className="legend-item">
          <span className="legend-color" style={{ backgroundColor: '#808080' }}></span>
          <span className="legend-label">U: {undecided.toFixed(1)}%</span>
        </div>
      </div>
    </div>
  );
}

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
  const undecidedActual = Math.max(0, 100 - demActual - repActual); // Calculate undecided
  const margin = demActual - repActual;
  
  // Get campaign activities
  const activities = gameEngine.getStateActivities(stateAbbreviation);
  
  // Get campaign events (log of all events)
  const events = gameEngine.getStateEvents(stateAbbreviation);
  
  // Check player's HQ level to determine if icon should be faded
  const hqActivity = activities.find(a => a.type === 'hq' && a.actor === 'player');
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

  // Check if all 6 action slots are filled
  const allSlotsFilled = gameState.actionsThisWeek.length >= 6;

  const isFundraiserScheduled = isActionTypeScheduledForState('large_donor_fundraiser');
  const isAdsScheduled = isActionTypeScheduledForState('launch_ads');
  const isHqScheduled = isActionTypeScheduledForState('campaign_hq');
  const isRallyScheduled = isActionTypeScheduledForState('rally');

  // Calculate costs for ads and rallies
  const calculateRallyCost = (): number => {
    if (!state || !polling) return 25000;
    
    // Base cost: 25k-200k based on state size (registered voters)
    const referenceVoters = 2500000; // Medium state reference
    const voterMultiplier = Math.min(1, state.population.registeredVoters / referenceVoters);
    const baseCost = 25000 + (175000 * voterMultiplier); // 25k-200k range
    
    // Adjust based on polling: if candidate is doing well, rallies are cheaper (momentum)
    const candidateSupport = gameState.playerCandidate === 'democrat' ? polling.democraticSupport : polling.republicanSupport;
    const pollingMultiplier = 0.7 + (0.3 * (1 - candidateSupport / 100)); // 0.7-1.0 multiplier
    
    return Math.round(baseCost * pollingMultiplier);
  };

  const calculateAdCost = (campaignSize: 'small' | 'medium' | 'large'): number => {
    if (!state || !polling) return 25000;
    
    // Base cost: 25k-5m based on state size (registered voters)
    const referenceVoters = 2500000; // Medium state reference
    const voterMultiplier = Math.min(1, state.population.registeredVoters / referenceVoters);
    const baseCost = 25000 + (4975000 * voterMultiplier); // 25k-5m range
    
    // Campaign size multipliers
    const sizeMultipliers = {
      small: 0.1,   // 10% of base
      medium: 0.5,  // 50% of base
      large: 1.0    // 100% of base
    };
    
    // Adjust based on polling: if candidate is doing well, ads are cheaper (momentum)
    const candidateSupport = gameState.playerCandidate === 'democrat' ? polling.democraticSupport : polling.republicanSupport;
    const pollingMultiplier = 0.7 + (0.3 * (1 - candidateSupport / 100)); // 0.7-1.0 multiplier
    
    return Math.round(baseCost * sizeMultipliers[campaignSize] * pollingMultiplier);
  };

  // Calculate HQ cost
  const calculateHqCost = (): number => {
    if (!state) return 500000;
    
    const costMultiplier = state.campaignModifiers.mediaMarketCost || 1.0;
    const baseCost = 500000; // $500K base
    const nextLevel = currentHqLevel + 1;
    
    // HQ cost increases with level: base * level * costMultiplier
    return Math.round(baseCost * nextLevel * costMultiplier);
  };

  // Check if player can afford ads (check smallest size)
  const minAdCost = calculateAdCost('small');
  const canAffordAds = gameState.resources.funds >= minAdCost;
  
  // Check if player can afford rally
  const rallyCost = calculateRallyCost();
  const canAffordRally = gameState.resources.funds >= rallyCost;
  
  // Check if player can afford HQ
  const hqCost = calculateHqCost();
  const canAffordHq = gameState.resources.funds >= hqCost;
  
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
                className={`quick-action-btn ${isFundraiserScheduled || allSlotsFilled ? 'faded' : ''}`}
                onClick={() => {
                  if (!isFundraiserScheduled && !allSlotsFilled) {
                    playClickSound(); // Play random click sound
                    // Switch to ActionPanel to show fundraiser confirmation
                    onActionSelect?.(stateAbbreviation, 'large_donor_fundraiser');
                  }
                }}
                data-tooltip={allSlotsFilled ? "All 6 action slots filled" : isFundraiserScheduled ? "Once per week" : "Fundraiser"}
                disabled={isFundraiserScheduled || allSlotsFilled}
              >
                <span className="quick-action-icon">
                  {(() => {
                    const IconComponent = actionIcons.large_donor_fundraiser;
                    return <IconComponent />;
                  })()}
                </span>
              </button>
              <button
                className={`quick-action-btn ${isAdsScheduled || !canDoAds || allSlotsFilled || !canAffordAds ? 'faded' : ''} ${!canAffordAds ? 'cannot-afford' : ''}`}
                onClick={() => {
                  if (!isAdsScheduled && canDoAds && !allSlotsFilled && canAffordAds) {
                    playClickSound(); // Play random click sound
                    onActionSelect?.(stateAbbreviation, 'launch_ads');
                  }
                }}
                data-tooltip={
                  !canAffordAds ? "You need to raise more money" :
                  allSlotsFilled ? "All 6 action slots filled" :
                  isAdsScheduled ? "Once per week" : 
                  !canDoAds ? "Lock 1+ positions in weekly interviews" : 
                  "Launch Ads"
                }
                data-tooltip-red={!canAffordAds ? "true" : undefined}
                disabled={isAdsScheduled || !canDoAds || allSlotsFilled || !canAffordAds}
              >
                <span className="quick-action-icon">
                  {(() => {
                    const IconComponent = actionIcons.launch_ads;
                    return <IconComponent />;
                  })()}
                </span>
              </button>
              <button
                className={`quick-action-btn ${isHqMaxLevel || isHqScheduled || allSlotsFilled || !canAffordHq ? 'faded' : ''} ${!canAffordHq ? 'cannot-afford' : ''}`}
                onClick={() => {
                  if (!isHqMaxLevel && !isHqScheduled && !allSlotsFilled && canAffordHq) {
                    playClickSound(); // Play random click sound
                    onActionSelect?.(stateAbbreviation, 'campaign_hq');
                  }
                }}
                data-tooltip={
                  !canAffordHq ? "You need to raise more money" :
                  allSlotsFilled ? "All 6 action slots filled" : 
                  isHqScheduled ? "Once per week" : 
                  isHqMaxLevel ? "Campaign HQ (Max Level)" : 
                  "Campaign HQ"
                }
                data-tooltip-red={!canAffordHq ? "true" : undefined}
                disabled={isHqMaxLevel || isHqScheduled || allSlotsFilled || !canAffordHq}
              >
                <span className="quick-action-icon">
                  {(() => {
                    const IconComponent = actionIcons.campaign_hq;
                    return <IconComponent />;
                  })()}
                </span>
              </button>
              <button
                className={`quick-action-btn ${isRallyScheduled || !canDoRally || allSlotsFilled || !canAffordRally ? 'faded' : ''} ${!canAffordRally ? 'cannot-afford' : ''}`}
                onClick={() => {
                  if (!isRallyScheduled && canDoRally && !allSlotsFilled && canAffordRally) {
                    playClickSound(); // Play random click sound
                    onActionSelect?.(stateAbbreviation, 'rally');
                  }
                }}
                data-tooltip={
                  !canAffordRally ? "You need to raise more money" :
                  allSlotsFilled ? "All 6 action slots filled" :
                  isRallyScheduled ? "Once per week" : 
                  !canDoRally ? "Lock 3+ positions in weekly interviews" : 
                  "Hold Rally"
                }
                data-tooltip-red={!canAffordRally ? "true" : undefined}
                disabled={isRallyScheduled || !canDoRally || allSlotsFilled || !canAffordRally}
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

        <div className="info-section voting-profile-section">
          <h3>VOTING PROFILE</h3>
          <div className="voting-profile-content">
            <div className="ev-display">
              <p className="ev-count">{state.electoralVotes}</p>
              <p className="ev-label">Electoral Votes</p>
            </div>
            <div className="polling-chart">
              <PollingPieChart 
                democrat={demActual} 
                republican={repActual} 
                undecided={undecidedActual} 
              />
            </div>
          </div>
          <div className="voting-profile-meta">
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
          <h3>Campaign Momentum</h3>
          <div className="momentum-display">
            {(() => {
              const playerMomentum = gameState.stateMomentum.get(stateAbbreviation) || 0;
              const opponentMomentum = gameState.opponentStateMomentum.get(stateAbbreviation) || 0;
              const isPlayerDem = gameState.playerCandidate === 'democrat';
              
              // Show player momentum first, then opponent
              return (
                <>
                  <div className="momentum-item">
                    <span>{isPlayerDem ? 'Carter' : 'Ford'} Momentum:</span>
                    <span className={`momentum-value ${playerMomentum >= 0 ? 'positive' : 'negative'}`}>
                      {playerMomentum >= 0 ? '+' : ''}
                      {playerMomentum.toFixed(1)}
                    </span>
                  </div>
                  <div className="momentum-item">
                    <span>{isPlayerDem ? 'Ford' : 'Carter'} Momentum:</span>
                    <span className={`momentum-value ${opponentMomentum >= 0 ? 'positive' : 'negative'}`}>
                      {opponentMomentum >= 0 ? '+' : ''}
                      {opponentMomentum.toFixed(1)}
                    </span>
                  </div>
                </>
              );
            })()}
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
                  const actorLabel = activity.actor === 'opponent' 
                    ? ` (${gameState.playerCandidate === 'democrat' ? 'Ford' : 'Carter'})`
                    : ` (${gameState.playerCandidate === 'democrat' ? 'Carter' : 'Ford'})`;
                  activityName = `Campaign Headquarters${actorLabel}`;
                  ActivityIconComponent = RiHqFill;
                  activityDetails = `Level ${activity.hqLevel || 1} • Established Week ${activity.weekCreated}`;
                } else if (activity.type === 'ads') {
                  activityName = 'Media Campaign (Ads)';
                  ActivityIconComponent = FaAdversal;
                  const topic = TOPICS.find(t => t.id === activity.adTopic);
                  activityDetails = `Topic: ${topic?.name || activity.adTopic} • Running since Week ${activity.weekCreated}`;
                } else if (activity.type === 'fundraising_booth') {
                  activityName = 'Fundraising';
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
          <h3>Event Log</h3>
          {events.length > 0 ? (
            <div className="campaign-events">
              {events.slice().reverse().map((event, index) => {
                let eventName = '';
                let EventIconComponent: React.ComponentType | null = null;
                let eventDetails = '';
                
                if (event.type === 'rally') {
                  eventName = 'Rally';
                  EventIconComponent = TbPodium;
                  const topics = event.rallyTopics?.map(topicId => {
                    const topic = TOPICS.find(t => t.id === topicId);
                    return topic?.name || topicId;
                  }).join(', ') || '';
                  eventDetails = `Week ${event.week} • Topics: ${topics}`;
                } else if (event.type === 'large_donor_fundraiser') {
                  eventName = 'Large Donor Fundraiser';
                  EventIconComponent = FaDollarSign;
                  eventDetails = `Week ${event.week} • Raised: $${(event.fundraisingAmount || 0).toLocaleString()}`;
                } else if (event.type === 'launch_ads') {
                  eventName = 'Ad Campaign';
                  EventIconComponent = FaAdversal;
                  const topic = TOPICS.find(t => t.id === event.adTopic);
                  const sizeLabel = event.campaignSize ? ` (${event.campaignSize.charAt(0).toUpperCase() + event.campaignSize.slice(1)})` : '';
                  eventDetails = `Week ${event.week} • Topic: ${topic?.name || event.adTopic}${sizeLabel}`;
                } else if (event.type === 'campaign_hq') {
                  eventName = event.hqLevel === 1 ? 'Campaign HQ Established' : `Campaign HQ Upgraded to Level ${event.hqLevel}`;
                  EventIconComponent = RiHqFill;
                  eventDetails = `Week ${event.week} • Level ${event.hqLevel}`;
                }
                
                const isOpponent = event.isOpponent || false;
                const opponentLabel = isOpponent ? ` (${gameState.playerCandidate === 'democrat' ? 'Ford' : 'Carter'})` : '';
                
                return (
                  <div key={index} className={`event-item ${isOpponent ? 'opponent-event' : ''}`}>
                    {EventIconComponent && (
                      <div className="event-icon">
                        <EventIconComponent />
                      </div>
                    )}
                    <div className="event-info">
                      <div className="event-name">
                        {eventName}{opponentLabel}
                      </div>
                      <div className="event-details">{eventDetails}</div>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="no-events">No events logged for this state yet.</div>
          )}
        </div>

      </div>
    </div>
  );
}

