// Archivo: src/domain/ports/DatabaseService.ts
export interface DatabaseService {
  getUserKarma(userId: string): Promise<number>;
  saveFavor(userId: string, description: string, karma: number): Promise<void>;
}
