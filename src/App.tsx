import { useState } from 'react';
import { GameEngine } from './game/GameEngine';
import { Candidate } from './types/game';
import GameInterface from './components/GameInterface';
import StartScreen from './components/StartScreen';
import './App.css';
import { CAMPAIGN_SAVE_KEY } from './game/persistence';

function App() {
  const [gameEngine, setGameEngine] = useState<GameEngine | null>(null);
  const [selectedCandidate, setSelectedCandidate] = useState<Candidate | null>(null);
  const [hasSavedGame, setHasSavedGame] = useState(() => localStorage.getItem(CAMPAIGN_SAVE_KEY) !== null);

  const startGame = (candidate: Candidate, difficulty: 'easy' | 'medium' | 'hard') => {
    localStorage.removeItem(CAMPAIGN_SAVE_KEY);
    const engine = new GameEngine(candidate, difficulty);
    setGameEngine(engine);
    setSelectedCandidate(candidate);
  };

  const resumeGame = () => {
    const saved = localStorage.getItem(CAMPAIGN_SAVE_KEY);
    if (!saved) return;
    try {
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

  if (!gameEngine) {
    return <StartScreen onStart={startGame} onResume={resumeGame} hasSavedGame={hasSavedGame} />;
  }

  return (
    <GameInterface 
      gameEngine={gameEngine} 
      playerCandidate={selectedCandidate!}
      onReset={resetGame}
    />
  );
}

export default App;


