// Archivo: src/domain/ports/DatabaseService.ts
export interface Favor {
  id: string;
  user_id: string;
  description: string;
  karma_awarded: number;
  entry_type: 'NECESIDAD' | 'BRAIN';
  status: 'PENDING' | 'COMPLETED';
  completed_by?: string;
  chat_id: string;
  original_input?: string;
  ai_model?: string;
  created_at: string;
}

export interface DatabaseService {
  getUserKarma(userId: string, chatId: string): Promise<number>;
  getUserFavors(userId: string, chatId: string): Promise<Favor[]>;
  getPendingFavors(): Promise<Favor[]>;
  getRecentLogs(limit?: number): Promise<Favor[]>;
  saveFavor(userId: string, description: string, karma: number, type: 'NECESIDAD' | 'BRAIN', originalInput?: string, aiModel?: string, chatId?: string, userName?: string): Promise<void>;
  completeFavor(favorId: string, completedByUserId: string, karmaAwarded: number, chatId: string, userName?: string): Promise<void>;
  getFavorById(favorId: string): Promise<Favor | null>;
  createValidation(pollId: string, favorId: string, userId: string, chatId: string, userName?: string): Promise<void>;
  getValidation(pollId: string): Promise<{ favorId: string, userId: string, chatId: string, userName?: string, yesVotes?: number, noVotes?: number } | null>;
  deleteValidation(pollId: string): Promise<void>;
  getLeaderboard(chatId: string, limit?: number): Promise<{ user_id: string, user_name?: string, karma: number }[]>;
  getGlobalLeaderboard(limit?: number): Promise<{ user_id: string, user_name?: string, karma: number }[]>;
  findUserIdByName(name: string): Promise<string | null>;
  incrementValidationVotes(pollId: string, isYes: boolean): Promise<{ yesVotes: number, noVotes: number } | null>;
}
