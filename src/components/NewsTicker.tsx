import { useCallback, useEffect, useState } from 'react';
import { getRandomHeadlinesForWeek } from '../data/newsHeadlines';
import type { GameEngine } from '../game/GameEngine';
import { GameState, CampaignEvent } from '../types/game';
import { TOPICS } from '../data/topics';
import './NewsTicker.css';

interface NewsTickerProps {
  currentWeek: number;
  gameEngine?: GameEngine;
  gameState?: GameState;
}

export default function NewsTicker({ currentWeek, gameEngine, gameState }: NewsTickerProps) {
  const [headlines, setHeadlines] = useState<string[]>([]);
  const [lastProcessedWeek, setLastProcessedWeek] = useState<number>(0);

  /**
   * Format opponent's weekly interview into a news ticker headline with impact
   */
  function formatOpponentInterview(event: CampaignEvent, playerCandidate: 'democrat' | 'republican'): string {
    const opponentName = playerCandidate === 'democrat' ? 'Ford' : 'Carter';
    const topic = TOPICS.find(t => t.id === event.adTopic);
    const topicName = topic ? topic.name : event.adTopic || 'Unknown Topic';
    const position = event.campaignSize === 'small' ? 'FOR' : 'AGAINST'; // Reused field
    
    // Parse impact from rallyTopics array [dem, rep, indie]
    const impacts = event.rallyTopics || [];
    const demImpact = impacts[0] ? parseFloat(impacts[0]) : 0;
    const repImpact = impacts[1] ? parseFloat(impacts[1]) : 0;
    const indieImpact = impacts[2] ? parseFloat(impacts[2]) : 0;
    
    // Format impact descriptions
    const formatImpact = (impact: number, group: string) => {
      if (impact > 0.5) {
        return `<span style="color: #4ade80">+${impact.toFixed(1)}</span> ${group}`;
      } else if (impact < -0.5) {
        return `<span style="color: #f87171">${impact.toFixed(1)}</span> ${group}`;
      } else {
        return `<span style="color: #94a3b8">${impact.toFixed(1)}</span> ${group}`;
      }
    };
    
    return `${opponentName} Interview: ${position} ${topicName} • ${formatImpact(demImpact, 'Dems')} • ${formatImpact(repImpact, 'Reps')} • ${formatImpact(indieImpact, 'Indies')}`;
  }
  
  /**
   * Format opponent actions into a news ticker headline
   */
  const formatOpponentActions = useCallback((events: CampaignEvent[], playerCandidate: 'democrat' | 'republican'): string => {
    // Limit to 6 actions (or all if less than 6)
    const actionsToShow = events.slice(0, 6);
    
    // Get opponent name
    const opponentName = playerCandidate === 'democrat' ? 'Ford' : 'Carter';
    
    const actionDescriptions = actionsToShow.map(event => {
      // Get state name from game engine if available
      let stateName = event.state;
      if (gameEngine) {
        const stateData = gameEngine.getStateData(event.state);
        if (stateData) {
          stateName = stateData.name;
        }
      }
      
      switch (event.type) {
        case 'campaign_hq':
          if (event.hqLevel === 1) {
            return `HQ in ${stateName}`;
          } else {
            return `HQ L${event.hqLevel} in ${stateName}`;
          }
        case 'launch_ads': {
          const topic = TOPICS.find(t => t.id === event.adTopic);
          const topicName = topic ? topic.name : event.adTopic;
          const size = event.campaignSize ? ` (${event.campaignSize})` : '';
          return `Ads: ${topicName}${size} in ${stateName}`;
        }
        case 'rally': {
          const topics = event.rallyTopics?.map(topicId => {
            const t = TOPICS.find(t => t.id === topicId);
            return t ? t.name : topicId;
          }).join(', ') || '';
          return `Rally: ${topics} in ${stateName}`;
        }
        case 'large_donor_fundraiser':
          return `Fundraiser in ${stateName}`;
        default:
          return event.description;
      }
    });
    
    // Join with commas, but keep it concise
    const actionsList = actionDescriptions.join(', ');
    return `${opponentName}: ${actionsList}`;
  }, [gameEngine]);

  useEffect(() => {
    if (currentWeek === lastProcessedWeek) {
      return;
    }

    const weekHeadlines = getRandomHeadlinesForWeek(currentWeek, 5);
    if (gameEngine && gameState && currentWeek > 1) {
      const lastWeek = currentWeek - 1;
      const opponentInterview = gameEngine.getOpponentInterviewForWeek(lastWeek);
      if (opponentInterview) {
        weekHeadlines.push(formatOpponentInterview(opponentInterview, gameState.playerCandidate));
      }

      const opponentEvents = gameEngine.getOpponentEventsForWeek(lastWeek);
      if (opponentEvents.length > 0) {
        weekHeadlines.push(formatOpponentActions(opponentEvents, gameState.playerCandidate));
      }
    }

    setHeadlines(weekHeadlines);
    setLastProcessedWeek(currentWeek);
  }, [currentWeek, formatOpponentActions, gameEngine, gameState, lastProcessedWeek]);

  if (headlines.length === 0) {
    return null;
  }

  // Duplicate headlines for seamless loop
  const scrollingHeadlines = [...headlines, ...headlines];

  return (
    <div className="news-ticker">
      <div className="news-ticker-label">📰 NEWS</div>
      <div className="news-ticker-content">
        <div className="news-ticker-scroll">
          {scrollingHeadlines.map((headline, index) => (
            <span key={index} className="news-ticker-item">
              <span dangerouslySetInnerHTML={{ __html: headline }} />
              <span className="news-ticker-separator"> • </span>
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}

