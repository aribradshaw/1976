import { useEffect, useMemo, useRef, useState } from 'react';
import { Candidate, GameState, StateData } from '../types/game';
import './ElectionNight.css';

type Party = 'democrat' | 'republican';

interface ElectionNightProps {
  gameState: GameState;
  states: StateData[];
  playerCandidate: Candidate;
  onPlayAgain: () => void;
}

type FinalResultState = GameState & {
  /** Added by the final election resolver. Optional only during integration. */
  finalResults?: Map<string, Party>;
};

interface StateCall {
  state: StateData;
  winner: Party;
}

const CANDIDATE_NAME: Record<Party, string> = {
  democrat: 'Jimmy Carter',
  republican: 'Gerald Ford',
};

// A simple, deterministic east-to-west call order. It is a presentation order,
// not a simulation input and never changes the seeded result.
const CALL_ORDER: readonly string[] = [
  'VT', 'NH', 'ME', 'MA', 'RI', 'CT', 'NJ', 'DE', 'MD', 'DC', 'VA', 'WV',
  'PA', 'NY', 'SC', 'NC', 'GA', 'FL', 'OH', 'MI', 'IN', 'KY', 'TN', 'AL',
  'MS', 'IL', 'WI', 'MN', 'IA', 'MO', 'AR', 'LA', 'TX', 'OK', 'KS', 'NE',
  'SD', 'ND', 'CO', 'WY', 'MT', 'NM', 'AZ', 'UT', 'ID', 'NV', 'WA', 'OR',
  'CA', 'HI', 'AK',
];

function useReducedMotion(): boolean {
  const [reduced, setReduced] = useState(false);

  useEffect(() => {
    const media = window.matchMedia('(prefers-reduced-motion: reduce)');
    const update = () => setReduced(media.matches);
    update();
    media.addEventListener('change', update);
    return () => media.removeEventListener('change', update);
  }, []);

  return reduced;
}

function resolveFallbackResult(gameState: GameState, state: StateData): Party {
  const poll = gameState.polling.get(state.abbreviation);
  if (!poll) return state.historicalData.previousElectionResults.dem >= state.historicalData.previousElectionResults.rep
    ? 'democrat'
    : 'republican';
  return poll.democraticSupport >= poll.republicanSupport ? 'democrat' : 'republican';
}

