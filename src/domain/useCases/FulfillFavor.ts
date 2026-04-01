// Archivo: src/domain/useCases/FulfillFavor.ts
import type { DatabaseService } from "../ports/DatabaseService";

export class FulfillFavor {
  constructor(private dbService: DatabaseService) {}

  async execute(favorId: string, completedByUserId: string, chatId: string) {
    // Por simplicidad, asignamos 20 de Karma al que hace el favor
    const karmaReward = 20;
    
    await this.dbService.completeFavor(favorId, completedByUserId, karmaReward, chatId);

    return {
      success: true,
      karmaAwarded: karmaReward
    };
  }

  async getPendingFavors() {
    return await this.dbService.getPendingFavors();
  }
}
