// Archivo: src/domain/ports/DatabaseService.ts
export interface Favor {
  id?: number;
  description: string;
  karma_awarded: number;
  entry_type: 'NECESIDAD' | 'BRAIN';
  created_at: string;
}

export interface DatabaseService {
  getUserKarma(userId: string): Promise<number>;
  getUserFavors(userId: string): Promise<Favor[]>;
  saveFavor(userId: string, description: string, karma: number, type: 'NECESIDAD' | 'BRAIN'): Promise<void>;
}
