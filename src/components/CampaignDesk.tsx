import { buildElectoralForecast } from '../game/simulation/forecast';
import { buildRoadTo270 } from '../game/strategy/roadTo270';
import { GameState, StateData } from '../types/game';
import './CampaignDesk.css';

interface CampaignDeskProps {
  gameState: GameState;
  states: StateData[];
  onOpenForecast: () => void;
}

export default function CampaignDesk({ gameState, states, onOpenForecast }: CampaignDeskProps) {
  const forecast = buildElectoralForecast(states, gameState.polling);
  const playerParty = gameState.playerCandidate;
  const strategy = buildRoadTo270({ states, pollingByState: gameState.polling, candidate: playerParty });
  const expected = Math.round(forecast.expectedElectoralVotes[playerParty]);
  const likely = forecast.likelyElectoralVotes[playerParty];
  const gap = Math.max(0, 270 - likely);
  const tossups = forecast.stateForecasts
    .filter(state => state.band === 'toss_up' || state.band.startsWith('lean_'))
    .sort((a, b) => {
      const aProbability = playerParty === 'democrat' ? a.democraticWinProbability : a.republicanWinProbability;
      const bProbability = playerParty === 'democrat' ? b.democraticWinProbability : b.republicanWinProbability;
      return Math.abs(aProbability - 0.5) - Math.abs(bProbability - 0.5) || b.electoralVotes - a.electoralVotes;
    })
    .slice(0, 3);

  return (
    <section className="campaign-desk" aria-labelledby="campaign-desk-title">
      <div className="campaign-desk-heading">
        <div>
          <span className="campaign-desk-kicker">Campaign desk</span>
          <h3 id="campaign-desk-title">Road to 270</h3>
        </div>
        <span className={`campaign-desk-status ${gap === 0 ? 'on-track' : ''}`}>
          {gap === 0 ? 'On track' : `${gap} EV short`}
        </span>
      </div>

      <div className="campaign-desk-score" aria-label={`${likely} likely electoral votes, ${expected} expected`}>
        <div><strong>{likely}</strong><span>Likely EV</span></div>
        <div><strong>{expected}</strong><span>Expected EV</span></div>
        <div><strong>{270}</strong><span>To win</span></div>
      </div>

      <div className="campaign-desk-meter" aria-hidden="true">
        <span style={{ width: `${Math.min(100, (expected / 270) * 100)}%` }} />
        <i style={{ left: `${(270 / 538) * 100}%` }} />
      </div>

      <div className="campaign-desk-targets">
        <span className="campaign-desk-label">Battleground watch</span>
        {tossups.length > 0 ? tossups.map(state => {
          const probability = playerParty === 'democrat' ? state.democraticWinProbability : state.republicanWinProbability;
          return (
            <div className="campaign-desk-target" key={state.state}>
              <strong>{state.state}</strong>
              <span>{state.electoralVotes} EV</span>
              <span>{Math.round(probability * 100)}% win chance</span>
            </div>
          );
        }) : <p className="campaign-desk-empty">No competitive states in the current forecast.</p>}
      </div>

      <div className="campaign-desk-route">
        <span className="campaign-desk-label">Best current route</span>
        <strong>{strategy.pathsTo270[0]?.label ?? 'No viable route on the current board'}</strong>
        {strategy.mustHolds.length > 0 && (
          <span>Must hold: {strategy.mustHolds.slice(0, 4).map(state => state.abbreviation).join(', ')}</span>
        )}
      </div>

      <button className="campaign-desk-button" onClick={onOpenForecast}>
        Open full forecast
      </button>
    </section>
  );
}
