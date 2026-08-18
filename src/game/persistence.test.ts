import { describe, expect, it } from 'vitest';
import { CampaignAction, MicrogroupRelationships } from '../types/game';
import { decodeCampaign, encodeCampaign, PersistedGameState } from './persistence';

const relationships: MicrogroupRelationships = {
  hardcore_dem: 5,
  lean_dem: 5,
  swingable_dem: 5,
  hardcore_rep: 5,
  lean_rep: 5,
  swingable_rep: 5,
  hardcore_dem_indie: 5,
  lean_dem_indie: 5,
  swingable_indie: 5,
  lean_rep_indie: 5,
  hardcore_rep_indie: 5,
};

function campaignState(): PersistedGameState {
  const action: CampaignAction = {
    type: 'launch_ads',
    targetState: 'OH',
    cost: 500_000,
    week: 4,
    description: 'Ads in Ohio',
    adTopic: 'economy',
    campaignSize: 'medium',
  };

  return {
    simulationSeed: 12345,
    currentWeek: 4,
    totalWeeks: 25,
    currentDate: new Date('1976-06-01T00:00:00.000Z'),
    electionDate: new Date('1976-11-02T00:00:00.000Z'),
    playerCandidate: 'democrat',
    resources: { funds: 4_500_000, actionsRemaining: 4, energy: 90, credibility: 72, weeklyFundraising: 200_000 },
    stateMomentum: new Map([['OH', 9]]),
    opponentStateMomentum: new Map([['OH', 3]]),
    polling: new Map([['OH', {
      state: 'OH', democraticSupport: 51, republicanSupport: 49, marginOfError: 4, lastUpdated: 4, turnoutRate: 58,
    }]]),
    electoralVotes: { democrat: 278, republican: 260 },
    actionsThisWeek: [action],
    campaignActivities: new Map([['OH', [{ type: 'ads', state: 'OH', weekCreated: 4, adTopic: 'economy', campaignSize: 'medium' }]]]),
    campaignEvents: new Map([['OH', [{ type: 'launch_ads', state: 'OH', week: 4, description: 'Ads in Ohio', adTopic: 'economy' }]]]),
    fundraisingBooths: [{ state: 'OH', weekCreated: 3, initialAmount: 800_000, currentWeek: 4 }],
    microgroupRelationships: new Map([['OH', relationships]]),
    fundraisingPotential: new Map([['OH', 75]]),
    topicPositions: new Map([['economy', 'for']]),
    opponentTopicPositions: new Map([['economy', 'against']]),
    historicalEvents: [{ eventId: 'ford-debate', choiceId: 'prepare', week: 4, publicReaction: 'strong' }],
    gameStatus: 'playing',
    difficulty: 'hard',
    finalResults: new Map([['OH', 'democrat']]),
  };
}

describe('campaign persistence', () => {
  it('round-trips dates, maps, arrays, the RNG snapshot, and optional final results', () => {
    const decoded = decodeCampaign(encodeCampaign(campaignState(), { seed: 98765, state: 76543 }));

    expect(decoded.rng).toEqual({ seed: 98765, state: 76543 });
    expect(decoded.gameState.currentDate).toBeInstanceOf(Date);
    expect(decoded.gameState.currentDate.toISOString()).toBe('1976-06-01T00:00:00.000Z');
    expect(decoded.gameState.polling).toBeInstanceOf(Map);
    expect(decoded.gameState.polling.get('OH')?.democraticSupport).toBe(51);
    expect(decoded.gameState.actionsThisWeek[0].adTopic).toBe('economy');
    expect(decoded.gameState.historicalEvents).toEqual([{ eventId: 'ford-debate', choiceId: 'prepare', week: 4, publicReaction: 'strong' }]);
    expect(decoded.gameState.finalResults).toEqual(new Map([['OH', 'democrat']]));
  });

  it('rejects malformed JSON, unknown versions, and bad map tuples', () => {
    expect(() => decodeCampaign('{not json}')).toThrow('not valid JSON');

    const unsupported = JSON.parse(encodeCampaign(campaignState())) as Record<string, unknown>;
    unsupported.version = 99;
    expect(() => decodeCampaign(unsupported as never)).toThrow('Unsupported campaign serialization version');

    const malformed = JSON.parse(encodeCampaign(campaignState())) as { state: { polling: unknown } };
    malformed.state.polling = [['OH']];
    expect(() => decodeCampaign(malformed as never)).toThrow('state.polling[0] must be a [key, value] tuple');
  });

  it('defaults the RNG snapshot to the simulation seed', () => {
    const decoded = decodeCampaign(encodeCampaign(campaignState()));
    expect(decoded.rng).toEqual({ seed: 12345, state: 12345 });
  });
});
