const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

export interface Favor {
  id: number;
  description: string;
  karma_awarded: number;
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
