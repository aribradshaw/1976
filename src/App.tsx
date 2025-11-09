import { useState } from 'react';
import { GameEngine } from './game/GameEngine';
import { Candidate } from './types/game';
import GameInterface from './components/GameInterface';
import StartScreen from './components/StartScreen';
import './App.css';

function App() {
  const [gameEngine, setGameEngine] = useState<GameEngine | null>(null);
  const [selectedCandidate, setSelectedCandidate] = useState<Candidate | null>(null);

  const startGame = (candidate: Candidate, difficulty: 'easy' | 'medium' | 'hard') => {
    const engine = new GameEngine(candidate, difficulty);
    setGameEngine(engine);
    setSelectedCandidate(candidate);
  };

  const resetGame = () => {
    setGameEngine(null);
    setSelectedCandidate(null);
  };

  if (!gameEngine) {
    return <StartScreen onStart={startGame} />;
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


