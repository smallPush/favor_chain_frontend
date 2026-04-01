// Archivo: src/domain/useCases/ProcessUserMessage.ts
import type { IAIService } from "../ports/IAIService";
import type { DatabaseService } from "../ports/DatabaseService";

export class ProcessUserMessage {
  constructor(
    private aiService: IAIService,
    private dbService: DatabaseService
  ) {}

  async execute(userId: string, text: string, chatId?: string) {
    const analysis = await this.aiService.analyzeMessage(text);
    
    let karmaAwarded = 0;
    if (analysis.type === "NECESIDAD") {
      karmaAwarded = 10;
    }

    // Siempre guardar en base de datos, independientemente del tipo
    await this.dbService.saveFavor(userId, analysis.summary, karmaAwarded, analysis.type, text, analysis.model, chatId);

    return {
      type: analysis.type,
      summary: analysis.summary,
      karmaAwarded
    };
  }
}
