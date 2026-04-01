// Archivo: src/domain/ports/IAIService.ts
export interface IAIService {
  analyzeMessage(text: string): Promise<{ type: 'NECESIDAD' | 'BRAIN'; summary: string; model: string }>;
}
