import { useEffect, useState } from 'react';
import { getRandomHeadlinesForWeek } from '../data/newsHeadlines';
import { GameEngine } from '../game/GameEngine';
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

  useEffect(() => {
    // Only update headlines when the week changes, not when gameState changes
    if (currentWeek === lastProcessedWeek) {
      return; // Already processed this week
    }
    
    // Get headlines for current week
    const weekHeadlines = getRandomHeadlinesForWeek(currentWeek, 5);
    
    // Add opponent actions from last week if available
    if (gameEngine && gameState && currentWeek > 1) {
      const lastWeek = currentWeek - 1;
      const opponentEvents = gameEngine.getOpponentEventsForWeek(lastWeek);
      
      if (opponentEvents.length > 0) {
        // Format opponent actions into a headline
        const opponentHeadline = formatOpponentActions(opponentEvents, gameState.playerCandidate);
        weekHeadlines.push(opponentHeadline);
      }
    }
    
    setHeadlines(weekHeadlines);
    setLastProcessedWeek(currentWeek);
  }, [currentWeek, gameEngine, gameState, lastProcessedWeek]);
  
  /**
   * Format opponent actions into a news ticker headline
   */
  function formatOpponentActions(events: CampaignEvent[], playerCandidate: 'democrat' | 'republican'): string {
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
        case 'launch_ads':
          const topic = TOPICS.find(t => t.id === event.adTopic);
          const topicName = topic ? topic.name : event.adTopic;
          const size = event.campaignSize ? ` (${event.campaignSize})` : '';
          return `Ads: ${topicName}${size} in ${stateName}`;
        case 'rally':
          const topics = event.rallyTopics?.map(topicId => {
            const t = TOPICS.find(t => t.id === topicId);
            return t ? t.name : topicId;
          }).join(', ') || '';
          return `Rally: ${topics} in ${stateName}`;
        case 'large_donor_fundraiser':
          return `Fundraiser in ${stateName}`;
        default:
          return event.description;
      }
    });
    
    // Join with commas, but keep it concise
    const actionsList = actionDescriptions.join(', ');
    return `${opponentName}: ${actionsList}`;
  }

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

