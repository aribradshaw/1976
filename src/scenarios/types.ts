import { Candidate, StateData } from '../types/game';

export interface ScenarioTicket {
  candidate: Candidate;
  nominee: string;
  runningMate: string;
  partyName: string;
}

export interface ScenarioPollingOverride {
  democraticSupport: number;
  republicanSupport: number;
  marginOfError: number;
  turnoutRate: number;
}

/** A sparse override. Omitted states continue to use the base state dataset. */
export interface ScenarioStateOverride {
  polling?: ScenarioPollingOverride;
  playerMomentum?: number;
  opponentMomentum?: number;
  note: string;
  sourceUrls: readonly string[];
}

export interface ScenarioResources {
  funds: number;
  actionsPerWeek: number;
  energy: number;
  credibility: number;
}

export interface ScenarioDefinition {
  id: string;
  title: string;
  summary: string;
  year: number;
  seed: number;
  totalWeeks: number;
  totalElectoralVotes: number;
  tickets: Record<Candidate, ScenarioTicket>;
  startingResources: ScenarioResources;
  stateOverrides: Readonly<Record<string, ScenarioStateOverride>>;
  eventTimelineId?: string;
  historicalNote: string;
  sourceUrls: readonly string[];
}

export interface ScenarioSession {
  scenario: ScenarioDefinition;
  playerCandidate: Candidate;
  difficulty: 'easy' | 'medium' | 'hard';
  seed: number;
}

export type StateLookup = ReadonlyMap<string, StateData>;
