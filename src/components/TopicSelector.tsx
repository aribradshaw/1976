import { useState, useEffect, useMemo, useCallback } from 'react';
import { TOPICS, TopicId, Microgroup, TOPIC_RATINGS } from '../data/topics';
import { GameEngine } from '../game/GameEngine';
import { GameState, CampaignAction, Candidate } from '../types/game';
import { calculateTopicRelationshipChange } from '../game/relationshipCalculator';
import { calculateDetailedDemographics } from '../utils/demographics';
import { playClickSound } from '../utils/sounds';
import './TopicSelector.css';

interface TopicSelectorProps {
  selectedTopics: TopicId[];
  maxSelections: number;
  onSelectionChange: (topics: TopicId[]) => void;
  onConfirm: (campaignSize?: 'small' | 'medium' | 'large') => void;
  onCancel: () => void;
  actionType: CampaignAction['type'];
  stateAbbreviation: string;
  gameEngine: GameEngine;
  gameState: GameState;
  playerCandidate: Candidate;
}

export default function TopicSelector({ 
  selectedTopics, 
  maxSelections, 
  onSelectionChange, 
  onConfirm, 
  onCancel,
  actionType,
  stateAbbreviation,
  gameEngine,
  gameState,
  playerCandidate
}: TopicSelectorProps) {
  const [showTip, setShowTip] = useState(() => {
    const tipDismissed = localStorage.getItem('topicPositionTipDismissed');
    return tipDismissed !== 'true';
  });
  const [dontShowAgain, setDontShowAgain] = useState(false);
  const [pendingPosition, setPendingPosition] = useState<{ topicId: TopicId; position: 'for' | 'against' } | null>(null);
  const [localGameState, setLocalGameState] = useState<GameState>(gameState);

  const handleTopicClick = (topicId: TopicId) => {
    const currentIndex = selectedTopics.indexOf(topicId);
    let newSelection: TopicId[];
    
    if (currentIndex === -1) {
      // Add topic if not at max
      if (selectedTopics.length < maxSelections) {
        newSelection = [...selectedTopics, topicId];
      } else {
        // Replace last topic if at max
        newSelection = [...selectedTopics.slice(0, -1), topicId];
      }
      
      // Check if this is the first time selecting ANY topic (show tip)
      const hasAnyPosition = localGameState.topicPositions.size > 0;
      const existingPosition = localGameState.topicPositions.get(topicId);
      
      if (!existingPosition && showTip && !hasAnyPosition) {
        // Show tip on first topic selection ever
        setPendingPosition({ topicId, position: 'for' }); // Default to 'for'
        onSelectionChange(newSelection);
        return;
      }
    } else {
      // Remove topic if already selected
      newSelection = selectedTopics.filter(t => t !== topicId);
    }
    
    onSelectionChange(newSelection);
  };

  // Update local gameState when prop changes
  useEffect(() => {
    setLocalGameState(gameState);
  }, [gameState]);

  // Also sync with engine state periodically
  useEffect(() => {
    const freshState = gameEngine.getGameState();
    setLocalGameState(freshState);
  }, [selectedTopics, gameEngine]);

  const handlePositionSelect = (topicId: TopicId, position: 'for' | 'against') => {
    // Set the position globally (locked for all states)
    gameEngine.setTopicPosition(topicId, position);
    
    // Get fresh gameState from engine
    const freshState = gameEngine.getGameState();
    setLocalGameState(freshState);
    
    // Force re-render by updating selected topics
    onSelectionChange([...selectedTopics]);
  };

  const handleTipDismiss = () => {
    if (dontShowAgain) {
      localStorage.setItem('topicPositionTipDismissed', 'true');
    }
    setShowTip(false);
    setPendingPosition(null);
  };

  const canConfirm = selectedTopics.length === maxSelections && 
                     selectedTopics.every(topicId => localGameState.topicPositions.get(topicId));

  // Calculate estimated effects - wrapped in useCallback to ensure it's stable
  const calculateEstimatedEffects = useCallback((campaignSize?: 'small' | 'medium' | 'large') => {
    console.log('=== calculateEstimatedEffects CALLED ===');
    console.log('selectedTopics.length:', selectedTopics.length);
    console.log('campaignSize:', campaignSize);
    
    if (selectedTopics.length === 0) {
      console.log('No topics selected, returning zero');
      return { demChange: 0, repChange: 0, indieChange: 0, turnoutChange: 0 };
    }

    const state = gameEngine.getStateData(stateAbbreviation);
    const relationships = localGameState.microgroupRelationships.get(stateAbbreviation);
    console.log('state:', state?.name, 'relationships:', relationships);
    if (!state || !relationships) {
      console.log('Missing state or relationships, returning zero');
      return { demChange: 0, repChange: 0, indieChange: 0, turnoutChange: 0 };
    }

    // Determine power multiplier
    let powerMultiplier = 1;
    if (actionType === 'rally') {
      // Rallies: same power as small ad campaign on all 3 issues (1x per topic, 3 topics total)
      powerMultiplier = 1; // Each topic gets 1x, so 3 topics = 3x total effect
    } else if (actionType === 'launch_ads' && campaignSize) {
      // Ads: small = 1x, medium = 3x, large = 5x
      const multipliers = { small: 1, medium: 3, large: 5 };
      powerMultiplier = multipliers[campaignSize];
    }

    // Calculate relationship changes for each microgroup
    const microgroups: Microgroup[] = [
      'hardcore_dem', 'lean_dem', 'swingable_dem',
      'hardcore_rep', 'lean_rep', 'swingable_rep',
      'hardcore_dem_indie', 'lean_dem_indie', 'swingable_indie',
      'lean_rep_indie', 'hardcore_rep_indie',
    ];

    const demGroups: Microgroup[] = ['hardcore_dem', 'lean_dem', 'swingable_dem', 'hardcore_dem_indie', 'lean_dem_indie'];
    const repGroups: Microgroup[] = ['hardcore_rep', 'lean_rep', 'swingable_rep', 'lean_rep_indie', 'hardcore_rep_indie'];
    const indieGroups: Microgroup[] = ['hardcore_dem_indie', 'lean_dem_indie', 'swingable_indie', 'lean_rep_indie', 'hardcore_rep_indie'];

    // Calculate relationship changes per microgroup
    const relationshipChanges: Record<Microgroup, number> = {
      hardcore_dem: 0,
      lean_dem: 0,
      swingable_dem: 0,
      hardcore_rep: 0,
      lean_rep: 0,
      swingable_rep: 0,
      hardcore_dem_indie: 0,
      lean_dem_indie: 0,
      swingable_indie: 0,
      lean_rep_indie: 0,
      hardcore_rep_indie: 0,
    };

    // Sum relationship changes from all selected topics
    // Only process topics that have positions set
    const topicsWithPositions = selectedTopics.filter(topicId => localGameState.topicPositions.get(topicId));
    
    console.log('=== CALCULATION START ===');
    console.log('selectedTopics:', selectedTopics);
    console.log('topicsWithPositions:', topicsWithPositions);
    console.log('localGameState.topicPositions:', Array.from(localGameState.topicPositions.entries()));
    console.log('powerMultiplier:', powerMultiplier);
    console.log('playerCandidate:', playerCandidate);
    
    if (topicsWithPositions.length === 0) {
      console.log('No topics with positions set, returning zero effects');
      return { demChange: 0, repChange: 0, indieChange: 0, turnoutChange: 0 };
    }
    
    topicsWithPositions.forEach(topicId => {
      const position = localGameState.topicPositions.get(topicId)!; // We know it exists from filter
      console.log(`\nProcessing topic: ${topicId}, position: ${position}, playerCandidate: ${playerCandidate}`);
      microgroups.forEach(microgroup => {
        const rating = TOPIC_RATINGS[microgroup][topicId];
        const change = calculateTopicRelationshipChange(microgroup, topicId, playerCandidate, position);
        const changeWithMultiplier = change * powerMultiplier;
        relationshipChanges[microgroup] += changeWithMultiplier;
        console.log(`  ${microgroup}: rating=${rating}, baseChange=${change.toFixed(3)}, withMultiplier=${changeWithMultiplier.toFixed(3)}, total=${relationshipChanges[microgroup].toFixed(3)}`);
      });
    });
    
    console.log('\nRelationship changes after processing all topics:', relationshipChanges);

    // Get microgroup percentages for this state
    const detailedDemographics = calculateDetailedDemographics(state);
    
    // Map detailed demographics to microgroup percentages
    const microgroupPercentages: Record<Microgroup, number> = {
      hardcore_dem: detailedDemographics.democrats.hardcore,
      lean_dem: detailedDemographics.democrats.likely,
      swingable_dem: detailedDemographics.democrats.swingable,
      hardcore_rep: detailedDemographics.republicans.hardcore,
      lean_rep: detailedDemographics.republicans.likely,
      swingable_rep: detailedDemographics.republicans.swingable,
      hardcore_dem_indie: detailedDemographics.independents.demHardcore,
      lean_dem_indie: detailedDemographics.independents.demLikely,
      swingable_indie: detailedDemographics.independents.swingable,
      lean_rep_indie: detailedDemographics.independents.repLikely,
      hardcore_rep_indie: detailedDemographics.independents.repHardcore,
    };
    
    // Calculate weighted relationship changes for each group
    // Weight by the percentage of each microgroup in the state
    const demWeightedSum = demGroups.reduce((sum, mg) => {
      const weight = microgroupPercentages[mg];
      const change = relationshipChanges[mg];
      console.log(`  Dem microgroup ${mg}: weight=${weight.toFixed(2)}%, change=${change.toFixed(3)}, contribution=${(change * weight).toFixed(3)}`);
      return sum + (change * weight);
    }, 0);
    const demTotalWeight = demGroups.reduce((sum, mg) => sum + microgroupPercentages[mg], 0);
    const avgDemRelationshipChange = demTotalWeight > 0 ? demWeightedSum / demTotalWeight : 0;
    
    const repWeightedSum = repGroups.reduce((sum, mg) => {
      const weight = microgroupPercentages[mg];
      return sum + (relationshipChanges[mg] * weight);
    }, 0);
    const repTotalWeight = repGroups.reduce((sum, mg) => sum + microgroupPercentages[mg], 0);
    const avgRepRelationshipChange = repTotalWeight > 0 ? repWeightedSum / repTotalWeight : 0;
    
    const indieWeightedSum = indieGroups.reduce((sum, mg) => {
      const weight = microgroupPercentages[mg];
      const change = relationshipChanges[mg];
      console.log(`  Indie microgroup ${mg}: weight=${weight.toFixed(2)}%, change=${change.toFixed(3)}, contribution=${(change * weight).toFixed(3)}`);
      return sum + (change * weight);
    }, 0);
    const indieTotalWeight = indieGroups.reduce((sum, mg) => sum + microgroupPercentages[mg], 0);
    const avgIndieRelationshipChange = indieTotalWeight > 0 ? indieWeightedSum / indieTotalWeight : 0;
    
    console.log('Indie calculation details:', {
      indieWeightedSum,
      indieTotalWeight,
      avgIndieRelationshipChange,
      relationshipChanges: {
        hardcore_dem_indie: relationshipChanges.hardcore_dem_indie,
        lean_dem_indie: relationshipChanges.lean_dem_indie,
        swingable_indie: relationshipChanges.swingable_indie,
        lean_rep_indie: relationshipChanges.lean_rep_indie,
        hardcore_rep_indie: relationshipChanges.hardcore_rep_indie,
      },
      microgroupPercentages: {
        hardcore_dem_indie: microgroupPercentages.hardcore_dem_indie,
        lean_dem_indie: microgroupPercentages.lean_dem_indie,
        swingable_indie: microgroupPercentages.swingable_indie,
        lean_rep_indie: microgroupPercentages.lean_rep_indie,
        hardcore_rep_indie: microgroupPercentages.hardcore_rep_indie,
      }
    });
    
    const overallWeightedSum = microgroups.reduce((sum, mg) => {
      const weight = microgroupPercentages[mg];
      return sum + (relationshipChanges[mg] * weight);
    }, 0);
    const overallTotalWeight = microgroups.reduce((sum, mg) => sum + microgroupPercentages[mg], 0);
    const avgOverallRelationshipChange = overallTotalWeight > 0 ? overallWeightedSum / overallTotalWeight : 0;
    
    console.log('Weighted Averages:', {
      microgroupPercentages,
      demWeightedSum,
      demTotalWeight,
      repWeightedSum,
      repTotalWeight,
      indieWeightedSum,
      indieTotalWeight,
      overallWeightedSum,
      overallTotalWeight,
      avgDemRelationshipChange,
      avgRepRelationshipChange,
      avgIndieRelationshipChange,
      avgOverallRelationshipChange
    });

    // Convert relationship change to polling change
    // Based on GameEngine: (avgRelationship - 5) * 0.5 converts relationship (1-10) to polling change
    // Since we're calculating CHANGES (deltas), we multiply the change directly by 0.5
    // Relationship change of 1 point = 0.5% polling change
    // 
    // The baseChange now represents how the microgroup feels about the POSITION (not the candidate)
    // For Dem groups: positive relationship change → they like the position → if Democrat takes position, Dem support increases
    // For Rep groups: positive relationship change → they like the position → if Republican takes position, Rep support increases
    //                 if Democrat takes position, Rep support decreases (Reps move to Dem)
    // So we need to adjust based on which candidate is taking the position
    const demSupportChange = avgDemRelationshipChange * 0.5;
    // For Rep groups: if playerCandidate is Republican, positive relationship change = Rep support increases
    //                if playerCandidate is Democrat, positive relationship change = Rep support decreases
    const repSupportChange = playerCandidate === 'republican' 
      ? avgRepRelationshipChange * 0.5  // Reps like Rep's position → Rep support increases
      : -avgRepRelationshipChange * 0.5; // Reps like Dem's position → Rep support decreases
    const indieSupportChange = avgIndieRelationshipChange * 0.5;
    
    console.log('Support change calculation:', {
      avgDemRelationshipChange,
      avgRepRelationshipChange,
      avgIndieRelationshipChange,
      demSupportChange,
      repSupportChange,
      indieSupportChange,
      relationshipChanges: {
        hardcore_dem: relationshipChanges.hardcore_dem,
        lean_dem: relationshipChanges.lean_dem,
        swingable_dem: relationshipChanges.swingable_dem,
      }
    });

    // Convert relationship change to turnout change
    // Based on GameEngine: turnout is affected by overall enthusiasm
    // Relationship change of 1 point = 2% turnout change
    // However, for policies that benefit the poor (like welfare), turnout should increase
    // even if Republicans don't like it, because poor people (who are more likely to be Dems/Indies) will turn out
    // So we weight turnout by the enthusiasm of groups that support the policy
    // For welfare and similar policies, we should weight more heavily by Dem/Indie enthusiasm
    
    // Check if this is a policy that benefits the poor (welfare, unemployment, healthcare, etc.)
    const poorBenefitTopics: TopicId[] = ['welfare', 'unemployment', 'healthcare', 'urban_policy'];
    const isPoorBenefitTopic = selectedTopics.some(topicId => poorBenefitTopics.includes(topicId));
    
    let turnoutChange: number;
    if (isPoorBenefitTopic) {
      // For policies that benefit the poor, weight turnout by Dem/Indie enthusiasm
      // Poor people (more likely Dems/Indies) will turn out even if Reps don't like it
      const demIndieWeightedSum = [...demGroups, ...indieGroups].reduce((sum, mg) => {
        const weight = microgroupPercentages[mg];
        return sum + (relationshipChanges[mg] * weight);
      }, 0);
      const demIndieTotalWeight = [...demGroups, ...indieGroups].reduce((sum, mg) => sum + microgroupPercentages[mg], 0);
      const avgDemIndieRelationshipChange = demIndieTotalWeight > 0 ? demIndieWeightedSum / demIndieTotalWeight : 0;
      
      // Use Dem/Indie enthusiasm for turnout (they're the ones who benefit)
      turnoutChange = avgDemIndieRelationshipChange * 2;
    } else {
      // For other policies, use overall enthusiasm
      turnoutChange = avgOverallRelationshipChange * 2;
    }
    
    // Debug: Test calculation with a known example
    // If a Democrat campaigns on "watergate" (rating 10 for hardcore_dem):
    // baseChange = (10 - 5) * 0.4 = 2.0
    // For Democrat candidate, return 2.0
    // After averaging 5 dem groups, if all get +2.0, avg = 2.0
    // demSupportChange = 2.0 * 0.5 = 1.0%
    console.log('Test calculation:', {
      exampleTopic: 'watergate',
      hardcore_dem_rating: TOPIC_RATINGS.hardcore_dem.watergate,
      expectedBaseChange: (TOPIC_RATINGS.hardcore_dem.watergate - 5) * 0.4,
      playerCandidate,
      actualCalculatedChange: calculateTopicRelationshipChange('hardcore_dem', 'watergate', playerCandidate, 'for')
    });

    // Debug logging
    console.log('Estimated Effects Calculation:', {
      selectedTopics,
      positions: selectedTopics.map(t => localGameState.topicPositions.get(t)),
      relationshipChanges,
      avgDemRelationshipChange,
      avgRepRelationshipChange,
      avgIndieRelationshipChange,
      avgOverallRelationshipChange,
      demSupportChange,
      repSupportChange,
      indieSupportChange,
      turnoutChange,
      powerMultiplier,
      actionType,
      campaignSize,
      playerCandidate
    });

    return {
      demChange: demSupportChange,
      repChange: repSupportChange,
      indieChange: indieSupportChange,
      turnoutChange: turnoutChange,
    };
  }, [selectedTopics, localGameState, actionType, stateAbbreviation, playerCandidate, gameEngine]);

  // Calculate costs
  const calculateRallyCost = (): number => {
    const state = gameEngine.getStateData(stateAbbreviation);
    if (!state) return 25000;
    
    const polling = gameState.polling.get(stateAbbreviation);
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

  const calculateAdCost = (campaignSize: 'small' | 'medium' | 'large'): number => {
    const state = gameEngine.getStateData(stateAbbreviation);
    if (!state) return 25000;
    
    const polling = gameState.polling.get(stateAbbreviation);
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

  const rallyCost = actionType === 'rally' ? calculateRallyCost() : 0;
  const smallAdCost = actionType === 'launch_ads' ? calculateAdCost('small') : 0;
  const mediumAdCost = actionType === 'launch_ads' ? calculateAdCost('medium') : 0;
  const largeAdCost = actionType === 'launch_ads' ? calculateAdCost('large') : 0;

  // Calculate effects for display
  // For ads: calculate range from small to large
  // For rallies: calculate single value
  const [previewCampaignSize, setPreviewCampaignSize] = useState<'small' | 'medium' | 'large'>(actionType === 'launch_ads' ? 'medium' : 'medium');
  
  // Calculate effects - recalculate whenever selectedTopics, positions, or other dependencies change
  const estimatedEffects = useMemo(() => {
    const result = calculateEstimatedEffects(previewCampaignSize);
    console.log('Calculated estimatedEffects:', result, 'for campaignSize:', previewCampaignSize, 'selectedTopics:', selectedTopics, 'localGameState.topicPositions:', Array.from(localGameState.topicPositions.entries()));
    return result;
  }, [calculateEstimatedEffects, previewCampaignSize, selectedTopics, localGameState]);
  
  // For ads, calculate range (small to large)
  const estimatedEffectsSmall = useMemo(() => {
    if (actionType === 'launch_ads') {
      const result = calculateEstimatedEffects('small');
      console.log('Calculated estimatedEffectsSmall:', result, 'selectedTopics:', selectedTopics);
      return result;
    }
    return null;
  }, [calculateEstimatedEffects, actionType, selectedTopics, localGameState]);
  
  const estimatedEffectsLarge = useMemo(() => {
    if (actionType === 'launch_ads') {
      const result = calculateEstimatedEffects('large');
      console.log('Calculated estimatedEffectsLarge:', result, 'selectedTopics:', selectedTopics);
      return result;
    }
    return null;
  }, [calculateEstimatedEffects, actionType, selectedTopics, localGameState]);

  return (
    <div className="topic-selector-overlay">
      {showTip && pendingPosition && (
        <div className="tip-popup-overlay">
          <div className="tip-popup">
            <h4>⚠️ Important: Topic Positions</h4>
            <p>
              When you select a position (FOR or AGAINST) on a topic, that position is <strong>locked globally</strong> for all states.
              You cannot change your position on an issue once you've chosen it, so choose carefully!
            </p>
            <p style={{ marginTop: '1rem' }}>
              Choose your position using the FOR/AGAINST buttons that appear below each selected topic.
            </p>
            <div className="tip-checkbox" style={{ marginTop: '1rem' }}>
              <input
                type="checkbox"
                id="dontShowAgain"
                checked={dontShowAgain}
                onChange={(e) => setDontShowAgain(e.target.checked)}
              />
              <label htmlFor="dontShowAgain">Don't show this tip again</label>
            </div>
            <button className="tip-dismiss-btn" onClick={handleTipDismiss}>
              Got it!
            </button>
          </div>
        </div>
      )}
      <div className="topic-selector-modal">
        <h3>Select {maxSelections} Topic{maxSelections > 1 ? 's' : ''}</h3>
        <div className="topic-grid">
          {TOPICS
            .filter(topic => {
              // Only show topics that have been locked via weekly interviews
              return localGameState.topicPositions.has(topic.id);
            })
            .map(topic => {
            const isSelected = selectedTopics.includes(topic.id);
            const position = localGameState.topicPositions.get(topic.id);
            const isPositionLocked = position !== undefined;
            
            // Check if this topic is already used for ads in this state (only for ads action)
            const isAlreadyUsed = actionType === 'launch_ads' ? (() => {
              const activities = localGameState.campaignActivities.get(stateAbbreviation) || [];
              return activities.some(a => a.type === 'ads' && a.adTopic === topic.id);
            })() : false;
            
            return (
              <div key={topic.id} className="topic-item-wrapper">
                <button
                  className={`topic-button ${isSelected ? 'selected' : ''} ${isPositionLocked ? 'position-locked' : ''} ${isAlreadyUsed ? 'already-used' : ''}`}
                  onClick={() => {
                    if (isAlreadyUsed) {
                      // Don't allow selection if already used
                      return;
                    }
                    handleTopicClick(topic.id);
                  }}
                  disabled={(!isSelected && selectedTopics.length >= maxSelections) || isAlreadyUsed}
                  data-tooltip={isAlreadyUsed ? "Already used for ads in this state" : undefined}
                  data-tooltip-red={isAlreadyUsed ? "true" : undefined}
                >
                  {topic.name}
                  {isSelected && <span className="checkmark">✓</span>}
                  {isPositionLocked && (
                    <span className="position-badge">{position === 'for' ? 'FOR' : 'AGAINST'}</span>
                  )}
                  {isAlreadyUsed && <span className="already-used-badge">USED</span>}
                </button>
                {isSelected && !isPositionLocked && (
                  <div className="position-buttons">
                    <button
                      className="position-btn position-for"
                      onClick={(e) => {
                        e.stopPropagation();
                        handlePositionSelect(topic.id, 'for');
                      }}
                    >
                      FOR
                    </button>
                    <button
                      className="position-btn position-against"
                      onClick={(e) => {
                        e.stopPropagation();
                        handlePositionSelect(topic.id, 'against');
                      }}
                    >
                      AGAINST
                    </button>
                  </div>
                )}
              </div>
            );
          })}
        </div>
        
        {/* Estimated Effects Bar */}
        {selectedTopics.length > 0 && selectedTopics.every(topicId => localGameState.topicPositions.get(topicId)) && (() => {
          const state = gameEngine.getStateData(stateAbbreviation);
          if (!state) return null;
          
          const detailedDemographics = calculateDetailedDemographics(state);
          // Calculate total percentages for each group
          const demPercent = detailedDemographics.democrats.hardcore + 
                           detailedDemographics.democrats.likely + 
                           detailedDemographics.democrats.swingable +
                           detailedDemographics.independents.demHardcore +
                           detailedDemographics.independents.demLikely;
          const repPercent = detailedDemographics.republicans.hardcore + 
                          detailedDemographics.republicans.likely + 
                          detailedDemographics.republicans.swingable +
                          detailedDemographics.independents.repHardcore +
                          detailedDemographics.independents.repLikely;
          const indiePercent = detailedDemographics.independents.demHardcore +
                               detailedDemographics.independents.demLikely +
                               detailedDemographics.independents.swingable +
                               detailedDemographics.independents.repLikely +
                               detailedDemographics.independents.repHardcore;
          
          return (
            <div className="estimated-effects-bar">
              <div className="effects-header">
                Estimated Effects in {state?.name || stateAbbreviation}
              </div>
              <div className="effects-grid">
                {actionType === 'launch_ads' && estimatedEffectsSmall && estimatedEffectsLarge ? (
                  <>
                    <div className="effect-item">
                      <span className="effect-label">Turnout:</span>
                      <span className={`effect-value ${estimatedEffectsSmall.turnoutChange >= 0 ? 'positive' : 'negative'}`}>
                        {estimatedEffectsSmall.turnoutChange >= 0 ? '+' : ''}{estimatedEffectsSmall.turnoutChange.toFixed(2)}% - {estimatedEffectsLarge.turnoutChange >= 0 ? '+' : ''}{estimatedEffectsLarge.turnoutChange.toFixed(2)}%
                      </span>
                    </div>
                    <div className="effect-item">
                      <span className="effect-label">Dem ({demPercent.toFixed(1)}%) Support:</span>
                      <span className={`effect-value ${estimatedEffectsSmall.demChange >= 0 ? 'positive' : 'negative'}`}>
                        {estimatedEffectsSmall.demChange >= 0 ? '+' : ''}{estimatedEffectsSmall.demChange.toFixed(2)}% - {estimatedEffectsLarge.demChange >= 0 ? '+' : ''}{estimatedEffectsLarge.demChange.toFixed(2)}%
                      </span>
                    </div>
                    <div className="effect-item">
                      <span className="effect-label">Rep ({repPercent.toFixed(1)}%) Support:</span>
                      <span className={`effect-value ${estimatedEffectsSmall.repChange >= 0 ? 'positive' : 'negative'}`}>
                        {estimatedEffectsSmall.repChange >= 0 ? '+' : ''}{estimatedEffectsSmall.repChange.toFixed(2)}% - {estimatedEffectsLarge.repChange >= 0 ? '+' : ''}{estimatedEffectsLarge.repChange.toFixed(2)}%
                      </span>
                    </div>
                    <div className="effect-item">
                      <span className="effect-label">Indie ({indiePercent.toFixed(1)}%) Support:</span>
                      <span className={`effect-value ${estimatedEffectsSmall.indieChange >= 0 ? 'positive' : 'negative'}`}>
                        {estimatedEffectsSmall.indieChange >= 0 ? '+' : ''}{estimatedEffectsSmall.indieChange.toFixed(2)}% - {estimatedEffectsLarge.indieChange >= 0 ? '+' : ''}{estimatedEffectsLarge.indieChange.toFixed(2)}%
                      </span>
                    </div>
                  </>
                ) : (
                  <>
                    <div className="effect-item">
                      <span className="effect-label">Turnout:</span>
                      <span className={`effect-value ${estimatedEffects.turnoutChange >= 0 ? 'positive' : 'negative'}`}>
                        {estimatedEffects.turnoutChange >= 0 ? '+' : ''}{estimatedEffects.turnoutChange.toFixed(2)}%
                      </span>
                    </div>
                    <div className="effect-item">
                      <span className="effect-label">Dem ({demPercent.toFixed(1)}%) Support:</span>
                      <span className={`effect-value ${estimatedEffects.demChange >= 0 ? 'positive' : 'negative'}`}>
                        {estimatedEffects.demChange >= 0 ? '+' : ''}{estimatedEffects.demChange.toFixed(2)}%
                      </span>
                    </div>
                    <div className="effect-item">
                      <span className="effect-label">Rep ({repPercent.toFixed(1)}%) Support:</span>
                      <span className={`effect-value ${estimatedEffects.repChange >= 0 ? 'positive' : 'negative'}`}>
                        {estimatedEffects.repChange >= 0 ? '+' : ''}{estimatedEffects.repChange.toFixed(2)}%
                      </span>
                    </div>
                    <div className="effect-item">
                      <span className="effect-label">Indie ({indiePercent.toFixed(1)}%) Support:</span>
                      <span className={`effect-value ${estimatedEffects.indieChange >= 0 ? 'positive' : 'negative'}`}>
                        {estimatedEffects.indieChange >= 0 ? '+' : ''}{estimatedEffects.indieChange.toFixed(2)}%
                      </span>
                    </div>
                  </>
                )}
              </div>
            </div>
          );
        })()}

        <div className="topic-selector-actions">
          <button className="cancel-btn" onClick={() => {
            playClickSound(); // Play random click sound
            onCancel();
          }}>Cancel</button>
          {actionType === 'launch_ads' ? (
            <>
              <button 
                className="confirm-btn campaign-size-btn" 
                onClick={() => {
                  playClickSound(); // Play random click sound
                  onConfirm('small');
                }}
                onMouseEnter={() => setPreviewCampaignSize('small')}
                disabled={!canConfirm}
              >
                Small Campaign<br />${(smallAdCost / 1000).toFixed(0)}K
              </button>
              <button 
                className="confirm-btn campaign-size-btn" 
                onClick={() => {
                  playClickSound(); // Play random click sound
                  onConfirm('medium');
                }}
                onMouseEnter={() => setPreviewCampaignSize('medium')}
                disabled={!canConfirm}
              >
                Medium Campaign<br />${(mediumAdCost / 1000).toFixed(0)}K
              </button>
              <button 
                className="confirm-btn campaign-size-btn" 
                onClick={() => {
                  playClickSound(); // Play random click sound
                  onConfirm('large');
                }}
                onMouseEnter={() => setPreviewCampaignSize('large')}
                disabled={!canConfirm}
              >
                Large Campaign<br />${(largeAdCost / 1000).toFixed(0)}K
              </button>
            </>
          ) : (
            <button 
              className="confirm-btn" 
              onClick={() => {
                playClickSound(); // Play random click sound
                onConfirm('medium');
              }}
              disabled={!canConfirm}
            >
              Confirm<br />${(rallyCost / 1000).toFixed(0)}K
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

