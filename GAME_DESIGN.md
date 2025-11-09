# 1976: Election Simulation Game

## Game Overview

**1976** is a turn-based strategy game that simulates the incredibly close 1976 U.S. Presidential Election between Gerald Ford (Republican) and Jimmy Carter (Democrat). Players take control of one candidate and must navigate 25 weeks of campaigning across all 50 states to secure the 270 electoral votes needed to win the presidency.

## Core Gameplay Mechanics

### Turn Structure
- **Total Duration**: 25 weeks (approximately 6 months of campaigning)
- **Turn Length**: 1 week per turn
- **Progress Tracking**: Visual progress bar that fills incrementally each week
- **Victory Condition**: First candidate to reach 270 electoral votes wins

### State System
- **50 States**: Each state has unique political demographics and electoral vote counts
- **State Attributes** (per state `.ts` file):
  - Total population
  - Voting-eligible population
  - Percentage Democratic lean
  - Percentage Independent/Undecided
  - Percentage Republican lean
  - Electoral votes
  - Historical voting patterns
  - Media market costs
  - Campaign event effectiveness modifiers

### Polling System
- **Dynamic Polling**: Each state shows polling data with margin of error
- **Margin of Error Range**: 3% to 10% (randomized per state per week)
- **Visual Representation**: States colored in shades of:
  - **Red**: Republican-leaning (darker = stronger lead)
  - **Blue**: Democratic-leaning (darker = stronger lead)
  - **Purple**: Toss-up/competitive states (intensity indicates closeness)
- **Uncertainty Factor**: Players never know exact standings, only approximate polling ranges
- **Polling Updates**: Refreshed weekly based on campaign actions and events

### Player Actions (Per Turn)

#### 1. Fundraising
- Allocate resources to raise campaign funds
- Different fundraising strategies (small donors, large donors, PACs)
- Funds required for all other campaign activities
- Regional fundraising effectiveness varies

#### 2. Media Appearances
- Purchase TV/radio ads in specific states or regions
- Schedule interviews and press conferences
- National vs. local media campaigns
- Cost varies by media market size
- Impact on polling in targeted states

#### 3. Campaign Events
- Rallies and town halls in specific states
- Door-to-door canvassing
- Voter registration drives
- Endorsement events
- Each event type has different costs and effectiveness

#### 4. Debates
- Three scheduled presidential debates (historical accuracy)
- Special turn events with significant polling impact
- Preparation time required
- Performance affects multiple states simultaneously
- Strategic decision: how much to invest in debate prep

#### 5. Policy Positioning
- Adjust stance on key issues (economy, foreign policy, social issues)
- Appeals to different voter demographics
- Risk/reward: strong positions can energize base but alienate moderates

#### 6. Surrogate Campaigning
- Deploy VP candidate and other surrogates
- Can campaign in multiple states simultaneously
- Lower cost but less impact than candidate visits

### Resource Management
- **Campaign Funds**: Limited budget, must allocate strategically
- **Time**: Each week allows limited number of actions
- **Candidate Energy**: Fatigue system affects effectiveness
- **Momentum**: Success breeds success; winning states provides bonuses

## Technical Architecture

### State Data Structure

Each state will have its own TypeScript file (e.g., `states/California.ts`, `states/Texas.ts`) containing:

```typescript
interface StateData {
  name: string;
  abbreviation: string;
  electoralVotes: number;
  population: {
    total: number;
    votingEligible: number;
    registeredVoters: number;
  };
  demographics: {
    democraticBase: number;      // Percentage
    republicanBase: number;       // Percentage
    independent: number;          // Percentage
    undecided: number;            // Percentage
  };
  historicalData: {
    previousElectionResults: {
      dem: number;
      rep: number;
      other: number;
    };
    turnoutRate: number;
  };
  campaignModifiers: {
    mediaMarketCost: number;      // Cost multiplier for ads
    eventEffectiveness: number;   // Modifier for campaign events
    fundraisingPotential: number; // Fundraising effectiveness
  };
  regionalFactors: {
    urbanPercentage: number;
    ruralPercentage: number;
    swingVoterPercentage: number;
  };
}
```

### Core Game Files

- `GameEngine.ts` - Main game logic, turn management, victory conditions
- `PollingSystem.ts` - Polling calculations, margin of error, state coloring
- `CampaignActions.ts` - Action handlers (fundraising, events, media, etc.)
- `StateManager.ts` - State data management and calculations
- `UI/GameInterface.tsx` - Main game UI component
- `UI/StateMap.tsx` - Interactive map with color-coded states
- `UI/ActionPanel.tsx` - Player action selection interface
- `UI/ProgressBar.tsx` - Weekly progress indicator
- `UI/ResourceDisplay.tsx` - Funds, time, energy display
- `states/*.ts` - Individual state data files (50 files)

## User Interface Design

### Main Game Screen

