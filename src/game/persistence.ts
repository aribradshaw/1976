import {
  CampaignAction,
  CampaignActivity,
  CampaignEvent,
  Candidate,
  FundraisingBooth,
  GameState,
  MicrogroupRelationships,
  PollingData,
} from '../types/game';
import { RngSnapshot } from './simulation/rng';
export type { RngSnapshot } from './simulation/rng';

export const CAMPAIGN_SERIALIZATION_VERSION = 1;
export const CAMPAIGN_SAVE_KEY = '1976-campaign-save-v1';

export type PersistedGameState = GameState;

export interface SerializedCampaign {
  version: typeof CAMPAIGN_SERIALIZATION_VERSION;
  rng: RngSnapshot;
  state: SerializedGameState;
}

export interface DecodedCampaign {
  gameState: PersistedGameState;
  rng: RngSnapshot;
}

export interface SerializedGameState extends Omit<
  GameState,
  | 'currentDate'
  | 'electionDate'
  | 'stateMomentum'
  | 'opponentStateMomentum'
  | 'polling'
  | 'campaignActivities'
  | 'campaignEvents'
  | 'microgroupRelationships'
  | 'fundraisingPotential'
  | 'topicPositions'
  | 'opponentTopicPositions'
  | 'finalResults'
> {
  currentDate: string;
  electionDate: string;
  stateMomentum: Array<[string, number]>;
  opponentStateMomentum: Array<[string, number]>;
  polling: Array<[string, PollingData]>;
  campaignActivities: Array<[string, CampaignActivity[]]>;
  campaignEvents: Array<[string, CampaignEvent[]]>;
  microgroupRelationships: Array<[string, MicrogroupRelationships]>;
  fundraisingPotential: Array<[string, number]>;
  topicPositions: Array<[string, 'for' | 'against']>;
  opponentTopicPositions: Array<[string, 'for' | 'against']>;
  /** Optional to allow decoding saves made before final results were introduced. */
  finalResults?: Array<[string, Candidate]>;
}

/** Serializes a complete campaign into a portable, versioned JSON payload. */
export function encodeCampaign(gameState: PersistedGameState, rng: RngSnapshot = { seed: gameState.simulationSeed, state: gameState.simulationSeed }): string {
  const envelope: SerializedCampaign = {
    version: CAMPAIGN_SERIALIZATION_VERSION,
    rng: {
      seed: requireFiniteNumber(rng.seed, 'rng.seed'),
      state: requireFiniteNumber(rng.state, 'rng.state'),
    },
    state: serializeGameState(gameState),
  };

  return JSON.stringify(envelope);
}

/** Restores a campaign from JSON or an already parsed serialized envelope. */
export function decodeCampaign(value: string | SerializedCampaign): DecodedCampaign {
  const parsed = typeof value === 'string' ? parseJson(value) : value;
  const envelope = requireRecord(parsed, 'campaign');

  if (envelope.version !== CAMPAIGN_SERIALIZATION_VERSION) {
    throw new Error(`Unsupported campaign serialization version: ${String(envelope.version)}`);
  }

  const rng = requireRecord(envelope.rng, 'campaign.rng');
  const state = deserializeGameState(requireRecord(envelope.state, 'campaign.state'));

  return {
    gameState: state,
    rng: {
      seed: requireFiniteNumber(rng.seed, 'campaign.rng.seed'),
      state: requireFiniteNumber(rng.state, 'campaign.rng.state'),
    },
  };
}

function serializeGameState(gameState: PersistedGameState): SerializedGameState {
  return {
    ...gameState,
    currentDate: serializeDate(gameState.currentDate, 'currentDate'),
    electionDate: serializeDate(gameState.electionDate, 'electionDate'),
    stateMomentum: [...gameState.stateMomentum.entries()],
    opponentStateMomentum: [...gameState.opponentStateMomentum.entries()],
    polling: [...gameState.polling.entries()],
    campaignActivities: [...gameState.campaignActivities.entries()],
    campaignEvents: [...gameState.campaignEvents.entries()],
    microgroupRelationships: [...gameState.microgroupRelationships.entries()],
    fundraisingPotential: [...gameState.fundraisingPotential.entries()],
    topicPositions: [...gameState.topicPositions.entries()],
    opponentTopicPositions: [...gameState.opponentTopicPositions.entries()],
    finalResults: [...gameState.finalResults.entries()],
  };
}

