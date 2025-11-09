import { useEffect, useState } from 'react';
import { getRandomHeadlinesForWeek } from '../data/newsHeadlines';
import './NewsTicker.css';

interface NewsTickerProps {
  currentWeek: number;
}

export default function NewsTicker({ currentWeek }: NewsTickerProps) {
  const [headlines, setHeadlines] = useState<string[]>([]);

  useEffect(() => {
    // Get headlines for current week
    const weekHeadlines = getRandomHeadlinesForWeek(currentWeek, 5);
    setHeadlines(weekHeadlines);
  }, [currentWeek]);

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