1. **Interactive U.S. Map**
   - 50 states visually represented
   - Color-coded by current polling:
     - Deep Red: Strong Republican lead (>10%)
     - Light Red: Moderate Republican lead (3-10%)
     - Purple: Toss-up (<3% margin)
     - Light Blue: Moderate Democratic lead (3-10%)
     - Deep Blue: Strong Democratic lead (>10%)
   - Hover tooltips show:
     - Current polling range
     - Electoral votes
     - Recent polling trends
   - Clickable states for detailed view

2. **Progress Bar**
   - Visual representation of campaign timeline
   - Fills incrementally each week (1/25 per turn)
   - Shows current week number
   - Milestone markers (debate dates, conventions, etc.)

3. **Action Panel**
   - Turn-based action selection
   - Available actions with costs
   - Resource requirements clearly displayed
   - Action effectiveness previews

4. **Resource Dashboard**
   - Campaign funds (current/total raised)
   - Actions remaining this turn
   - Candidate energy level
   - Momentum indicator

5. **State Detail View**
   - Detailed polling data (with margin of error)
   - Historical voting patterns
   - Recent campaign activity
   - Cost estimates for actions in this state

6. **Event Log**
   - Weekly summary of actions taken
   - Polling changes
   - Special events (debates, endorsements, etc.)
   - Opponent actions (AI or second player)

### Visual Design Principles
- **Sleek, Modern Interface**: Clean lines, intuitive navigation
- **Historical Aesthetic**: 1970s-inspired color palette and typography
- **Information Hierarchy**: Most important info (polling, resources) prominently displayed
- **Responsive Feedback**: Clear visual feedback for all actions
- **Accessibility**: High contrast, readable fonts, tooltip explanations

## Game Balance & Strategy

### Strategic Depth
- **Resource Allocation**: Limited funds force tough choices
- **Risk vs. Reward**: Safe states vs. swing states
- **Timing**: When to peak matters (early vs. late momentum)
- **Information Asymmetry**: Polling uncertainty creates strategic tension
- **Opponent Modeling**: Predict and counter opponent moves

### Difficulty Levels
- **Easy**: Opponent randomly chooses states and actions
- **Medium**: Opponent randomly chooses states but picks actions that help their base and indies
- **Hard**: Opponent always targets swing states and picks actions that maximize base and indie support

## Historical Accuracy

### 1976 Election Context
- **Incumbent**: Gerald Ford (Republican) - took office after Nixon's resignation
- **Challenger**: Jimmy Carter (Democrat) - former Georgia Governor
- **Key Issues**: Post-Watergate trust, economy, foreign policy
- **Result**: Carter won 297-240 electoral votes (very close popular vote)
- **Key States**: Ohio, Pennsylvania, Texas, Florida were crucial

### Historical Events to Include
- Three presidential debates
- VP debate (Mondale vs. Dole)
- Key endorsements
- Major policy announcements
- Campaign scandals/gaffes (randomized or scripted)

## Implementation Roadmap

### Phase 1: Core Infrastructure
- [ ] Set up project structure (React/TypeScript)
- [ ] Create base game engine with turn system
- [ ] Implement state data structure
- [ ] Create all 50 state `.ts` files with historical data
- [ ] Basic UI framework

### Phase 2: Game Systems
- [ ] Polling system with margin of error
- [ ] State coloring/map visualization
- [ ] Campaign action system (fundraising, events, media)
- [ ] Resource management
- [ ] Progress bar and timeline

### Phase 3: Campaign Mechanics
- [ ] Fundraising mechanics
- [ ] Media appearance system
- [ ] Campaign event system
- [ ] Debate system (special events)
- [ ] Policy positioning system
- [ ] Surrogate campaigning

### Phase 4: AI & Multiplayer
- [ ] AI opponent (Ford or Carter)
- [ ] Opponent action prediction
- [ ] Multiplayer support (optional)
- [ ] Difficulty balancing

### Phase 5: Polish & UI
- [ ] Sleek interface design
- [ ] Animations and transitions
- [ ] Sound effects and music (1970s era)
- [ ] Tutorial system
- [ ] Save/load functionality
- [ ] Victory/defeat screens

### Phase 6: Historical Content
- [ ] Historical event system
- [ ] Period-accurate media and messaging
- [ ] Historical context tooltips
- [ ] Educational content about 1976 election

## Data Sources for State Files

Each state file will need:
- 1976 census data (population, voting age population)
- 1976 election results (for baseline percentages)
- 1976 media market data (for campaign costs)
- Historical voting patterns
- Regional demographic data

## Future Enhancements (Post-Launch)

- Additional election years (1980, 2000, 2016, etc.)
- Custom candidate creation
- Scenario editor
- Historical replay mode
- Achievement system
- Leaderboards
- Mobile version

---

## Notes

This game aims to be both entertaining and educational, providing players with insight into the complexities of presidential campaigns while recreating one of the closest elections in U.S. history. The uncertainty of polling data creates genuine strategic tension, and the historical setting provides rich context for modern political discussions.


