// Game action logger to track all actions and their effects

export interface ActionLogEntry {
  week: number;
  actor: 'player' | 'opponent';
  actionType: string;
  state: string;
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
  relationshipChanges?: Record<string, number>;
  momentumChanges?: {
    player?: number;
    opponent?: number;
  };
  timestamp: number;
}

class GameLogger {
  private logs: ActionLogEntry[] = [];
  private enabled: boolean = true;

  logAction(entry: Omit<ActionLogEntry, 'timestamp'>): void {
    if (!this.enabled) return;
    
    this.logs.push({
      ...entry,
      timestamp: Date.now(),
    });
    
    // Log to console for debugging
    console.log(`[Game Log] Week ${entry.week} - ${entry.actor} - ${entry.actionType} in ${entry.state}:`, {
      before: entry.beforePolling,
      after: entry.afterPolling,
      demChange: entry.afterPolling.demSupport - entry.beforePolling.demSupport,
      repChange: entry.afterPolling.repSupport - entry.beforePolling.repSupport,
      turnoutChange: entry.afterPolling.turnout - entry.beforePolling.turnout,
    });
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
  }

  enable(): void {
    this.enabled = true;
  }

  disable(): void {
    this.enabled = false;
  }

  exportLogs(): string {
    return JSON.stringify(this.logs, null, 2);
  }
}

export const gameLogger = new GameLogger();

