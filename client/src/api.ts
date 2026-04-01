const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

export interface Favor {
  id: number;
  description: string;
  karma_awarded: number;
  entry_type: 'NECESIDAD' | 'BRAIN';
  created_at: string;
}

export interface KarmaResponse {
  userId: string;
  karma: number;
  favors: Favor[];
}

export const getKarmaHistory = async (userId: string): Promise<KarmaResponse> => {
  const response = await fetch(`${API_URL}/karma/${userId}`);
  if (!response.ok) {
    throw new Error('Error de red o usuario no encontrado');
  }
  return response.json();
};

export interface AiLog {
  id: string;
  timestamp: string;
  input: string;
  output: string;
  model: string;
}

export interface RankingEntry {
  user_id: string;
  user_name?: string;
  karma: number;
}

export const getAiLogs = async (): Promise<AiLog[]> => {
  const response = await fetch(`${API_URL}/api/logs`);
  if (!response.ok) return [];
  return response.json();
};

export const getRanking = async (): Promise<RankingEntry[]> => {
  const response = await fetch(`${API_URL}/api/ranking`);
  if (!response.ok) return [];
  return response.json();
};
