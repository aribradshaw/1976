import { lazy, Suspense, useEffect, useState } from 'react';
import type { GameEngine } from './game/GameEngine';
import { Candidate } from './types/game';
import StartScreen from './components/StartScreen';
import './App.css';
import { CAMPAIGN_SAVE_KEY } from './game/persistence';

const GameInterface = lazy(() => import('./components/GameInterface'));
const DevLogPage = lazy(() => import('./components/DevLogPage'));
const REMOVED_MUSIC_STORAGE_KEYS = ['spotify_token', 'spotify_auth_state', 'spotify_code_verifier'] as const;

function App() {
  const [gameEngine, setGameEngine] = useState<GameEngine | null>(null);
  const [selectedCandidate, setSelectedCandidate] = useState<Candidate | null>(null);
  const [hasSavedGame, setHasSavedGame] = useState(() => localStorage.getItem(CAMPAIGN_SAVE_KEY) !== null);
  const [route, setRoute] = useState(() => window.location.hash);

  useEffect(() => {
    REMOVED_MUSIC_STORAGE_KEYS.forEach(key => localStorage.removeItem(key));
  }, []);

  useEffect(() => {
    const handleHashChange = () => setRoute(window.location.hash);
    window.addEventListener('hashchange', handleHashChange);
    return () => window.removeEventListener('hashchange', handleHashChange);
  }, []);

  const startGame = async (candidate: Candidate, difficulty: 'easy' | 'medium' | 'hard') => {
    localStorage.removeItem(CAMPAIGN_SAVE_KEY);
    const { GameEngine } = await import('./game/GameEngine');
    const engine = new GameEngine(candidate, difficulty);
    setGameEngine(engine);
    setSelectedCandidate(candidate);
  };

  const resumeGame = async () => {
    const saved = localStorage.getItem(CAMPAIGN_SAVE_KEY);
    if (!saved) return;
    try {
      const { GameEngine } = await import('./game/GameEngine');
      const engine = GameEngine.restoreCampaign(saved);
      setGameEngine(engine);
      setSelectedCandidate(engine.getGameState().playerCandidate);
    } catch (error) {
      console.error('Unable to restore campaign save:', error);
      localStorage.removeItem(CAMPAIGN_SAVE_KEY);
      setHasSavedGame(false);
    }
  };

  const resetGame = () => {
    localStorage.removeItem(CAMPAIGN_SAVE_KEY);
    setHasSavedGame(false);
    setGameEngine(null);
    setSelectedCandidate(null);
  };

  if (route === '#/devlog') {
    return (
      <Suspense fallback={<div className="app-loading" role="status">Opening the production log...</div>}>
        <DevLogPage />
      </Suspense>
    );
  }

  if (!gameEngine) {
    return <StartScreen onStart={startGame} onResume={resumeGame} hasSavedGame={hasSavedGame} />;
  }

  return (
    <Suspense fallback={<div className="app-loading" role="status">Preparing the campaign desk...</div>}>
      <GameInterface
        gameEngine={gameEngine}
        playerCandidate={selectedCandidate!}
        onReset={resetGame}
      />
    </Suspense>
  );
}

export default App;


