import { describe, expect, it } from 'vitest';
import { California } from '../../../states/California';
import { CampaignAction } from '../../../types/game';
import { quoteAction } from '../actions';

const action = (overrides: Partial<CampaignAction>): CampaignAction => ({
  type: 'launch_ads',
  targetState: 'CA',
  cost: 0,
  week: 1,
  description: 'Test action',
  ...overrides,
});

describe('quoteAction', () => {
  it('quotes a legal affordable media buy deterministically', () => {
    const quoted = quoteAction(action({ adTopic: 'economy', campaignSize: 'small' }), California, {
      availableFunds: 10_000_000,
      lockedTopics: new Set(['economy']),
    });

    expect(quoted).toMatchObject({ actionType: 'launch_ads', cost: 500_000, isLegal: true, reasons: [] });
  });

  it('rejects an unpositioned or unaffordable ad buy', () => {
    const quoted = quoteAction(action({ adTopic: 'energy', campaignSize: 'large' }), California, {
      availableFunds: 1,
      lockedTopics: new Set(['economy']),
    });

    expect(quoted.isLegal).toBe(false);
    expect(quoted.reasons).toContain('Take a public position on this issue before advertising it.');
    expect(quoted.reasons).toContain('Insufficient campaign funds.');
  });

  it('enforces headquarters upgrade order and distinct rally topics', () => {
    const hq = quoteAction(action({ type: 'campaign_hq', hqLevel: 3 }), California, { existingHqLevel: 1 });
    const rally = quoteAction(action({ type: 'rally', rallyTopics: ['economy', 'economy', 'energy'] }), California);

    expect(hq.isLegal).toBe(false);
    expect(rally.isLegal).toBe(false);
    expect(rally.reasons).toContain('A rally needs exactly three distinct issues.');
  });
});
