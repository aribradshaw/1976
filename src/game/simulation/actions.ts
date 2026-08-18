import { CampaignAction, StateData } from '../../types/game';

export type CampaignActionType = CampaignAction['type'];
export type CampaignSize = NonNullable<CampaignAction['campaignSize']>;

export interface ActionQuote {
  actionType: CampaignActionType;
  cost: number;
  isLegal: boolean;
  reasons: string[];
}

export interface ActionQuoteContext {
  /** Existing level when quoting an HQ upgrade. */
  existingHqLevel?: number;
  /** Funds available to the acting campaign. Omit to quote without affordability. */
  availableFunds?: number;
  /** Topics the campaign has already made a public position on. */
  lockedTopics?: ReadonlySet<string>;
}

export const ACTION_CATALOG: Readonly<Record<CampaignActionType, { label: string; actionPoints: number }>> = {
  large_donor_fundraiser: { label: 'Large Donor Fundraiser', actionPoints: 1 },
  launch_ads: { label: 'Media Buy', actionPoints: 1 },
  campaign_hq: { label: 'Campaign Headquarters', actionPoints: 1 },
  rally: { label: 'Campaign Rally', actionPoints: 1 },
};

const AD_SIZE_MULTIPLIER: Readonly<Record<CampaignSize, number>> = {
  small: 0.1,
  medium: 0.5,
  large: 1,
};

/**
 * Canonical cost and legality quote. The current UI and engine may retain
 * their legacy formulas while they migrate to this function.
 */
export function quoteAction(
  action: CampaignAction,
  state: StateData | undefined,
  context: ActionQuoteContext = {},
): ActionQuote {
  const reasons: string[] = [];

  if (!state || state.abbreviation !== action.targetState) {
    reasons.push('Choose a valid target state.');
  }

  if (!Number.isInteger(action.week) || action.week < 1) {
    reasons.push('Choose a valid campaign week.');
  }

  const safeState = state;
  const mediaMultiplier = Math.max(0.25, safeFinite(safeState?.campaignModifiers.mediaMarketCost, 1));
  const eventEffectiveness = Math.max(0.25, safeFinite(safeState?.campaignModifiers.eventEffectiveness, 1));
  const voterMultiplier = Math.min(1, Math.max(0.05, safeFinite(safeState?.population.registeredVoters, 0) / 2_500_000));
  let cost = 0;

  switch (action.type) {
    case 'large_donor_fundraiser':
      cost = 0;
      break;
    case 'launch_ads': {
      if (!action.adTopic) {
        reasons.push('Select one issue for a media buy.');
      }
      if (!action.campaignSize || !(action.campaignSize in AD_SIZE_MULTIPLIER)) {
        reasons.push('Select a media-buy size.');
      }
      const size = action.campaignSize && action.campaignSize in AD_SIZE_MULTIPLIER
        ? action.campaignSize
        : 'small';
      cost = (25_000 + 4_975_000 * voterMultiplier) * AD_SIZE_MULTIPLIER[size] * mediaMultiplier;
      if (action.adTopic && context.lockedTopics && !context.lockedTopics.has(action.adTopic)) {
        reasons.push('Take a public position on this issue before advertising it.');
      }
      break;
    }
    case 'campaign_hq': {
      const expectedLevel = (context.existingHqLevel ?? 0) + 1;
      if (!Number.isInteger(action.hqLevel) || action.hqLevel !== expectedLevel || action.hqLevel < 1 || action.hqLevel > 5) {
        reasons.push('Headquarters must be built or upgraded one level at a time.');
      }
      cost = 500_000 * Math.max(1, Math.min(5, action.hqLevel ?? expectedLevel)) * mediaMultiplier;
      break;
    }
    case 'rally': {
      const topics = action.rallyTopics ?? [];
      if (topics.length !== 3 || new Set(topics).size !== 3) {
        reasons.push('A rally needs exactly three distinct issues.');
      }
      if (context.lockedTopics && topics.some(topic => !context.lockedTopics?.has(topic))) {
        reasons.push('A rally can only feature issues with public positions.');
      }
      cost = (25_000 + 175_000 * voterMultiplier) * mediaMultiplier / eventEffectiveness;
      break;
    }
  }

  cost = Math.round(Math.max(0, finiteOr(cost, 0)));
  if (context.availableFunds !== undefined && (!Number.isFinite(context.availableFunds) || context.availableFunds < cost)) {
    reasons.push('Insufficient campaign funds.');
  }

  return { actionType: action.type, cost, isLegal: reasons.length === 0, reasons };
}

function safeFinite(value: number | undefined, fallback: number): number {
  return Number.isFinite(value) ? value as number : fallback;
}

function finiteOr(value: number, fallback: number): number {
  return Number.isFinite(value) ? value : fallback;
}
