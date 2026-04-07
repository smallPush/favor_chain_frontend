// Archivo: src/domain/useCases/FulfillFavor.ts
import type { DatabaseService } from "../ports/DatabaseService";

export class FulfillFavor {
  constructor(private dbService: DatabaseService) {}

  async execute(favorId: string, completedByUserId: string, chatId: string, userName?: string) {
    // Por simplicidad, asignamos 20 de Karma al que hace el favor
    const karmaReward = 20;
    
    await this.dbService.completeFavor(favorId, completedByUserId, karmaReward, chatId, userName);

    return {
      success: true,
      karmaAwarded: karmaReward
    };
  }

  async getPendingFavors() {
    return await this.dbService.getPendingFavors();
  }

  async getFavorById(favorId: string) {
    return await this.dbService.getFavorById(favorId);
  }

  async getValidation(pollId: string) {
    return await this.dbService.getValidation(pollId);
  }

  async incrementValidationVotes(pollId: string, isYes: boolean) {
    return await this.dbService.incrementValidationVotes(pollId, isYes);
  }

  async createValidation(pollId: string, favorId: string, userId: string, chatId: string, userName?: string) {
    await this.dbService.createValidation(pollId, favorId, userId, chatId, userName);
  }

  async resolveValidation(pollId: string, isSuccessful: boolean) {
    const validation = await this.dbService.getValidation(pollId);
    if (!validation) return null;

    if (isSuccessful) {
      await this.execute(validation.favorId, validation.userId, validation.chatId, validation.userName);
    }

    await this.dbService.deleteValidation(pollId);
    return validation;
  }

  async getLeaderboard(chatId: string) {
    return await this.dbService.getLeaderboard(chatId);
  }

  async getGlobalLeaderboard() {
    return await this.dbService.getGlobalLeaderboard();
  }
}
