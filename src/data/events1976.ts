/**
 * Curated decision cards for the 25 Tuesday turns ending on Election Day 1976.
 * Effects are intentionally small simulation inputs, not claims about the
 * measured historical effect of a real-world decision.
 */

export type Coalition =
  | 'independents'
  | 'labor'
  | 'southern'
  | 'farm'
  | 'urban'
  | 'suburban'
  | 'women'
  | 'youth'
  | 'veterans'
  | 'conservatives';

export type EventScope =
  | { kind: 'national' }
  | { kind: 'regions'; regions: readonly string[] }
  | { kind: 'states'; states: readonly string[] };

export interface EventEffects {
  funds: number;
  energy: number;
  credibility: number;
  nationalMomentum: number;
  coalition: Partial<Record<Coalition, number>>;
}

export interface CampaignEventChoice {
  id: string;
  label: string;
  summary: string;
  tradeoff: string;
  effects: EventEffects;
  /** Maximum deterministic RNG adjustment to public reaction. */
  volatility: number;
}

export interface CampaignEventDefinition {
  id: string;
  week: number;
  date: string;
  title: string;
  category: 'campaign' | 'convention' | 'debate' | 'news' | 'ground_game' | 'election_day';
  scope: EventScope;
  historicalContext: string;
  sourceUrls: readonly string[];
  choices: readonly CampaignEventChoice[];
  debate?: 'presidential' | 'vice_presidential';
}

const SOURCES = {
  electionResult: 'https://www.archives.gov/electoral-college/1976',
  democraticConvention: 'https://www.presidency.ucsb.edu/documents/our-nations-past-and-future-address-accepting-the-presidential-nomination-the-democratic',
  republicanConvention: 'https://www.presidency.ucsb.edu/documents/remarks-upon-arrival-the-1976-republican-national-convention-headquarters-kansas-city',
  doleSelection: 'https://www.presidency.ucsb.edu/documents/remarks-kansas-city-announcing-senator-robert-dole-kansas-the-presidents-selection-for-the',
  debateGuide: 'https://www.presidency.ucsb.edu/documents/presidential-documents-archive-guidebook/presidential-campaigns-debates-and-endorsements-0',
  debateOne: 'https://www.presidency.ucsb.edu/documents/presidential-campaign-debate-1',
  debateTwo: 'https://www.presidency.ucsb.edu/documents/exchange-with-reporters-following-the-presidential-campaign-debate-san-francisco',
  vicePresidentialDebate: 'https://www.presidency.ucsb.edu/documents/vice-presidential-debate-houston-texas',
  debateThree: 'https://www.presidency.ucsb.edu/documents/presidential-campaign-debate-0',
} as const;

const effect = (
  funds: number,
  energy: number,
  credibility: number,
  nationalMomentum: number,
  coalition: EventEffects['coalition'],
): EventEffects => ({ funds, energy, credibility, nationalMomentum, coalition });

