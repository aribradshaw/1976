# 1976: Election Simulation Game

A turn-based strategy game simulating the 1976 U.S. Presidential Election between Gerald Ford and Jimmy Carter.

## Features

- **50 States**: Each state has unique demographics, electoral votes, and campaign costs
- **25-Week Campaign**: Navigate a full campaign season with weekly turns
- **Polling System**: States show polling data with 3-10% margin of error for strategic uncertainty
- **Campaign Actions**: Fundraising, media campaigns, events, and surrogate campaigning
- **Dynamic State Colors**: States colored by polling data (red/blue/purple shades)
- **Resource Management**: Manage funds, energy, momentum, and actions per turn

## Getting Started

### Prerequisites

- Node.js 18+ and npm

### Installation

1. Install dependencies:
```bash
npm install
```

2. Start development server:
```bash
npm run dev
```

3. Build for production:
```bash
npm run build
```

The built files will be in the `dist` directory, ready for deployment.

## Deployment

### Deploying to itch.io

1. Build the project: `npm run build`
2. Zip the contents of the `dist` folder
3. Upload to itch.io as an HTML5 game

### Deploying to HostGator

1. Build the project: `npm run build`
2. Upload all files from the `dist` folder to your web server's public directory (usually `public_html` or `www`)
3. Ensure your server is configured to serve `index.html` for all routes (for React Router compatibility)

### Build Output

The `dist` folder contains:
- `index.html` - Main HTML file
- `assets/` - JavaScript and CSS bundles
- All static assets

## Gameplay

1. **Choose Your Candidate**: Start by selecting either Jimmy Carter (Democrat) or Gerald Ford (Republican)
2. **Weekly Turns**: Each week, you have 3 actions to spend
3. **Campaign Actions**:
   - **Fundraising**: Raise money for your campaign (free action)
   - **Media Campaign**: Run TV/radio ads in a state (~$300K)
   - **Campaign Event**: Hold rallies or town halls (~$500K)
   - **Surrogate Campaign**: Send VP or surrogates to campaign (~$150K)
4. **State Management**: Click on any state to view detailed polling information
5. **Win Condition**: First candidate to reach 270 electoral votes wins

## Technical Details

- **Framework**: React 18 + TypeScript
- **Build Tool**: Vite
- **State Management**: GameEngine class with React state
- **Styling**: CSS modules with modern design

## Project Structure

```
src/
├── components/      # React UI components
├── game/           # Game engine and logic
├── states/         # Individual state data files (50 states)
├── types/          # TypeScript type definitions
├── App.tsx         # Main app component
└── main.tsx        # Entry point
```

## Development

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run preview` - Preview production build
- `npm run lint` - Run ESLint

## License

This project is open source and available for educational purposes.