function deserializeGameState(serialized: Record<string, unknown>): PersistedGameState {
  const state = {
    simulationSeed: requireFiniteNumber(serialized.simulationSeed, 'state.simulationSeed'),
    currentWeek: requireFiniteNumber(serialized.currentWeek, 'state.currentWeek'),
    totalWeeks: requireFiniteNumber(serialized.totalWeeks, 'state.totalWeeks'),
    currentDate: parseDate(serialized.currentDate, 'state.currentDate'),
    electionDate: parseDate(serialized.electionDate, 'state.electionDate'),
    playerCandidate: requireCandidate(serialized.playerCandidate, 'state.playerCandidate'),
    resources: deserializeResources(serialized.resources),
    stateMomentum: deserializeNumericMap(serialized.stateMomentum, 'state.stateMomentum'),
    opponentStateMomentum: deserializeNumericMap(serialized.opponentStateMomentum, 'state.opponentStateMomentum'),
    polling: deserializePollingMap(serialized.polling),
    electoralVotes: deserializeElectoralVotes(serialized.electoralVotes),
    actionsThisWeek: deserializeActions(serialized.actionsThisWeek),
    campaignActivities: deserializeActivitiesMap(serialized.campaignActivities),
    campaignEvents: deserializeEventsMap(serialized.campaignEvents),
    fundraisingBooths: deserializeBooths(serialized.fundraisingBooths),
    microgroupRelationships: deserializeRelationshipsMap(serialized.microgroupRelationships),
    fundraisingPotential: deserializeNumericMap(serialized.fundraisingPotential, 'state.fundraisingPotential'),
    topicPositions: deserializeTopicMap(serialized.topicPositions, 'state.topicPositions'),
    opponentTopicPositions: deserializeTopicMap(serialized.opponentTopicPositions, 'state.opponentTopicPositions'),
    historicalEvents: deserializeHistoricalEvents(serialized.historicalEvents),
    gameStatus: requireEnum(serialized.gameStatus, ['playing', 'won', 'lost', 'paused'], 'state.gameStatus'),
    difficulty: requireEnum(serialized.difficulty, ['easy', 'medium', 'hard'], 'state.difficulty'),
    finalResults: serialized.finalResults === undefined
      ? new Map<string, Candidate>()
      : deserializeCandidateMap(serialized.finalResults, 'state.finalResults'),
  } satisfies GameState;

  return state;
}

function deserializeResources(value: unknown): GameState['resources'] {
  const resources = requireRecord(value, 'state.resources');
  return {
    funds: requireFiniteNumber(resources.funds, 'state.resources.funds'),
    actionsRemaining: requireFiniteNumber(resources.actionsRemaining, 'state.resources.actionsRemaining'),
    energy: requireFiniteNumber(resources.energy, 'state.resources.energy'),
    credibility: requireFiniteNumber(resources.credibility, 'state.resources.credibility'),
    weeklyFundraising: requireFiniteNumber(resources.weeklyFundraising, 'state.resources.weeklyFundraising'),
  };
}

function deserializeElectoralVotes(value: unknown): GameState['electoralVotes'] {
  const electoralVotes = requireRecord(value, 'state.electoralVotes');
  return {
    democrat: requireFiniteNumber(electoralVotes.democrat, 'state.electoralVotes.democrat'),
    republican: requireFiniteNumber(electoralVotes.republican, 'state.electoralVotes.republican'),
  };
}

function deserializePollingMap(value: unknown): Map<string, PollingData> {
  return deserializeMap(value, 'state.polling', (entry, label) => {
    const polling = requireRecord(entry, label);
    return {
      state: requireString(polling.state, `${label}.state`),
      democraticSupport: requireFiniteNumber(polling.democraticSupport, `${label}.democraticSupport`),
      republicanSupport: requireFiniteNumber(polling.republicanSupport, `${label}.republicanSupport`),
      marginOfError: requireFiniteNumber(polling.marginOfError, `${label}.marginOfError`),
      lastUpdated: requireFiniteNumber(polling.lastUpdated, `${label}.lastUpdated`),
      turnoutRate: requireFiniteNumber(polling.turnoutRate, `${label}.turnoutRate`),
    };
  });
}

function deserializeActions(value: unknown): CampaignAction[] {
  return requireArray(value, 'state.actionsThisWeek').map((item, index) => deserializeAction(requireRecord(item, `state.actionsThisWeek[${index}]`), `state.actionsThisWeek[${index}]`));
}

