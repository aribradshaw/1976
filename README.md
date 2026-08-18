# 1976: Election Simulation Game

> Version 2.7.1, campaign simulation foundation

## What changed in 2.7.1

- Weekly actions are now real plans. Their campaign effects resolve only when the week ends, so removing a plan cannot leave behind money, momentum, voter relationships, offices, or event history.
- Players may end a week with unused campaign days instead of being forced to fill all six slots.
- Weekly interviews now resolve before that week's polling and opponent response, including in the final week.
- The AI obeys the same six-action ceiling as the player and no longer receives invisible catch-up actions or passive hard-mode momentum.
- Every campaign now has a replayable simulation seed. Core engine randomness uses the seeded stream instead of `Math.random()`.
- Added a canonical action quote layer and probability-based electoral forecast foundation for the upcoming strategy UI.
- Corrected Maine from 2 to 4 electoral votes, restoring the national total to 538.
- Added Vitest coverage for deterministic replay, action queue purity, action legality, electoral-vote integrity, and hundreds of randomized forecast boards.

A turn-based strategy game simulating the 1976 U.S. Presidential Election between Gerald Ford and Jimmy Carter. Campaign across all 50 states, manage resources, build momentum, and compete for 270 electoral votes in this historically-accurate political strategy game.

## Features

### Core Gameplay
- **50 States**: Each state has unique demographics, electoral votes, historical data, and campaign costs
- **25-Week Campaign**: Navigate a full campaign season from May to November 1976
- **Dynamic Polling System**: Real-time polling with 3-10% margin of error for strategic uncertainty
- **Momentum System**: Build momentum in states to convert undecided voters and sway swingable voters
- **Resource Management**: Manage funds, energy, actions per turn, and fundraising potential

### Campaign Actions
- **Campaign Headquarters (HQ)**: Build and upgrade HQs (Levels 1-5) in states for weekly momentum boosts and turnout increases
- **Launch Ads**: Run TV/radio ad campaigns with three sizes:
  - **Small**: $300K, +2 momentum
  - **Medium**: $600K, +6 momentum
  - **Large**: $1M, +10 momentum
- **Rallies**: Hold campaign rallies with 3 topics to boost relationships and momentum (+2 momentum)
- **Large Donor Fundraisers**: Raise funds from wealthy donors (amount varies by state)

### Strategic Systems
- **Weekly Events**: Each week, choose your position on a major issue (positions are permanent and locked)
- **Microgroup Relationships**: Build relationships with 11 different voter microgroups in each state
- **Momentum Competition**: Momentum differential drives poll changes - compete with AI opponent for momentum advantage
- **Topic Positions**: Lock positions on 20 different topics (Watergate, Economy, Energy, etc.)
- **AI Opponent**: Three difficulty levels (Easy, Medium, Hard) with strategic AI that competes for momentum and electoral votes

### Visual & Audio
- **CRT TV Aesthetic**: Retro 1976 television interface with scanlines and flicker effects
- **Dynamic State Colors**: States colored by polling data (red/blue/purple shades)
- **News Ticker**: Weekly headlines and opponent action updates
- **Sound Effects**: Immersive audio feedback for actions and state selection
- **Spotify Integration**: Optional 1976-era music playlist integration

## Getting Started

### Prerequisites

- Node.js 18+ and npm

### Installation

1. Clone the repository:
```bash
git clone <repository-url>
cd 1976
```

2. Install dependencies:
```bash
npm install
```

3. Start development server:
```bash
npm run dev
```

4. Build for production:
```bash
npm run build
```

The built files will be in the `dist` directory, ready for deployment.

## Deployment

### Deploying to a Web Server

1. Build the project: `npm run build`
2. Upload all files from the `dist` folder to your web server's public directory
3. Ensure your server is configured to serve `index.html` for all routes (for React Router compatibility)
4. For subdirectory deployments (e.g., `/1976/`), the app automatically handles base URL configuration

### Build Output

The `dist` folder contains:
- `index.html` - Main HTML file
- `assets/` - JavaScript and CSS bundles
- `audio/` - Sound effect files
- All static assets (images, etc.)

## Gameplay

### Starting a Game

