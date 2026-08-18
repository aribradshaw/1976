import { ScenarioDefinition } from './types';

/**
 * A documented, editable starting point for the 1976 general election.
 * Polling overrides are scenario tuning inputs, not certified vote totals.
 */
export const HISTORICAL_1976_SCENARIO: ScenarioDefinition = {
  id: 'historical-1976-general-election',
  title: '1976: Carter vs. Ford',
  summary: 'Run the final 25 weeks of the close 1976 general election as Jimmy Carter or Gerald Ford.',
  year: 1976,
  seed: 19761102,
  totalWeeks: 25,
  totalElectoralVotes: 538,
  tickets: {
    democrat: {
      candidate: 'democrat',
      nominee: 'Jimmy Carter',
      runningMate: 'Walter Mondale',
      partyName: 'Democratic',
    },
    republican: {
      candidate: 'republican',
      nominee: 'Gerald Ford',
      runningMate: 'Robert Dole',
      partyName: 'Republican',
    },
  },
  startingResources: {
    funds: 5_000_000,
    actionsPerWeek: 6,
    energy: 100,
    credibility: 50,
  },
  stateOverrides: {
    OH: {
      polling: { democraticSupport: 45.5, republicanSupport: 46.5, marginOfError: 4.2, turnoutRate: 55 },
      playerMomentum: 1,
      opponentMomentum: 1,
      note: 'A close industrial-state opening makes field organization and the economy central strategic concerns.',
      sourceUrls: ['https://www.archives.gov/electoral-college/1976'],
    },
    PA: {
      polling: { democraticSupport: 46.5, republicanSupport: 45.5, marginOfError: 4, turnoutRate: 56 },
      playerMomentum: 1,
      opponentMomentum: 1,
      note: 'A tight Mid-Atlantic opening rewards a balanced persuasion and turnout plan.',
      sourceUrls: ['https://www.archives.gov/electoral-college/1976'],
    },
    FL: {
      polling: { democraticSupport: 45, republicanSupport: 45, marginOfError: 4.8, turnoutRate: 58 },
      playerMomentum: 0,
      opponentMomentum: 0,
      note: 'Florida begins as a genuine toss-up where retail campaigning can matter.',
      sourceUrls: ['https://www.archives.gov/electoral-college/1976'],
    },
    TX: {
      polling: { democraticSupport: 46.5, republicanSupport: 45, marginOfError: 4.5, turnoutRate: 54 },
      playerMomentum: 1,
      opponentMomentum: 0,
      note: 'Texas is an expensive, high-value state with a modest Democratic starting edge.',
      sourceUrls: ['https://www.archives.gov/electoral-college/1976'],
    },
  },
  eventTimelineId: '1976',
  historicalNote: 'The official result was Carter 297 electoral votes, Ford 240, and one Washington elector voting for Ronald Reagan. This scenario permits alternate outcomes through player choices.',
  sourceUrls: [
    'https://www.archives.gov/electoral-college/1976',
    'https://www.presidency.ucsb.edu/statistics/elections/1976',
  ],
};
