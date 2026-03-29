// Archivo: src/domain/useCases/ProcessUserMessage.ts
import type { IAIService } from "../ports/IAIService";
import type { DatabaseService } from "../ports/DatabaseService";

export class ProcessUserMessage {
  constructor(
    private aiService: IAIService,
    private dbService: DatabaseService
  ) {}

  async execute(userId: string, text: string) {
    const analysis = await this.aiService.analyzeMessage(text);
    
    let karmaAwarded = 0;
    if (analysis.type === "NECESIDAD") {
      karmaAwarded = 10;
      await this.dbService.saveFavor(userId, analysis.summary, karmaAwarded);
    }

    return {
      type: analysis.type,
      summary: analysis.summary,
      karmaAwarded
    };
  }
}