function deserializeAction(value: Record<string, unknown>, label: string): CampaignAction {
  return {
    type: requireEnum(value.type, ['large_donor_fundraiser', 'launch_ads', 'campaign_hq', 'rally'], `${label}.type`),
    targetState: requireString(value.targetState, `${label}.targetState`),
    cost: requireFiniteNumber(value.cost, `${label}.cost`),
    week: requireFiniteNumber(value.week, `${label}.week`),
    description: requireString(value.description, `${label}.description`),
    ...optionalString(value.adTopic, `${label}.adTopic`, 'adTopic'),
    ...optionalStringArray(value.rallyTopics, `${label}.rallyTopics`, 'rallyTopics'),
    ...optionalFiniteNumber(value.hqLevel, `${label}.hqLevel`, 'hqLevel'),
    ...optionalEnum(value.campaignSize, ['small', 'medium', 'large'], `${label}.campaignSize`, 'campaignSize'),
    ...optionalFiniteNumber(value.fundraisingAmount, `${label}.fundraisingAmount`, 'fundraisingAmount'),
  };
}

function deserializeActivitiesMap(value: unknown): Map<string, CampaignActivity[]> {
  return deserializeMap(value, 'state.campaignActivities', (entry, label) => requireArray(entry, label).map((item, index) => {
    const activity = requireRecord(item, `${label}[${index}]`);
    return {
      type: requireEnum(activity.type, ['hq', 'ads', 'fundraising_booth'], `${label}[${index}].type`),
      state: requireString(activity.state, `${label}[${index}].state`),
      weekCreated: requireFiniteNumber(activity.weekCreated, `${label}[${index}].weekCreated`),
      ...optionalEnum(activity.actor, ['player', 'opponent'], `${label}[${index}].actor`, 'actor'),
      ...optionalFiniteNumber(activity.initialValue, `${label}[${index}].initialValue`, 'initialValue'),
      ...optionalFiniteNumber(activity.hqLevel, `${label}[${index}].hqLevel`, 'hqLevel'),
      ...optionalString(activity.adTopic, `${label}[${index}].adTopic`, 'adTopic'),
      ...optionalEnum(activity.campaignSize, ['small', 'medium', 'large'], `${label}[${index}].campaignSize`, 'campaignSize'),
    };
  }));
}

function deserializeEventsMap(value: unknown): Map<string, CampaignEvent[]> {
  return deserializeMap(value, 'state.campaignEvents', (entry, label) => requireArray(entry, label).map((item, index) => {
    const event = requireRecord(item, `${label}[${index}]`);
    return {
      type: requireEnum(event.type, ['rally', 'large_donor_fundraiser', 'launch_ads', 'campaign_hq'], `${label}[${index}].type`),
      state: requireString(event.state, `${label}[${index}].state`),
      week: requireFiniteNumber(event.week, `${label}[${index}].week`),
      description: requireString(event.description, `${label}[${index}].description`),
      ...optionalString(event.adTopic, `${label}[${index}].adTopic`, 'adTopic'),
      ...optionalStringArray(event.rallyTopics, `${label}[${index}].rallyTopics`, 'rallyTopics'),
      ...optionalFiniteNumber(event.hqLevel, `${label}[${index}].hqLevel`, 'hqLevel'),
      ...optionalEnum(event.campaignSize, ['small', 'medium', 'large'], `${label}[${index}].campaignSize`, 'campaignSize'),
      ...optionalFiniteNumber(event.fundraisingAmount, `${label}[${index}].fundraisingAmount`, 'fundraisingAmount'),
      ...optionalBoolean(event.isOpponent, `${label}[${index}].isOpponent`, 'isOpponent'),
    };
  }));
}

function deserializeBooths(value: unknown): FundraisingBooth[] {
  return requireArray(value, 'state.fundraisingBooths').map((item, index) => {
    const booth = requireRecord(item, `state.fundraisingBooths[${index}]`);
    return {
      state: requireString(booth.state, `state.fundraisingBooths[${index}].state`),
      weekCreated: requireFiniteNumber(booth.weekCreated, `state.fundraisingBooths[${index}].weekCreated`),
      initialAmount: requireFiniteNumber(booth.initialAmount, `state.fundraisingBooths[${index}].initialAmount`),
      currentWeek: requireFiniteNumber(booth.currentWeek, `state.fundraisingBooths[${index}].currentWeek`),
    };
  });
}

function deserializeRelationshipsMap(value: unknown): Map<string, MicrogroupRelationships> {
  const fields: Array<keyof MicrogroupRelationships> = [
    'hardcore_dem', 'lean_dem', 'swingable_dem', 'hardcore_rep', 'lean_rep', 'swingable_rep',
    'hardcore_dem_indie', 'lean_dem_indie', 'swingable_indie', 'lean_rep_indie', 'hardcore_rep_indie',
  ];
  return deserializeMap(value, 'state.microgroupRelationships', (entry, label) => {
    const serializedRelationship = requireRecord(entry, label);
    const relationship = {} as MicrogroupRelationships;
    for (const field of fields) {
      relationship[field] = requireFiniteNumber(serializedRelationship[field], `${label}.${field}`);
    }
    return relationship;
  });
}