export default function ElectionNight({ gameState, states, playerCandidate, onPlayAgain }: ElectionNightProps) {
  const reducedMotion = useReducedMotion();
  const playAgainRef = useRef<HTMLButtonElement>(null);
  const orderByAbbreviation = useMemo(
    () => new Map(CALL_ORDER.map((abbreviation, index) => [abbreviation, index])),
    [],
  );

  const stateCalls = useMemo<StateCall[]>(() => {
    const seededResults = (gameState as FinalResultState).finalResults;
    return [...states]
      .sort((left, right) => {
        const leftOrder = orderByAbbreviation.get(left.abbreviation) ?? Number.MAX_SAFE_INTEGER;
        const rightOrder = orderByAbbreviation.get(right.abbreviation) ?? Number.MAX_SAFE_INTEGER;
        return leftOrder - rightOrder || left.abbreviation.localeCompare(right.abbreviation);
      })
      .map(state => ({
        state,
        winner: seededResults?.get(state.abbreviation) ?? resolveFallbackResult(gameState, state),
      }));
  }, [gameState, orderByAbbreviation, states]);

  const [revealedCount, setRevealedCount] = useState(0);
  const [complete, setComplete] = useState(false);

  useEffect(() => {
    setRevealedCount(reducedMotion ? stateCalls.length : 0);
    setComplete(reducedMotion);

    if (reducedMotion) return undefined;

    const callsPerBatch = Math.max(2, Math.ceil(stateCalls.length / 10));
    const timers: number[] = [];
    for (let count = callsPerBatch; count < stateCalls.length; count += callsPerBatch) {
      timers.push(window.setTimeout(() => setRevealedCount(count), 500 + (count / callsPerBatch) * 460));
    }
    timers.push(window.setTimeout(() => {
      setRevealedCount(stateCalls.length);
      setComplete(true);
    }, 500 + Math.ceil(stateCalls.length / callsPerBatch) * 460));

    return () => timers.forEach(timer => window.clearTimeout(timer));
  }, [reducedMotion, stateCalls]);

  useEffect(() => {
    if (complete) playAgainRef.current?.focus();
  }, [complete]);

  const revealedCalls = stateCalls.slice(0, revealedCount);
  const latestCalls = revealedCalls.slice(-5).reverse();
  const score = revealedCalls.reduce<Record<Party, number>>((totals, call) => {
    totals[call.winner] += call.state.electoralVotes;
    return totals;
  }, { democrat: 0, republican: 0 });
  const finalWinner: Party = score.democrat >= score.republican ? 'democrat' : 'republican';
  const playerWon = finalWinner === playerCandidate;
  const calledElectoralVotes = score.democrat + score.republican;
  const progressLabel = complete
    ? `${CANDIDATE_NAME[finalWinner]} wins the election.`
    : `${revealedCalls.length} of ${stateCalls.length} state results called.`;

  return (
    <main className="election-night" aria-labelledby="election-night-title">
      <div className="election-night__masthead">
        <p className="election-night__eyebrow">National Election Desk · November 2, 1976</p>
        <h1 id="election-night-title">Election Night</h1>
        <p className="election-night__status" aria-live="polite">{progressLabel}</p>
      </div>

      <section className="election-night__scoreboard" aria-label="Electoral vote tally">
        <article className="election-night__party election-night__party--democrat">
          <span className="election-night__party-label">Carter</span>
          <strong>{score.democrat}</strong>
          <span>electoral votes</span>
        </article>
        <div className="election-night__threshold" aria-label="270 electoral votes are needed to win">
          <div className="election-night__threshold-line" aria-hidden="true"><span /></div>
          <b>270</b>
          <span>to win</span>
        </div>
        <article className="election-night__party election-night__party--republican">
          <span className="election-night__party-label">Ford</span>
          <strong>{score.republican}</strong>
          <span>electoral votes</span>
        </article>
      </section>

      <section className="election-night__progress" aria-label="Election calls progress">
        <div className="election-night__progress-label">
          <span>Results called</span>
          <span>{calledElectoralVotes} / 538 electoral votes</span>
        </div>
        <progress value={calledElectoralVotes} max={538}>{calledElectoralVotes} of 538 electoral votes called</progress>
      </section>

      <section className="election-night__callboard" aria-labelledby="latest-calls-title" aria-live="polite">
        <div className="election-night__callboard-heading">
          <h2 id="latest-calls-title">Latest calls</h2>
          {!complete && <span className="election-night__live-dot">Live</span>}
        </div>
        {latestCalls.length > 0 ? (
          <ol className="election-night__calls">
            {latestCalls.map(({ state, winner }) => (
              <li className={`election-night__call election-night__call--${winner}`} key={state.abbreviation}>
                <span className="election-night__state">{state.name}</span>
                <span>{CANDIDATE_NAME[winner]} · {state.electoralVotes} EV</span>
              </li>
            ))}
          </ol>
        ) : (
          <p className="election-night__waiting">Polls are closing. Stand by for the first calls.</p>
        )}
      </section>

      <section className={`election-night__outcome ${complete ? 'is-visible' : ''}`} aria-live="assertive" aria-atomic="true">
        {complete && (
          <>
            <p className="election-night__outcome-kicker">The race is called</p>
            <h2>{playerWon ? 'You carried the Electoral College.' : 'The opposing ticket carries the Electoral College.'}</h2>
            <p>{CANDIDATE_NAME[finalWinner]} wins {score[finalWinner]} to {score[finalWinner === 'democrat' ? 'republican' : 'democrat']} electoral votes.</p>
            <button className="election-night__play-again" ref={playAgainRef} onClick={onPlayAgain}>
              Run another campaign
            </button>
          </>
        )}
      </section>
    </main>
  );
}
