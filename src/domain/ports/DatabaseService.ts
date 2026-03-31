// Archivo: src/domain/ports/DatabaseService.ts
export interface Favor {
  id: string;
  user_id: string;
  description: string;
  karma_awarded: number;
  entry_type: 'NECESIDAD' | 'BRAIN';
  status: 'PENDING' | 'COMPLETED';
  completed_by?: string;
  original_input?: string;
  ai_model?: string;
  created_at: string;
}

export interface DatabaseService {
  getUserKarma(userId: string): Promise<number>;
  getUserFavors(userId: string): Promise<Favor[]>;
  getPendingFavors(): Promise<Favor[]>;
  getRecentLogs(limit?: number): Promise<Favor[]>;
  saveFavor(userId: string, description: string, karma: number, type: 'NECESIDAD' | 'BRAIN', originalInput?: string, aiModel?: string): Promise<void>;
  completeFavor(favorId: string, completedByUserId: string, karmaAwarded: number): Promise<void>;
}