/** Exactly one event is scheduled for each playable week. */
export const EVENTS_1976: readonly CampaignEventDefinition[] = [
  {
    id: 'w01-general-election-pivot', week: 1, date: '1976-05-18', category: 'campaign', scope: { kind: 'national' },
    title: 'The General-Election Pivot',
    historicalContext: 'The long primary season is giving way to a national contest. Decide whether to define the campaign with an outsider message or a governing case.',
    sourceUrls: [SOURCES.electionResult],
    choices: [
      { id: 'clean-government', label: 'Promise a clean break', summary: 'Center trust and accountability.', tradeoff: 'Energizes reform-minded voters but leaves fewer resources for field travel.', effects: effect(-180000, -4, 2, 1, { independents: 2, youth: 1, conservatives: -1 }), volatility: 1 },
      { id: 'competence-first', label: 'Make the competence case', summary: 'Stress steady management and practical results.', tradeoff: 'Builds reassurance with moderates but risks a quieter launch.', effects: effect(-80000, -2, 1, 0, { suburban: 2, veterans: 1, youth: -1 }), volatility: 1 },
    ],
  },
  {
    id: 'w02-economic-message', week: 2, date: '1976-05-25', category: 'campaign', scope: { kind: 'regions', regions: ['Midwest', 'Northeast'] },
    title: 'Recovery or Relief?', historicalContext: 'Economic anxiety remains a central campaign concern after the 1974-75 recession.', sourceUrls: [SOURCES.debateOne],
    choices: [
      { id: 'jobs-plan', label: 'Lead with jobs', summary: 'Unveil a detailed employment pledge.', tradeoff: 'Improves labor support but invites scrutiny of the price tag.', effects: effect(-260000, -3, 1, 1, { labor: 3, urban: 1, conservatives: -2 }), volatility: 2 },
      { id: 'tax-relief', label: 'Lead with tax relief', summary: 'Frame recovery around household purchasing power.', tradeoff: 'Reassures suburban voters but cools enthusiasm among organized labor.', effects: effect(-140000, -2, 1, 1, { suburban: 2, conservatives: 1, labor: -1 }), volatility: 2 },
    ],
  },
  {
    id: 'w03-southern-organization', week: 3, date: '1976-06-01', category: 'ground_game', scope: { kind: 'regions', regions: ['South'] },
    title: 'Build a Southern Field Network', historicalContext: 'The South is electorally important and demands local relationships rather than a one-size-fits-all national message.', sourceUrls: [SOURCES.electionResult],
    choices: [
      { id: 'county-chairs', label: 'Recruit county chairs', summary: 'Invest in durable local organizers.', tradeoff: 'Consumes cash now for a long-term turnout payoff.', effects: effect(-300000, -4, 0, 1, { southern: 3, farm: 1, suburban: -1 }), volatility: 1 },
      { id: 'regional-television', label: 'Buy regional television', summary: 'Reach a broader Southern audience quickly.', tradeoff: 'Creates a faster impression but less local commitment.', effects: effect(-420000, -1, 1, 2, { southern: 2, suburban: 1, farm: -1 }), volatility: 2 },
    ],
  },
  {
    id: 'w04-urban-coalition', week: 4, date: '1976-06-08', category: 'campaign', scope: { kind: 'regions', regions: ['Northeast', 'Great Lakes'] },
    title: 'The City Hall Invitation', historicalContext: 'Urban leaders seek a visible commitment on jobs, services, and neighborhood confidence.', sourceUrls: [SOURCES.democraticConvention],
    choices: [
      { id: 'city-services', label: 'Back urban aid', summary: 'Stand with mayors on targeted federal support.', tradeoff: 'Strengthens city coalitions but creates a fiscal attack line.', effects: effect(-230000, -2, 2, 1, { urban: 3, labor: 1, conservatives: -2 }), volatility: 1 },
      { id: 'local-control', label: 'Stress local control', summary: 'Promise partnership without a large federal program.', tradeoff: 'Broadens suburban comfort but disappoints some city leaders.', effects: effect(-110000, -1, 1, 0, { suburban: 2, urban: -1, conservatives: 1 }), volatility: 1 },
    ],
  },
  {
    id: 'w05-energy-and-inflation', week: 5, date: '1976-06-15', category: 'news', scope: { kind: 'national' },
    title: 'Energy and Inflation Briefing', historicalContext: 'Energy security and household prices are competing pressures in the post-oil-shock economy.', sourceUrls: [SOURCES.debateOne],
    choices: [
      { id: 'conservation', label: 'Call for conservation', summary: 'Frame energy independence as shared civic responsibility.', tradeoff: 'Adds credibility with younger voters but risks sounding restrictive.', effects: effect(-100000, -1, 2, 1, { youth: 2, suburban: 1, conservatives: -1 }), volatility: 1 },
      { id: 'domestic-production', label: 'Champion domestic production', summary: 'Emphasize jobs and reliable supply.', tradeoff: 'Helps industrial and conservative blocs but loses some environmental-minded youth.', effects: effect(-150000, -2, 1, 1, { labor: 1, conservatives: 2, youth: -1 }), volatility: 2 },
    ],
  },
  {
    id: 'w06-fundraising-choice', week: 6, date: '1976-06-22', category: 'campaign', scope: { kind: 'states', states: ['CA', 'IL', 'NY'] },
    title: 'The Donor Circuit', historicalContext: 'A national campaign must balance finance events with visible retail politics.', sourceUrls: [SOURCES.electionResult],
    choices: [
      { id: 'major-donors', label: 'Take the donor circuit', summary: 'Hold closed-door finance events in major markets.', tradeoff: 'Raises substantial money but costs energy and outsider credibility.', effects: effect(650000, -5, -1, 0, { suburban: 1, independents: -1 }), volatility: 2 },
      { id: 'small-donor-drive', label: 'Run a small-donor drive', summary: 'Ask supporters to build the campaign publicly.', tradeoff: 'Builds legitimacy but brings in less immediate cash.', effects: effect(220000, -3, 2, 1, { youth: 2, independents: 1 }), volatility: 1 },
    ],
  },
  {
    id: 'w07-bicentennial-week', week: 7, date: '1976-06-29', category: 'campaign', scope: { kind: 'national' },
    title: 'Bicentennial Week', historicalContext: 'The July 4 Bicentennial is a rare national moment when civic symbolism competes with ordinary campaign attacks.', sourceUrls: [SOURCES.democraticConvention],
    choices: [
      { id: 'unity-address', label: 'Deliver a unity address', summary: 'Use the holiday to ask voters to look past party conflict.', tradeoff: 'Raises stature but cedes several days of targeted campaigning.', effects: effect(-170000, -3, 3, 1, { veterans: 2, independents: 2, youth: 1 }), volatility: 1 },
      { id: 'local-parades', label: 'Work local parades', summary: 'Appear in community celebrations across a key region.', tradeoff: 'Builds local connection but has less national reach.', effects: effect(-90000, -5, 1, 1, { southern: 1, farm: 2, suburban: 1 }), volatility: 2 },
    ],
  },
  {
    id: 'w08-democratic-convention', week: 8, date: '1976-07-06', category: 'convention', scope: { kind: 'national' },
    title: 'Democratic Convention Message', historicalContext: 'Carter accepted the Democratic nomination in New York on July 15, emphasizing party unity and a break from politics as usual.', sourceUrls: [SOURCES.democraticConvention],
    choices: [
      { id: 'unity-acceptance', label: 'Make a unity appeal', summary: 'Lead with shared purpose and party healing.', tradeoff: 'Improves coalition trust but provides less policy contrast.', effects: effect(-230000, -4, 3, 2, { labor: 2, urban: 2, women: 1, independents: 1 }), volatility: 1 },
      { id: 'sharp-contrast', label: 'Draw a sharp contrast', summary: 'Use the convention spotlight to prosecute the case against the other party.', tradeoff: 'Creates a clearer choice but risks alienating persuadable voters.', effects: effect(-120000, -2, 1, 3, { youth: 2, conservatives: -2, independents: -1 }), volatility: 2 },
    ],
  },
  {
    id: 'w09-running-mate-rollout', week: 9, date: '1976-07-13', category: 'campaign', scope: { kind: 'regions', regions: ['Midwest', 'Northeast'] },
    title: 'Ticket Rollout', historicalContext: 'A running mate can reinforce regional, ideological, or governing credentials while changing the campaign schedule.', sourceUrls: [SOURCES.democraticConvention],
    choices: [
      { id: 'governing-partner', label: 'Show a governing partnership', summary: 'Stage policy events that highlight readiness to govern.', tradeoff: 'Adds credibility with professionals but is less emotionally energizing.', effects: effect(-160000, -2, 3, 1, { suburban: 2, labor: 1, youth: -1 }), volatility: 1 },
      { id: 'whistle-stop', label: 'Launch a whistle-stop tour', summary: 'Give the ticket a high-energy regional debut.', tradeoff: 'Builds momentum but drains energy and costs more travel money.', effects: effect(-300000, -6, 1, 3, { labor: 1, urban: 1, youth: 2 }), volatility: 2 },
    ],
  },
  {
    id: 'w10-farm-country', week: 10, date: '1976-07-20', category: 'campaign', scope: { kind: 'regions', regions: ['Plains', 'Midwest'] },
    title: 'Farm Country Test', historicalContext: 'Farm policy, commodity prices, and rural representation are practical concerns in key Midwestern and Plains states.', sourceUrls: [SOURCES.electionResult],
    choices: [
      { id: 'price-supports', label: 'Back price supports', summary: 'Offer predictable support for farm income.', tradeoff: 'Deepens farm support but exposes the campaign to spending criticism.', effects: effect(-140000, -2, 1, 1, { farm: 3, labor: 1, conservatives: -1 }), volatility: 1 },
      { id: 'market-access', label: 'Stress market access', summary: 'Promise export and market-oriented rural growth.', tradeoff: 'Appeals to fiscal conservatives but gives less immediate reassurance.', effects: effect(-100000, -1, 1, 1, { farm: 2, conservatives: 2, labor: -1 }), volatility: 2 },
    ],
  },
  {
    id: 'w11-television-interview', week: 11, date: '1976-07-27', category: 'campaign', scope: { kind: 'national' },
    title: 'Prime-Time Interview', historicalContext: 'Television offers direct national exposure but rewards clarity and creates a durable record for the press.', sourceUrls: [SOURCES.debateGuide],
    choices: [
      { id: 'specific-program', label: 'Offer detailed proposals', summary: 'Use the interview to explain a governing program.', tradeoff: 'Boosts credibility but risks losing a simple message.', effects: effect(-70000, -2, 3, 1, { suburban: 2, independents: 1, youth: -1 }), volatility: 2 },
      { id: 'personal-story', label: 'Tell a personal story', summary: 'Build a values-based connection with undecided viewers.', tradeoff: 'Creates warmth but yields fewer policy specifics.', effects: effect(-50000, -1, 1, 2, { women: 2, southern: 1, independents: 1 }), volatility: 2 },
    ],
  },
  {
    id: 'w12-republican-convention', week: 12, date: '1976-08-03', category: 'convention', scope: { kind: 'national' },
    title: 'Republican Convention Strategy', historicalContext: 'Ford arrived at the Kansas City convention in August facing a contested party and the need for a united fall ticket.', sourceUrls: [SOURCES.republicanConvention],
    choices: [
      { id: 'heal-the-party', label: 'Emphasize party healing', summary: 'Invite every faction into the fall campaign.', tradeoff: 'Strengthens unity but softens the contrast message.', effects: effect(-220000, -4, 2, 2, { conservatives: 2, suburban: 1, veterans: 1 }), volatility: 1 },
      { id: 'governance-record', label: 'Defend the governing record', summary: 'Ask voters to judge steady leadership in difficult years.', tradeoff: 'Builds credibility but reopens dissatisfaction with Washington.', effects: effect(-120000, -2, 2, 1, { suburban: 2, independents: 1, youth: -1 }), volatility: 2 },
    ],
  },
  {
    id: 'w13-ford-dole-ticket', week: 13, date: '1976-08-10', category: 'convention', scope: { kind: 'regions', regions: ['Plains', 'South'] },
    title: 'Ford-Dole Ticket', historicalContext: 'Ford announced Senator Robert Dole as his running mate in Kansas City on August 19.', sourceUrls: [SOURCES.doleSelection],
    choices: [
      { id: 'midwest-discipline', label: 'Pitch Midwestern discipline', summary: 'Highlight a ticket defined by practical experience and fiscal restraint.', tradeoff: 'Reassures conservatives but leaves less room for a softer national image.', effects: effect(-130000, -2, 2, 1, { conservatives: 3, farm: 2, labor: -1 }), volatility: 1 },
      { id: 'national-ticket', label: 'Campaign as a national ticket', summary: 'Use the rollout to reach beyond the party base.', tradeoff: 'Broadens the target but costs additional travel and media.', effects: effect(-280000, -5, 1, 2, { southern: 1, suburban: 2, independents: 1 }), volatility: 2 },
    ],
  },
  {
    id: 'w14-labor-day-prep', week: 14, date: '1976-08-17', category: 'ground_game', scope: { kind: 'regions', regions: ['Great Lakes', 'Northeast'] },
    title: 'Labor Day Launch Prep', historicalContext: 'The campaign is entering the fall sprint, when field capacity and message discipline begin to compound.', sourceUrls: [SOURCES.electionResult],
    choices: [
      { id: 'union-halls', label: 'Book union halls', summary: 'Commit time to worker-facing events and organizers.', tradeoff: 'Deepens labor support but narrows appeal with fiscal conservatives.', effects: effect(-210000, -4, 1, 2, { labor: 3, urban: 1, conservatives: -2 }), volatility: 1 },
      { id: 'suburban-doors', label: 'Organize suburban doors', summary: 'Build local volunteer lists in commuter counties.', tradeoff: 'Creates a broad late-game field asset but takes longer to show.', effects: effect(-190000, -5, 1, 1, { suburban: 3, women: 1, labor: -1 }), volatility: 1 },
    ],
  },
  {
    id: 'w15-fall-message', week: 15, date: '1976-08-24', category: 'campaign', scope: { kind: 'national' },
    title: 'The Fall Message', historicalContext: 'By late August the campaign needs a simple frame that can survive months of ads, interviews, and debates.', sourceUrls: [SOURCES.doleSelection],
    choices: [
      { id: 'trust', label: 'Make trust the frame', summary: 'Put integrity and accountability at the center of every stop.', tradeoff: 'Persuades independents but can fatigue voters who want an economic plan.', effects: effect(-90000, -1, 3, 1, { independents: 3, youth: 1, conservatives: -1 }), volatility: 1 },
      { id: 'security', label: 'Make security the frame', summary: 'Link domestic stability to strength abroad.', tradeoff: 'Builds confidence with veterans but risks a colder tone.', effects: effect(-110000, -1, 2, 1, { veterans: 3, conservatives: 2, youth: -1 }), volatility: 2 },
    ],
  },
  {
    id: 'w16-debate-preparation', week: 16, date: '1976-08-31', category: 'campaign', scope: { kind: 'national' },
    title: 'Debate Preparation Decision', historicalContext: 'The first presidential debate is scheduled for September 23, the first such presidential debate in 16 years.', sourceUrls: [SOURCES.debateGuide, SOURCES.debateOne],
    choices: [
      { id: 'full-rehearsal', label: 'Clear the schedule for rehearsals', summary: 'Invest in briefing books and mock debates.', tradeoff: 'Raises later debate readiness at the cost of immediate field time.', effects: effect(-240000, -5, 2, 0, { suburban: 1, independents: 1 }), volatility: 1 },
      { id: 'stay-on-trail', label: 'Stay on the trail', summary: 'Keep earning local coverage and grassroots energy.', tradeoff: 'Builds immediate momentum but leaves less preparation margin.', effects: effect(-130000, -3, 0, 2, { labor: 1, southern: 1, youth: 1 }), volatility: 2 },
    ],
  },
  {
    id: 'w17-women-and-families', week: 17, date: '1976-09-07', category: 'campaign', scope: { kind: 'regions', regions: ['Northeast', 'West Coast'] },
    title: 'Women and Families Forum', historicalContext: 'Voters are demanding clearer answers on family budgets, equal opportunity, and public services.', sourceUrls: [SOURCES.democraticConvention],
    choices: [
      { id: 'equal-opportunity', label: 'Lead with equal opportunity', summary: 'Make an explicit promise on fair access and representation.', tradeoff: 'Builds enthusiasm with women and youth but creates ideological pushback.', effects: effect(-120000, -2, 2, 1, { women: 3, youth: 2, conservatives: -2 }), volatility: 2 },
      { id: 'family-budget', label: 'Lead with family budgets', summary: 'Center affordability and household stability.', tradeoff: 'Broader reach but a less distinctive values signal.', effects: effect(-100000, -1, 1, 1, { women: 2, suburban: 2, independents: 1 }), volatility: 1 },
    ],
  },
  {
    id: 'w18-final-debate-briefing', week: 18, date: '1976-09-14', category: 'campaign', scope: { kind: 'states', states: ['OH', 'PA', 'MI'] },
    title: 'Final Debate Briefing', historicalContext: 'The first debate is days away and domestic and economic policy will be its announced focus.', sourceUrls: [SOURCES.debateOne],
    choices: [
      { id: 'economic-detail', label: 'Master the economic brief', summary: 'Prioritize unemployment, prices, and tax questions.', tradeoff: 'Improves credibility in industrial states but uses scarce rest time.', effects: effect(-100000, -4, 3, 1, { labor: 2, suburban: 1, independents: 1 }), volatility: 1 },
      { id: 'plainspoken-answer', label: 'Practice plainspoken answers', summary: 'Favor clarity and authentic delivery over dense detail.', tradeoff: 'Adds broad relatability but may leave policy critics unconvinced.', effects: effect(-60000, -2, 1, 2, { independents: 2, southern: 1, youth: 1 }), volatility: 2 },
    ],
  },
  {
    id: 'w19-presidential-debate-one', week: 19, date: '1976-09-21', category: 'debate', debate: 'presidential', scope: { kind: 'national' },
    title: 'Presidential Debate: Domestic and Economic Policy', historicalContext: 'Ford and Carter met in Philadelphia on September 23 for the first presidential debate in 16 years; domestic and economic policy led the program.', sourceUrls: [SOURCES.debateGuide, SOURCES.debateOne],
    choices: [
      { id: 'kitchen-table', label: 'Answer from the kitchen table', summary: 'Connect each policy answer to household consequences.', tradeoff: 'Builds empathy but leaves less time for technical detail.', effects: effect(-90000, -5, 2, 3, { independents: 3, women: 2, labor: 1 }), volatility: 3 },
      { id: 'command-brief', label: 'Give a command briefing', summary: 'Deliver precise, disciplined policy answers.', tradeoff: 'Adds governing credibility but can feel distant to anxious viewers.', effects: effect(-70000, -4, 3, 2, { suburban: 2, veterans: 1, youth: -1 }), volatility: 3 },
      { id: 'contrast-close', label: 'Close with contrast', summary: 'Use rebuttals to draw a sharp choice between the tickets.', tradeoff: 'Creates momentum but risks a negative-news cycle.', effects: effect(-50000, -3, 0, 4, { conservatives: -2, youth: 2, independents: -1 }), volatility: 4 },
    ],
  },
  {
    id: 'w20-debate-aftermath', week: 20, date: '1976-09-28', category: 'campaign', scope: { kind: 'regions', regions: ['Great Lakes', 'Mid-Atlantic'] },
    title: 'Debate Aftermath', historicalContext: 'The campaign must decide whether to amplify its best debate moments or return quickly to local economic concerns.', sourceUrls: [SOURCES.debateOne],
    choices: [
      { id: 'localize-debate', label: 'Localize the debate message', summary: 'Turn national answers into state-specific economic stops.', tradeoff: 'Builds persuasion in battlegrounds but limits national fundraising.', effects: effect(-180000, -4, 1, 2, { labor: 2, suburban: 2, independents: 1 }), volatility: 2 },
      { id: 'national-advertising', label: 'Nationally advertise the highlights', summary: 'Buy a quick national media burst around the best exchange.', tradeoff: 'Boosts momentum but burns cash and may overexpose the message.', effects: effect(-500000, -1, 1, 3, { youth: 1, independents: 2, suburban: 1 }), volatility: 3 },
    ],
  },
  {
    id: 'w21-presidential-debate-two', week: 21, date: '1976-10-05', category: 'debate', debate: 'presidential', scope: { kind: 'national' },
    title: 'Presidential Debate: Foreign Policy', historicalContext: 'The second presidential debate occurred in San Francisco on October 6 and focused attention on foreign-policy judgment.', sourceUrls: [SOURCES.debateGuide, SOURCES.debateTwo],
    choices: [
      { id: 'steady-alliance', label: 'Project steady alliances', summary: 'Frame experience and restraint as the path to peace.', tradeoff: 'Reassures veterans and moderates but offers less rhetorical heat.', effects: effect(-80000, -4, 3, 2, { veterans: 3, suburban: 2, independents: 1 }), volatility: 3 },
      { id: 'human-rights', label: 'Make a human-rights argument', summary: 'Tie American leadership to moral clarity abroad.', tradeoff: 'Energizes younger voters but opens questions about implementation.', effects: effect(-90000, -4, 2, 3, { youth: 3, women: 1, conservatives: -1 }), volatility: 3 },
      { id: 'security-contrast', label: 'Press the security contrast', summary: 'Challenge the opponent’s preparedness under pressure.', tradeoff: 'Can dominate the news cycle or appear overly partisan.', effects: effect(-50000, -3, 0, 4, { conservatives: 2, veterans: 1, independents: -2 }), volatility: 4 },
    ],
  },
  {
    id: 'w22-vice-presidential-debate', week: 22, date: '1976-10-12', category: 'debate', debate: 'vice_presidential', scope: { kind: 'national' },
    title: 'Vice-Presidential Debate: Houston', historicalContext: 'Mondale and Dole debated in Houston on October 15 in the first formal vice-presidential debate.', sourceUrls: [SOURCES.debateGuide, SOURCES.vicePresidentialDebate],
    choices: [
      { id: 'surrogate-discipline', label: 'Give the surrogate a disciplined brief', summary: 'Prioritize a calm, governing performance.', tradeoff: 'Builds ticket credibility but may not generate a breakout moment.', effects: effect(-60000, -2, 2, 1, { suburban: 2, veterans: 1, independents: 1 }), volatility: 2 },
      { id: 'surrogate-attack', label: 'Authorize a pointed contrast', summary: 'Let the running mate prosecute the opponent’s record.', tradeoff: 'Sharpens base enthusiasm but risks a backlash.', effects: effect(-40000, -1, 0, 3, { conservatives: 2, labor: -1, independents: -1 }), volatility: 3 },
    ],
  },
  {
    id: 'w23-presidential-debate-three', week: 23, date: '1976-10-19', category: 'debate', debate: 'presidential', scope: { kind: 'national' },
    title: 'Final Presidential Debate: Williamsburg', historicalContext: 'Ford and Carter held their final debate on October 22 in Williamsburg, Virginia, with an open issue format.', sourceUrls: [SOURCES.debateGuide, SOURCES.debateThree],
    choices: [
      { id: 'closing-vision', label: 'Offer a closing vision', summary: 'Use the open format to connect the campaign’s themes.', tradeoff: 'Builds stature but can leave individual attacks unanswered.', effects: effect(-100000, -5, 3, 3, { independents: 3, women: 1, veterans: 1 }), volatility: 3 },
      { id: 'answer-every-charge', label: 'Answer every charge', summary: 'Use detailed rebuttals to prevent unanswered criticism.', tradeoff: 'Protects credibility but can sound defensive.', effects: effect(-70000, -4, 2, 2, { suburban: 2, conservatives: 1, youth: -1 }), volatility: 3 },
      { id: 'late-break-appeal', label: 'Make a late-break appeal', summary: 'Speak directly to undecided voters in the final minutes.', tradeoff: 'Can move the race but has a larger public-reaction swing.', effects: effect(-80000, -4, 1, 4, { independents: 4, youth: 1, conservatives: -1 }), volatility: 4 },
    ],
  },
  {
    id: 'w24-final-weekend', week: 24, date: '1976-10-26', category: 'ground_game', scope: { kind: 'states', states: ['OH', 'PA', 'TX', 'FL'] },
    title: 'The Final Weekend', historicalContext: 'With Election Day near, the campaign must choose between turnout work and one last bid for national persuasion.', sourceUrls: [SOURCES.electionResult],
    choices: [
      { id: 'get-out-the-vote', label: 'Commit to turnout', summary: 'Send every available organizer to identified supporters.', tradeoff: 'Improves local conversion but leaves little money for a last media push.', effects: effect(-350000, -6, 1, 2, { labor: 2, urban: 2, southern: 1 }), volatility: 2 },
      { id: 'final-television', label: 'Buy one final television push', summary: 'Make a broad closing argument to late deciders.', tradeoff: 'Creates national reach but is expensive and less targeted.', effects: effect(-700000, -2, 1, 3, { independents: 3, suburban: 2, youth: 1 }), volatility: 3 },
    ],
  },
  {
    id: 'w25-election-day', week: 25, date: '1976-11-02', category: 'election_day', scope: { kind: 'national' },
    title: 'Election Day', historicalContext: 'Election Day was November 2. The official Electoral College result was Carter 297, Ford 240, with one Washington elector voting for Ronald Reagan.', sourceUrls: [SOURCES.electionResult],
    choices: [
      { id: 'legal-and-turnout', label: 'Protect the vote', summary: 'Prioritize rides, hotline capacity, and volunteer coordination.', tradeoff: 'Improves turnout credibility but drains the last reserves.', effects: effect(-250000, -6, 2, 1, { urban: 1, labor: 1 }), volatility: 1 },
      { id: 'candidate-sprint', label: 'Make a candidate sprint', summary: 'Use the candidate for a final sequence of high-visibility stops.', tradeoff: 'May create late enthusiasm but adds fatigue and has less local follow-through.', effects: effect(-160000, -8, 1, 2, { independents: 1, southern: 1, youth: 1 }), volatility: 2 },
    ],
  },
];

export const EVENT_SOURCE_URLS = SOURCES;