1. **Choose Your Candidate**: Select either Jimmy Carter (Democrat) or Gerald Ford (Republican)
2. **Select Difficulty**: Choose Easy (random AI), Medium (strategic AI), or Hard (aggressive strategic AI)
3. **Begin Campaign**: Start with $5M in funds and 6 actions per week

### Weekly Turn Structure

1. **Plan Actions**: Select states and actions for the week
2. **Execute Actions**: Build HQs, launch ads, hold rallies, or fundraise
3. **End Turn**: Process opponent actions, update polling, and advance to next week
4. **Weekly Event**: Respond to a major news event (if topics remain unlocked)

### Campaign Strategy

- **Momentum is Key**: Momentum differential drives poll changes each week
  - Higher momentum converts more undecided voters to your side
  - Large momentum advantages can convert swingable voters from opponent's side
  - Momentum compounds over time - build early advantages
- **HQ Strategy**: Build HQs in key states for weekly momentum boosts
  - Higher level HQs provide more momentum per week
  - HQs also boost voter turnout
- **Ad Campaigns**: Use large campaigns strategically in high-value states
  - Large campaigns provide major momentum boosts
  - Best used when close to winning big states or when you need to leapfrog opponent
- **State Targeting**: Focus on swing states and states where you can gain momentum advantage
  - Big states (10+ electoral votes) are high value
  - States where you're close to winning are prime targets
  - Compete for momentum in states where opponent has advantage

### Win Condition

First candidate to reach **270 electoral votes** wins the election. Electoral votes are projected based on current polling data.

## Technical Details

### Technology Stack
- **Framework**: React 18 + TypeScript
- **Build Tool**: Vite
- **State Management**: GameEngine class with React state hooks
- **Styling**: CSS with retro CRT TV aesthetic
- **Icons**: React Icons

### Key Systems
- **GameEngine**: Core game logic, AI opponent, polling calculations, momentum system
- **Relationship Calculator**: Calculates voter microgroup relationship changes based on topic positions
- **Demographics System**: Detailed voter breakdowns (hardcore, likely, swingable) for each state
- **Polling System**: Dynamic polling updates based on relationships, momentum, and weekly events

### Project Structure

```
src/
├── components/      # React UI components
│   ├── GameInterface.tsx    # Main game interface
│   ├── StateMap.tsx          # Interactive electoral map
│   ├── ActionPanel.tsx       # Campaign action selection
│   ├── StateInfoPanel.tsx    # State detail view
│   └── ...
├── game/           # Game engine and logic
│   ├── GameEngine.ts         # Core game engine
│   └── relationshipCalculator.ts
├── states/         # Individual state data files (50 states + DC)
├── data/           # Game data
│   ├── topics.ts             # 20 campaign topics
│   ├── weeklySongs.ts        # 1976 Billboard songs
│   └── newsHeadlines.ts      # Historical headlines
├── types/          # TypeScript type definitions
├── utils/          # Utility functions
│   ├── demographics.ts       # Demographics calculations
│   ├── sounds.ts             # Sound effect management
│   └── spotify.ts            # Spotify integration
├── App.tsx         # Main app component
└── main.tsx        # Entry point
```

## Development

### Available Scripts

- `npm run dev` - Start development server (http://localhost:5173)
- `npm run build` - Build for production
- `npm run preview` - Preview production build locally
- `npm run lint` - Run ESLint
- `npm test` - Run deterministic simulation and data-integrity tests
- `npm run test:watch` - Run tests in watch mode while developing

### Key Design Decisions

- **Momentum-Driven Polling**: Momentum is the primary driver of poll changes, making it critical for winning states
- **Permanent Topic Positions**: Once you choose a position on a topic, it's locked for the entire campaign
- **Separate Player/Opponent HQs**: Each candidate can have their own HQ in each state, tracked separately
- **Strategic AI**: Medium and Hard difficulties use sophisticated AI that competes for momentum and targets high-value states
- **Historical Accuracy**: State demographics, electoral votes, and historical data based on 1976 election

## License

This project is open source and available for educational purposes.

## Credits

- Historical data based on the 1976 U.S. Presidential Election
- State demographics from 1976 census and election data
- Music integration via Spotify API
