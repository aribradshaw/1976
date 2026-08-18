import { useState } from 'react';
import { CampaignEventChoice, CampaignEventDefinition } from '../data/events1976';
import './HistoricalEventModal.css';

interface HistoricalEventModalProps {
  event: CampaignEventDefinition;
  funds: number;
  onChoose: (choiceId: string) => boolean;
}

export default function HistoricalEventModal({ event, funds, onChoose }: HistoricalEventModalProps) {
  const [selected, setSelected] = useState<string | null>(null);
  const selectedChoice = event.choices.find(choice => choice.id === selected);

  return (
    <div className="historical-event-overlay" role="dialog" aria-modal="true" aria-labelledby="historical-event-title">
      <article className="historical-event-card">
        <header>
          <span>{event.category.replace('_', ' ')} · {event.date}</span>
          {event.debate && <strong>{event.debate.replace('_', ' ')} set piece</strong>}
          <h2 id="historical-event-title">{event.title}</h2>
          <p>{event.historicalContext}</p>
        </header>

        <div className="historical-event-choices">
          {event.choices.map(choice => {
            const depletesTreasury = funds + choice.effects.funds < 0;
            return (
              <button
                key={choice.id}
                className={selected === choice.id ? 'selected' : ''}
                aria-pressed={selected === choice.id}
                onClick={() => setSelected(choice.id)}
              >
                <strong>{choice.label}</strong>
                <span>{choice.summary}</span>
                <em>{choice.tradeoff}</em>
                <small>{formatEffects(choice)}</small>
                {depletesTreasury && <b>Treasury falls to $0 and credibility takes a hit</b>}
              </button>
            );
          })}
        </div>

        <footer>
          <a href={event.sourceUrls[0]} target="_blank" rel="noreferrer">Read the historical source</a>
          <button
            disabled={!selectedChoice}
            onClick={() => selectedChoice && onChoose(selectedChoice.id)}
          >
            Commit to this decision
          </button>
        </footer>
      </article>
    </div>
  );
}

function formatEffects(choice: CampaignEventChoice): string {
  const parts = [
    choice.effects.funds !== 0 ? `${choice.effects.funds > 0 ? '+' : ''}$${Math.round(choice.effects.funds / 1000)}K` : null,
    choice.effects.energy !== 0 ? `${signed(choice.effects.energy)} energy` : null,
    choice.effects.credibility !== 0 ? `${signed(choice.effects.credibility)} credibility` : null,
    choice.effects.nationalMomentum !== 0 ? `${signed(choice.effects.nationalMomentum)} momentum` : null,
  ];
  return parts.filter(Boolean).join(' · ');
}

function signed(value: number): string {
  return `${value > 0 ? '+' : ''}${value}`;
}
