import './WeeklyRecapModal.css';

export interface WeekRecap {
  week: number;
  actionsResolved: number;
  fundsChange: number;
  expectedEvBefore: number;
  expectedEvAfter: number;
  movers: Array<{ state: string; probabilityChange: number; electoralVotes: number }>;
}

interface WeeklyRecapModalProps {
  recap: WeekRecap;
  onContinue: () => void;
}

export default function WeeklyRecapModal({ recap, onContinue }: WeeklyRecapModalProps) {
  const evChange = Math.round(recap.expectedEvAfter - recap.expectedEvBefore);
  const money = new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 });

  return (
    <div className="weekly-recap-overlay" role="dialog" aria-modal="true" aria-labelledby="weekly-recap-title">
      <div className="weekly-recap-card" aria-live="polite">
        <span className="weekly-recap-edition">Campaign Nightly · Week {recap.week}</span>
        <h2 id="weekly-recap-title">The week is in the books</h2>
        <p className="weekly-recap-dek">
          {evChange > 0 ? 'Your route to 270 improved.' : evChange < 0 ? 'The opposition tightened the race.' : 'The electoral map held steady.'}
        </p>

        <div className="weekly-recap-scoreboard">
          <div><span>Expected EV</span><strong>{Math.round(recap.expectedEvAfter)}</strong><em className={evChange >= 0 ? 'positive' : 'negative'}>{evChange >= 0 ? '+' : ''}{evChange}</em></div>
          <div><span>Plan resolved</span><strong>{recap.actionsResolved}</strong><em>actions</em></div>
          <div><span>Cash flow</span><strong>{money.format(recap.fundsChange)}</strong><em>net</em></div>
        </div>

        <section className="weekly-recap-movers">
          <h3>States that moved most</h3>
          {recap.movers.map(mover => (
            <div key={mover.state}>
              <strong>{mover.state}</strong>
              <span>{mover.electoralVotes} EV</span>
              <span className={mover.probabilityChange >= 0 ? 'positive' : 'negative'}>
                {mover.probabilityChange >= 0 ? '+' : ''}{Math.round(mover.probabilityChange * 100)} pts
              </span>
            </div>
          ))}
        </section>

        <button onClick={onContinue}>Open next week's briefing</button>
      </div>
    </div>
  );
}