function deserializeTopicMap(value: unknown, label: string): Map<string, 'for' | 'against'> {
  return deserializeMap(value, label, (entry, entryLabel) => requireEnum(entry, ['for', 'against'], entryLabel));
}

function deserializeCandidateMap(value: unknown, label: string): Map<string, Candidate> {
  return deserializeMap(value, label, (entry, entryLabel) => requireCandidate(entry, entryLabel));
}

function deserializeNumericMap(value: unknown, label: string): Map<string, number> {
  return deserializeMap(value, label, (entry, entryLabel) => requireFiniteNumber(entry, entryLabel));
}

function deserializeHistoricalEvents(value: unknown): GameState['historicalEvents'] {
  return requireArray(value, 'state.historicalEvents').map((item, index) => {
    const event = requireRecord(item, `state.historicalEvents[${index}]`);
    return {
      eventId: requireString(event.eventId, `state.historicalEvents[${index}].eventId`),
      choiceId: requireString(event.choiceId, `state.historicalEvents[${index}].choiceId`),
      week: requireFiniteNumber(event.week, `state.historicalEvents[${index}].week`),
      publicReaction: requireEnum(event.publicReaction, ['muted', 'as_expected', 'strong'], `state.historicalEvents[${index}].publicReaction`),
    };
  });
}

function deserializeMap<T>(value: unknown, label: string, deserializeValue: (value: unknown, label: string) => T): Map<string, T> {
  return new Map(requireArray(value, label).map((item, index) => {
    const entry = requireArray(item, `${label}[${index}]`);
    if (entry.length !== 2) throw new Error(`${label}[${index}] must be a [key, value] tuple.`);
    return [requireString(entry[0], `${label}[${index}][0]`), deserializeValue(entry[1], `${label}[${index}][1]`)] as [string, T];
  }));
}

function parseJson(value: string): unknown {
  try {
    return JSON.parse(value) as unknown;
  } catch {
    throw new Error('Campaign data is not valid JSON.');
  }
}

function serializeDate(value: Date, label: string): string {
  if (!(value instanceof Date) || Number.isNaN(value.getTime())) throw new Error(`${label} must be a valid Date.`);
  return value.toISOString();
}

function parseDate(value: unknown, label: string): Date {
  const date = new Date(requireString(value, label));
  if (Number.isNaN(date.getTime())) throw new Error(`${label} must be an ISO date.`);
  return date;
}

function requireRecord(value: unknown, label: string): Record<string, unknown> {
  if (!value || typeof value !== 'object' || Array.isArray(value)) throw new Error(`${label} must be an object.`);
  return value as Record<string, unknown>;
}

function requireArray(value: unknown, label: string): unknown[] {
  if (!Array.isArray(value)) throw new Error(`${label} must be an array.`);
  return value;
}

function requireString(value: unknown, label: string): string {
  if (typeof value !== 'string') throw new Error(`${label} must be a string.`);
  return value;
}

function requireFiniteNumber(value: unknown, label: string): number {
  if (typeof value !== 'number' || !Number.isFinite(value)) throw new Error(`${label} must be a finite number.`);
  return value;
}

function requireCandidate(value: unknown, label: string): Candidate {
  return requireEnum(value, ['democrat', 'republican'], label);
}

function requireEnum<T extends string>(value: unknown, values: readonly T[], label: string): T {
  if (typeof value !== 'string' || !values.includes(value as T)) {
    throw new Error(`${label} must be one of: ${values.join(', ')}.`);
  }
  return value as T;
}

function optionalString(value: unknown, label: string, key: string): Record<string, string> {
  return value === undefined ? {} : { [key]: requireString(value, label) };
}

function optionalStringArray(value: unknown, label: string, key: string): Record<string, string[]> {
  return value === undefined ? {} : { [key]: requireArray(value, label).map((item, index) => requireString(item, `${label}[${index}]`)) };
}

function optionalFiniteNumber(value: unknown, label: string, key: string): Record<string, number> {
  return value === undefined ? {} : { [key]: requireFiniteNumber(value, label) };
}

function optionalBoolean(value: unknown, label: string, key: string): Record<string, boolean> {
  if (value === undefined) return {};
  if (typeof value !== 'boolean') throw new Error(`${label} must be a boolean.`);
  return { [key]: value };
}

function optionalEnum<T extends string>(value: unknown, values: readonly T[], label: string, key: string): Record<string, T> {
  return value === undefined ? {} : { [key]: requireEnum(value, values, label) };
}
