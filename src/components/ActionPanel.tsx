import { useState, useEffect, useRef } from 'react';
import { GameEngine } from '../game/GameEngine';
import { GameState, CampaignAction, Candidate } from '../types/game';
import { TopicId } from '../data/topics';
import TopicSelector from './TopicSelector';
import { FaDollarSign, FaAdversal } from 'react-icons/fa';
import { RiHqFill } from 'react-icons/ri';
import { TbPodium } from 'react-icons/tb';
import { playClickSound, playEndTurnSound } from '../utils/sounds';
import './ActionPanel.css';

interface ActionPanelProps {
  gameEngine: GameEngine;
  gameState: GameState;
  onAction: (action: CampaignAction) => void;
  onEndTurn: () => void;
  selectedState?: string | null;
  onStateSelect?: (state: string | null) => void;
  onRemoveAction?: (index: number) => void;
  onCancel?: () => void; // Callback to go back to state view
  preSelectedActionType?: CampaignAction['type'] | null;
  playerCandidate: Candidate;
}

const actionIcons: Record<CampaignAction['type'], React.ComponentType> = {
  large_donor_fundraiser: FaDollarSign,
  launch_ads: FaAdversal,
  campaign_hq: RiHqFill,
  rally: TbPodium,
};

const actionTitles: Record<CampaignAction['type'], string> = {
  large_donor_fundraiser: 'Large Donor Fundraiser',
  launch_ads: 'Launch Ads',
  campaign_hq: 'Campaign HQ',
  rally: 'Hold Rally',
};

