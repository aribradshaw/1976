// Comprehensive game logger to track all actions and their effects for AI analysis

export interface ActionLogEntry {
  week: number;
  actor: 'player' | 'opponent';
  actionType: 'campaign_hq' | 'launch_ads' | 'rally' | 'large_donor_fundraiser' | 'weekly_interview';
  state: string; // 'NATIONAL' for weekly interviews
  topicId?: string;
  position?: 'for' | 'against';
  campaignSize?: 'small' | 'medium' | 'large';
  hqLevel?: number;
  rallyTopics?: string[];
  cost?: number;
  
  // State-specific effects (for state actions)
  stateEffects?: {
    stateAbbrev: string;
    beforePolling: {
      demSupport: number;
      repSupport: number;
      turnout: number;
    };
    afterPolling: {
      demSupport: number;
      repSupport: number;
      turnout: number;
    };
    beforeMomentum: {
      player: number;
      opponent: number;
    };
    afterMomentum: {
      player: number;
      opponent: number;
    };
    relationshipChanges?: Record<string, number>; // microgroup -> change
  }[];
  
  // National effects (for weekly interviews)
  nationalEffects?: {
    beforeRelationships: Record<string, Record<string, number>>; // state -> microgroup -> relationship
    afterRelationships: Record<string, Record<string, number>>;
    impactOnGroups: {
      democrats: number;
      republicans: number;
      independents: number;
    };
  };
  
  timestamp: number;
}

export interface GameStateSnapshot {
  week: number;
  playerElectoralVotes: number;
  opponentElectoralVotes: number;
  playerFunds: number;
  opponentFunds: number;
  stateData: {
    [stateAbbrev: string]: {
      polling: {
        demSupport: number;
        repSupport: number;
        turnout: number;
      };
      momentum: {
        player: number;
        opponent: number;
      };
      relationships: Record<string, number>; // microgroup -> relationship
      activities: {
        player: Array<{ type: string; level?: number; topic?: string }>;
        opponent: Array<{ type: string; level?: number; topic?: string }>;
      };
    };
  };
}

export interface GameLog {
  gameId: string;
  startTime: number;
  endTime?: number;
  difficulty: 'easy' | 'medium' | 'hard';
  playerCandidate: 'democrat' | 'republican';
  actions: ActionLogEntry[];
  weeklySnapshots: GameStateSnapshot[];
  finalResult?: {
    playerWon: boolean;
    playerElectoralVotes: number;
    opponentElectoralVotes: number;
  };
}

class GameLogger {
  private logs: ActionLogEntry[] = [];
  private snapshots: GameStateSnapshot[] = [];
  private gameId: string = '';
  private startTime: number = 0;
  private difficulty: 'easy' | 'medium' | 'hard' = 'medium';
  private playerCandidate: 'democrat' | 'republican' = 'democrat';
  private enabled: boolean = true;

  startGame(difficulty: 'easy' | 'medium' | 'hard', playerCandidate: 'democrat' | 'republican'): void {
    this.gameId = `game_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    this.startTime = Date.now();
    this.difficulty = difficulty;
    this.playerCandidate = playerCandidate;
    this.logs = [];
    this.snapshots = [];
    console.log(`[Game Logger] Started game ${this.gameId} - Difficulty: ${difficulty}, Player: ${playerCandidate}`);
  }

  logAction(entry: Omit<ActionLogEntry, 'timestamp'>): void {
    if (!this.enabled) return;
    
    const logEntry: ActionLogEntry = {
      ...entry,
      timestamp: Date.now(),
    };
    
    this.logs.push(logEntry);
    
    // Log to console for debugging
    console.log(`[Game Log] Week ${entry.week} - ${entry.actor} - ${entry.actionType}${entry.state !== 'NATIONAL' ? ` in ${entry.state}` : ''}:`, {
      topic: entry.topicId,
      position: entry.position,
      campaignSize: entry.campaignSize,
      hqLevel: entry.hqLevel,
      stateEffects: entry.stateEffects?.map(e => ({
        state: e.stateAbbrev,
        pollingChange: {
          dem: e.afterPolling.demSupport - e.beforePolling.demSupport,
          rep: e.afterPolling.repSupport - e.beforePolling.repSupport,
        },
        momentumChange: {
          player: e.afterMomentum.player - e.beforeMomentum.player,
          opponent: e.afterMomentum.opponent - e.beforeMomentum.opponent,
        },
      })),
      nationalEffects: entry.nationalEffects?.impactOnGroups,
    });
  }

  snapshotGameState(week: number, gameState: any): void {
    // This will be called from GameEngine with the full game state
    // We'll implement this when we integrate with GameEngine
  }

  endGame(playerWon: boolean, playerElectoralVotes: number, opponentElectoralVotes: number): void {
    const gameLog: GameLog = {
      gameId: this.gameId,
      startTime: this.startTime,
      endTime: Date.now(),
      difficulty: this.difficulty,
      playerCandidate: this.playerCandidate,
      actions: this.logs,
      weeklySnapshots: this.snapshots,
      finalResult: {
        playerWon,
        playerElectoralVotes,
        opponentElectoralVotes,
      },
    };

    // Export and save to file
    this.exportToFile(gameLog);
    
    console.log(`[Game Logger] Game ended - Player won: ${playerWon}, Player EVs: ${playerElectoralVotes}, Opponent EVs: ${opponentElectoralVotes}`);
  }

  exportToFile(gameLog: GameLog): void {
    const json = JSON.stringify(gameLog, null, 2);
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `game_log_${this.gameId}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    
    console.log(`[Game Logger] Exported game log to ${a.download}`);
  }

  getLogs(): ActionLogEntry[] {
    return [...this.logs];
  }

  getLogsForWeek(week: number): ActionLogEntry[] {
    return this.logs.filter(log => log.week === week);
  }

  getLogsForState(state: string): ActionLogEntry[] {
    return this.logs.filter(log => log.state === state);
  }

  clearLogs(): void {
    this.logs = [];
    this.snapshots = [];
    this.gameId = '';
    this.startTime = 0;
  }

  enable(): void {
    this.enabled = true;
  }

  disable(): void {
    this.enabled = false;
  }

  exportLogs(): string {
    return JSON.stringify({
      gameId: this.gameId,
      startTime: this.startTime,
      difficulty: this.difficulty,
      playerCandidate: this.playerCandidate,
      actions: this.logs,
      snapshots: this.snapshots,
    }, null, 2);
  }
}

export const gameLogger = new GameLogger();
