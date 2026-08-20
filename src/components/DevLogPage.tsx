import { FiArrowLeft, FiExternalLink, FiGithub, FiStar } from 'react-icons/fi';
import type { DevLogEntry } from '@aribradshaw/devlog';
import releases from '../../config/devlog-releases.json';
import './DevLogPage.css';

const GITHUB_URL = 'https://github.com/aribradshaw/1976';
const CONTRIBUTE_URL = 'https://github.com/aribradshaw/1976/blob/main/docs/SCENARIOS.md';

function formatReleaseDate(date: string) {
  return new Intl.DateTimeFormat('en-US', {
    month: 'long',
    day: 'numeric',
    year: 'numeric',
    timeZone: 'UTC',
  }).format(new Date(`${date}T00:00:00Z`));
}

export default function DevLogPage() {
  const [current, ...history] = releases as DevLogEntry[];

  return (
    <main className="devlog-page">
      <header className="devlog-masthead">
        <a className="devlog-brand" href="#/" aria-label="Return to the 1976 title screen">
          <span className="devlog-brand-year">1976</span>
          <span className="devlog-brand-name">Election Desk</span>
        </a>
        <a className="devlog-back-link" href="#/">
          <FiArrowLeft aria-hidden="true" />
          Play the game
        </a>
      </header>

      <section className="devlog-hero" aria-labelledby="devlog-title">
        <p className="devlog-kicker">Production log · Live from the campaign trail</p>
        <h1 id="devlog-title">Building the race for 270</h1>
        <p className="devlog-intro">
          Follow every public release of the historical campaign simulator, from the first
          deterministic polling model to the latest network election desk.
        </p>
        <dl className="devlog-facts" aria-label="Game scope">
          <div><dt>25</dt><dd>Campaign weeks</dd></div>
          <div><dt>50</dt><dd>States in play</dd></div>
          <div><dt>538</dt><dd>Electoral votes</dd></div>
          <div><dt>270</dt><dd>Votes to win</dd></div>
        </dl>
      </section>

      <section className="devlog-current" aria-labelledby="current-release-title">
        <div className="devlog-current-label">
          <span>Now broadcasting</span>
          <strong>v{current.version}</strong>
        </div>
        <div className="devlog-current-copy">
          <p className="devlog-release-date">Released {formatReleaseDate(current.date)}</p>
          <h2 id="current-release-title">{current.title}</h2>
          <ul>
            {current.notes.map(note => <li key={note}>{note}</li>)}
          </ul>
        </div>
      </section>

      <section className="devlog-invitation" aria-labelledby="devlog-invitation-title">
        <div>
          <p className="devlog-kicker">The campaign continues</p>
          <h2 id="devlog-invitation-title">Help shape the next broadcast</h2>
          <p>
            If 1976 earned your vote, star the project. If you have a historical race worth
            rebuilding, the scenario guide is the place to start.
          </p>
        </div>
        <div className="devlog-actions">
          <a className="devlog-action devlog-action-primary" href={GITHUB_URL} target="_blank" rel="noreferrer">
            <FiStar aria-hidden="true" />
            Star 1976 on GitHub
            <FiExternalLink aria-hidden="true" />
          </a>
          <a className="devlog-action" href={CONTRIBUTE_URL} target="_blank" rel="noreferrer">
            <FiGithub aria-hidden="true" />
            Build a scenario
            <FiExternalLink aria-hidden="true" />
          </a>
        </div>
      </section>

      <section className="devlog-history" aria-labelledby="release-history-title">
        <div className="devlog-section-heading">
          <p className="devlog-kicker">Archive desk</p>
          <h2 id="release-history-title">Previous broadcasts</h2>
        </div>
        <ol className="devlog-release-list">
          {history.map(release => (
            <li className="devlog-release" key={release.version}>
              <div className="devlog-release-meta">
                <strong>v{release.version}</strong>
                <time dateTime={release.date}>{formatReleaseDate(release.date)}</time>
              </div>
              <div className="devlog-release-copy">
                <h3>{release.title}</h3>
                <ul>
                  {release.notes.map(note => <li key={note}>{note}</li>)}
                </ul>
              </div>
            </li>
          ))}
        </ol>
      </section>

      <footer className="devlog-footer">
        <p>1976: As Seen on TV! · A historical campaign strategy game by Ari Bradshaw</p>
        <a href="#/">Return to the title screen</a>
      </footer>
    </main>
  );
}