export default function ActionPanel({ gameEngine, gameState, onAction, onEndTurn, selectedState, onStateSelect, onRemoveAction, onCancel, preSelectedActionType, playerCandidate }: ActionPanelProps) {
  const [selectedActionType, setSelectedActionType] = useState<CampaignAction['type'] | null>(preSelectedActionType || null);
  const [localSelectedState, setLocalSelectedState] = useState<string>('');
  const [showTopicSelector, setShowTopicSelector] = useState(false);
  const [showFundraiserConfirmation, setShowFundraiserConfirmation] = useState(false);
  const [fundraisingAmount, setFundraisingAmount] = useState<number>(0);
  const [selectedTopics, setSelectedTopics] = useState<TopicId[]>([]);
  const [hqLevel, setHqLevel] = useState<number>(1);
  const executedPreSelectedAction = useRef<string | null>(null);
  
  const currentSelectedState = selectedState || localSelectedState;
  const states = gameEngine.getAllStates();
  
  // Check if an action type has already been scheduled for a state this week
  const isActionTypeScheduledForState = (actionType: CampaignAction['type'], stateAbbrev: string): boolean => {
    return gameState.actionsThisWeek.some(
      action => action.type === actionType && action.targetState === stateAbbrev
    );
  };

  useEffect(() => {
    if (selectedState) {
      setLocalSelectedState(selectedState);
    } else {
      // Clear local state when selectedState is cleared
      setLocalSelectedState('');
    }
  }, [selectedState]);

  useEffect(() => {
    // Only execute if preSelectedActionType is set and we haven't already executed it
    if (preSelectedActionType && currentSelectedState && executedPreSelectedAction.current !== `${preSelectedActionType}-${currentSelectedState}`) {
      // Check if this action type is already scheduled for this state
      if (isActionTypeScheduledForState(preSelectedActionType, currentSelectedState)) {
        // Already scheduled, don't execute
        setSelectedActionType(null);
        return;
      }
      
      // Mark as executed to prevent double execution
      executedPreSelectedAction.current = `${preSelectedActionType}-${currentSelectedState}`;
      
      // Only auto-execute if coming from quick action icons (preSelectedActionType is set)
      // Don't auto-execute if user clicked the button directly (that goes through handleActionClick)
      if (preSelectedActionType === 'large_donor_fundraiser') {
        // Show fundraiser confirmation instead of auto-executing
        const amount = gameEngine.calculateFundraisingAmount(currentSelectedState);
        setFundraisingAmount(amount);
        setShowFundraiserConfirmation(true);
        setSelectedActionType('large_donor_fundraiser');
      } else if (preSelectedActionType === 'campaign_hq') {
        // Check current HQ level and auto-execute
        const activities = gameEngine.getStateActivities(currentSelectedState);
        // Check player's HQ (not opponent's)
        const hqActivity = activities.find(a => a.type === 'hq' && a.actor === 'player');
        const currentLevel = hqActivity?.hqLevel || 0;
        const nextLevel = Math.min(5, currentLevel + 1);
        
        // If already at max level, don't execute
        if (currentLevel >= 5) {
          setSelectedActionType(null);
          // Close the panel if at max level
          onStateSelect?.(null);
          return;
        }
        
        // Auto-execute with next level
        const action = createAction(preSelectedActionType, currentSelectedState, undefined, undefined, nextLevel);
        if (action && gameState.resources.funds >= action.cost) {
          onAction(action);
          // Immediately clear all local state
          setSelectedActionType(null);
          setLocalSelectedState('');
          setShowTopicSelector(false);
          setSelectedTopics([]);
          onStateSelect?.(null);
        }
      } else if (preSelectedActionType === 'launch_ads' || preSelectedActionType === 'rally') {
        // Show topic selector
        setSelectedActionType(preSelectedActionType);
        setShowTopicSelector(true);
      }
    }
    
    // Reset the executed flag when preSelectedActionType changes to null
    if (!preSelectedActionType) {
      executedPreSelectedAction.current = null;
    }
  }, [preSelectedActionType, currentSelectedState]);

  const getActionCost = (type: CampaignAction['type'], targetState?: string): number => {
    const state = targetState ? gameEngine.getStateData(targetState) : null;
    const costMultiplier = state ? state.campaignModifiers.mediaMarketCost : 1.0;
    
    const baseCosts: Record<CampaignAction['type'], number> = {
      large_donor_fundraiser: 0,  // Free - generates money
      launch_ads: 300000,         // $300K
      campaign_hq: 500000,        // $500K base
      rally: 400000,              // $400K
    };
    
    // HQ cost increases with level
    if (type === 'campaign_hq') {
      return baseCosts[type] * hqLevel * costMultiplier;
    }
    
    return baseCosts[type] * costMultiplier;
  };

  const calculateRallyCost = (targetState: string): number => {
    const state = gameEngine.getStateData(targetState);
    if (!state) return 25000;
    
    const polling = gameState.polling.get(targetState);
    if (!polling) return 25000;
    
    // Base cost: 25k-200k based on state size (registered voters)
    const referenceVoters = 2500000; // Medium state reference
    const voterMultiplier = Math.min(1, state.population.registeredVoters / referenceVoters);
    const baseCost = 25000 + (175000 * voterMultiplier); // 25k-200k range
    
    // Adjust based on polling: if candidate is doing well, rallies are cheaper (momentum)
    const candidateSupport = playerCandidate === 'democrat' ? polling.democraticSupport : polling.republicanSupport;
    const pollingMultiplier = 0.7 + (0.3 * (1 - candidateSupport / 100)); // 0.7-1.0 multiplier
    
    return Math.round(baseCost * pollingMultiplier);
  };

  const calculateAdCost = (targetState: string, campaignSize: 'small' | 'medium' | 'large'): number => {
    const state = gameEngine.getStateData(targetState);
    if (!state) return 25000;
    
    const polling = gameState.polling.get(targetState);
    if (!polling) return 25000;
    
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
    const candidateSupport = playerCandidate === 'democrat' ? polling.democraticSupport : polling.republicanSupport;
    const pollingMultiplier = 0.7 + (0.3 * (1 - candidateSupport / 100)); // 0.7-1.0 multiplier
    
    return Math.round(baseCost * sizeMultipliers[campaignSize] * pollingMultiplier);
  };

  const createAction = (
    type: CampaignAction['type'], 
    targetState: string,
    adTopic?: TopicId,
    rallyTopics?: TopicId[],
    hqLevel?: number,
    campaignSize?: 'small' | 'medium' | 'large'
  ): CampaignAction | null => {
    if (!targetState) return null;

    let cost: number;
    if (type === 'rally') {
      cost = calculateRallyCost(targetState);
    } else if (type === 'launch_ads' && campaignSize) {
      cost = calculateAdCost(targetState, campaignSize);
    } else {
      cost = getActionCost(type, targetState);
    }
    
    const state = gameEngine.getStateData(targetState);
    
    let description = '';
    if (type === 'large_donor_fundraiser') {
      description = `Large Donor Fundraiser in ${state?.name || targetState}`;
    } else if (type === 'launch_ads' && adTopic) {
      const sizeLabel = campaignSize ? ` (${campaignSize.charAt(0).toUpperCase() + campaignSize.slice(1)} Campaign)` : '';
      description = `Launch Ads in ${state?.name || targetState} (${adTopic})${sizeLabel}`;
    } else if (type === 'campaign_hq' && hqLevel) {
      description = `${hqLevel === 1 ? 'Set Up' : 'Upgrade'} Campaign HQ Level ${hqLevel} in ${state?.name || targetState}`;
    } else if (type === 'rally' && rallyTopics) {
      description = `Hold Rally in ${state?.name || targetState} (${rallyTopics.join(', ')})`;
    } else {
      return null;
    }

    return {
      type,
      targetState,
      cost,
      week: gameState.currentWeek,
      description,
      adTopic,
      rallyTopics,
      hqLevel,
      campaignSize, // Include campaign size for ads
    };
  };

  const handleActionClick = (actionType: CampaignAction['type']) => {
    playClickSound(); // Play random click sound
    
    if (!currentSelectedState) {
      // Need to select a state first
      setSelectedActionType(actionType);
      return;
    }
    
    // Check if this action type is already scheduled for this state
    if (isActionTypeScheduledForState(actionType, currentSelectedState)) {
      // Already scheduled, don't allow
      return;
    }

    // Check if enough positions are locked for ads/rallies
    const lockedTopicCount = gameState.topicPositions.size;
    const canDoAds = lockedTopicCount >= 1; // Need at least 1 locked position for ads
    const canDoRally = lockedTopicCount >= 3; // Need at least 3 locked positions for rallies
    
    // Check if action needs topic selection
    if (actionType === 'launch_ads') {
      if (!canDoAds) {
        // Not enough positions locked
        return;
      }
      setSelectedActionType(actionType);
      setShowTopicSelector(true);
      setSelectedTopics([]);
    } else if (actionType === 'rally') {
      if (!canDoRally) {
        // Not enough positions locked
        return;
      }
      setSelectedActionType(actionType);
      setShowTopicSelector(true);
      setSelectedTopics([]);
    } else if (actionType === 'campaign_hq') {
      // Auto-determine HQ level and execute
      // Skip if preSelectedActionType is set (let useEffect handle it)
      if (preSelectedActionType === 'campaign_hq') {
        return;
      }
      
      const activities = gameEngine.getStateActivities(currentSelectedState);
      // Check player's HQ (not opponent's)
      const hqActivity = activities.find(a => a.type === 'hq' && a.actor === 'player');
      const currentLevel = hqActivity?.hqLevel || 0;
      const nextLevel = Math.min(5, currentLevel + 1);
      
      // If already at max level, don't execute
      if (currentLevel >= 5) {
        return;
      }
      
      // Auto-execute with next level
      const action = createAction(actionType, currentSelectedState, undefined, undefined, nextLevel);
      if (action && gameState.resources.funds >= action.cost) {
        onAction(action);
        // Immediately clear all local state
        setSelectedActionType(null);
        setLocalSelectedState('');
        setShowTopicSelector(false);
        setSelectedTopics([]);
        onStateSelect?.(null);
      }
    } else if (actionType === 'large_donor_fundraiser') {
      // Large Donor Fundraiser - show confirmation
      const amount = gameEngine.calculateFundraisingAmount(currentSelectedState);
      setFundraisingAmount(amount);
      setShowFundraiserConfirmation(true);
      setSelectedActionType('large_donor_fundraiser');
    }
  };

  const handleTopicSelectorConfirm = (campaignSize?: 'small' | 'medium' | 'large') => {
    if (!selectedActionType || !currentSelectedState) return;
    
    if (selectedActionType === 'launch_ads' && selectedTopics.length === 1 && campaignSize) {
      const action = createAction(selectedActionType, currentSelectedState, selectedTopics[0], undefined, undefined, campaignSize);
      if (action && gameState.resources.funds >= action.cost) {
        onAction(action);
        setSelectedActionType(null);
        setShowTopicSelector(false);
        setSelectedTopics([]);
        setLocalSelectedState('');
        onStateSelect?.(null);
      }
    } else if (selectedActionType === 'rally' && selectedTopics.length === 3) {
      const action = createAction(selectedActionType, currentSelectedState, undefined, selectedTopics);
      if (action && gameState.resources.funds >= action.cost) {
        onAction(action);
        setSelectedActionType(null);
        setShowTopicSelector(false);
        setSelectedTopics([]);
        setLocalSelectedState('');
        onStateSelect?.(null);
      }
    }
  };

  const handleHQConfirm = () => {
    if (!selectedActionType || !currentSelectedState) return;
    
    const action = createAction(selectedActionType, currentSelectedState, undefined, undefined, hqLevel);
    if (action && gameState.resources.funds >= action.cost) {
      onAction(action);
      setSelectedActionType(null);
      setHqLevel(1);
      setLocalSelectedState('');
      onStateSelect?.(null);
    }
  };

  const maxActions = 6;
  const queuedActionsCount = gameState.actionsThisWeek.length;
  const canEndTurn = gameState.resources.actionsRemaining === 0 || queuedActionsCount >= maxActions;
  const allSlotsFilled = queuedActionsCount >= maxActions;
  
  const dayLabels = ['MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'];

  const handleFundraiserAccept = () => {
    playClickSound(); // Play random click sound
    if (selectedActionType === 'large_donor_fundraiser' && currentSelectedState) {
      const action = createAction(selectedActionType, currentSelectedState);
      if (action) {
        onAction(action);
        // Clear all state and deselect
        setSelectedActionType(null);
        setLocalSelectedState('');
        setShowFundraiserConfirmation(false);
        setShowTopicSelector(false);
        setSelectedTopics([]);
        onStateSelect?.(null);
      }
    }
  };

  const handleFundraiserDeny = () => {
    playClickSound(); // Play random click sound
    // Go back to state view (StateInfoPanel)
    setShowFundraiserConfirmation(false);
    setSelectedActionType(null);
    onCancel?.(); // Call onCancel to switch back to StateInfoPanel
  };

  return (
    <div className="action-panel">
      <h3>Campaign Actions</h3>
      
      {showFundraiserConfirmation && selectedActionType === 'large_donor_fundraiser' && currentSelectedState ? (
        <div className="fundraiser-confirmation">
          <h4>Fundraiser Confirmation</h4>
          <div className="fundraiser-amount">
            <p>Estimated Earnings:</p>
            <p className="amount-value">${(fundraisingAmount / 1000).toFixed(0)}K</p>
          </div>
          <div className="fundraiser-buttons">
            <button 
              className="fundraiser-accept-btn"
              onClick={handleFundraiserAccept}
            >
              Accept
            </button>
            <button 
              className="fundraiser-deny-btn"
              onClick={handleFundraiserDeny}
            >
              Deny
            </button>
          </div>
        </div>
      ) : showTopicSelector && selectedActionType && currentSelectedState ? (
        <TopicSelector
          selectedTopics={selectedTopics}
          maxSelections={selectedActionType === 'launch_ads' ? 1 : 3}
          onSelectionChange={setSelectedTopics}
          onConfirm={handleTopicSelectorConfirm}
          onCancel={() => {
            setShowTopicSelector(false);
            setSelectedTopics([]);
            setSelectedActionType(null);
            onCancel?.(); // Go back to StateInfoPanel
          }}
          actionType={selectedActionType}
          stateAbbreviation={currentSelectedState}
          gameEngine={gameEngine}
          gameState={gameState}
          playerCandidate={playerCandidate}
        />
      ) : null}

      {!currentSelectedState ? (
        <div className="no-state-selected">
          <p>Select a state on the map to choose campaign actions.</p>
        </div>
      ) : !selectedActionType ? (
        <div className="action-buttons">
          {(() => {
            const isFundraiserScheduled = isActionTypeScheduledForState('large_donor_fundraiser', currentSelectedState);
            const isFundraiserDisabled = gameState.resources.actionsRemaining === 0 || queuedActionsCount >= maxActions || isFundraiserScheduled;
            return (
              <button 
                className={`action-btn ${isFundraiserScheduled ? 'faded' : ''}`}
                onClick={() => handleActionClick('large_donor_fundraiser')}
                disabled={isFundraiserDisabled}
                title={isFundraiserScheduled ? "You can only do this once per week in each state" : undefined}
              >
                <div className="action-name">{actionTitles.large_donor_fundraiser}</div>
                <div className="action-desc">Raise funds from large donors</div>
                <div className="action-cost">Free (Generates $500K-$1M)</div>
              </button>
            );
          })()}
          
          {(() => {
            const isAdsScheduled = isActionTypeScheduledForState('launch_ads', currentSelectedState);
            const isAdsDisabled = gameState.resources.actionsRemaining === 0 || queuedActionsCount >= maxActions || isAdsScheduled;
            return (
              <button 
                className={`action-btn ${isAdsScheduled ? 'faded' : ''}`}
                onClick={() => handleActionClick('launch_ads')}
                disabled={isAdsDisabled}
                title={isAdsScheduled ? "You can only do this once per week in each state" : undefined}
              >
                <div className="action-name">{actionTitles.launch_ads}</div>
                <div className="action-desc">Launch TV/Radio ads (choose 1 topic)</div>
                <div className="action-cost">~$300K</div>
              </button>
            );
          })()}
          
          {(() => {
            const activities = gameEngine.getStateActivities(currentSelectedState);
            // Check player's HQ (not opponent's)
            const hqActivity = activities.find(a => a.type === 'hq' && a.actor === 'player');
            const currentLevel = hqActivity?.hqLevel || 0;
            const isHqMaxLevel = currentLevel >= 5;
            const isHqScheduled = isActionTypeScheduledForState('campaign_hq', currentSelectedState);
            const isHqDisabled = gameState.resources.actionsRemaining === 0 || queuedActionsCount >= maxActions || isHqMaxLevel || isHqScheduled;
            return (
              <button 
                className={`action-btn ${isHqMaxLevel || isHqScheduled ? 'faded' : ''}`}
                onClick={() => handleActionClick('campaign_hq')}
                disabled={isHqDisabled}
                title={isHqScheduled ? "You can only do this once per week in each state" : isHqMaxLevel ? "Campaign HQ (Max Level)" : undefined}
              >
                <div className="action-name">{actionTitles.campaign_hq}</div>
                <div className="action-desc">
                  {isHqMaxLevel ? 'HQ at Max Level (5)' : currentLevel === 0 ? 'Set up Campaign HQ (Level 1)' : `Upgrade Campaign HQ to Level ${currentLevel + 1}`}
                </div>
                <div className="action-cost">
                  {(() => {
                    const nextLevel = Math.min(5, currentLevel + 1);
                    return `~$${(500 * nextLevel)}K`;
                  })()}
                </div>
              </button>
            );
          })()}
          
          {(() => {
            const lockedTopicCount = gameState.topicPositions.size;
            const canDoRally = lockedTopicCount >= 3; // Need at least 3 locked positions for rallies
            const isRallyScheduled = isActionTypeScheduledForState('rally', currentSelectedState);
            const isRallyDisabled = gameState.resources.actionsRemaining === 0 || queuedActionsCount >= maxActions || isRallyScheduled || !canDoRally;
            return (
              <button 
                className={`action-btn ${isRallyScheduled || !canDoRally ? 'faded' : ''}`}
                onClick={() => handleActionClick('rally')}
                disabled={isRallyDisabled}
                data-tooltip={
                  isRallyScheduled ? "Once per week" : 
                  !canDoRally ? "Lock at least 3 issue positions in weekly interviews" : 
                  undefined
                }
              >
                <div className="action-name">{actionTitles.rally}</div>
                <div className="action-desc">Hold rally (choose 3 topics)</div>
                <div className="action-cost">~$400K</div>
              </button>
            );
          })()}
        </div>
      ) : null}

      {/* Action Slots Section */}
      <div className="action-slots-section">
        <h4>Weekly Actions ({queuedActionsCount}/{maxActions})</h4>
        <div className="action-slots-grid">
          {Array.from({ length: maxActions }, (_, index) => {
            const action = gameState.actionsThisWeek[index];
            const isEmpty = !action;
            const dayLabel = dayLabels[index];
            
            if (isEmpty) {
              return (
                <div key={index} className="action-slot empty-slot">
                  <div className="slot-day">{dayLabel}</div>
                  <div className="slot-placeholder">Empty</div>
                </div>
              );
            }
            
            const state = action.targetState ? gameEngine.getStateData(action.targetState) : null;
            return (
              <div 
                key={index} 
                className="action-slot filled-slot"
                onClick={() => {
                  playClickSound(); // Play random click sound
                  onRemoveAction?.(index);
                }}
                title="Click to remove this action"
              >
                <div className="slot-day">{dayLabel}</div>
                <button 
                  className="slot-remove-btn"
                  onClick={(e) => {
                    e.stopPropagation();
                    onRemoveAction?.(index);
                  }}
                  title="Remove action"
                >
                  ×
                </button>
                <span className="slot-icon">
                  {(() => {
                    const IconComponent = actionIcons[action.type];
                    return <IconComponent />;
                  })()}
                </span>
                <div className="slot-info">
                  <div className="slot-title">{actionTitles[action.type]}</div>
                  {state && (
                    <div className="slot-state">{state.abbreviation}</div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <div className="end-turn-section">
        <button
          className={`end-turn-btn ${allSlotsFilled ? 'highlighted' : ''}`}
          onClick={() => {
            playEndTurnSound(); // Play end turn sound (different from click sounds)
            onEndTurn();
          }}
          disabled={!canEndTurn}
          title={!canEndTurn ? `Queue ${maxActions - queuedActionsCount} more action${maxActions - queuedActionsCount !== 1 ? 's' : ''} to end the week` : ''}
        >
          End Week
        </button>
        {!canEndTurn && !allSlotsFilled && (
          <p className="end-turn-note">Queue {maxActions - queuedActionsCount} more action{maxActions - queuedActionsCount !== 1 ? 's' : ''} to end the week</p>
        )}
        {allSlotsFilled && (
          <p className="end-turn-note highlighted-note">All action slots filled! Ready to end the week.</p>
        )}
      </div>
    </div>
  );
}
