import { describe, expect, test, mock, spyOn } from "bun:test";
import { FulfillFavor } from "./FulfillFavor";
import type { DatabaseService } from "../ports/DatabaseService";

describe("FulfillFavor", () => {
  test("execute should complete favor and return karmaAwarded", async () => {
    const mockDbService: DatabaseService = {
      completeFavor: mock(async () => {}),
      getUserKarma: mock(async () => 0),
      getUserFavors: mock(async () => []),
      getPendingFavors: mock(async () => []),
      getRecentLogs: mock(async () => []),
      saveFavor: mock(async () => {}),
      getFavorById: mock(async () => null),
      createValidation: mock(async () => {}),
      getValidation: mock(async () => null),
      deleteValidation: mock(async () => {}),
      getLeaderboard: mock(async () => []),
      getGlobalLeaderboard: mock(async () => []),
      findUserIdByName: mock(async () => null),
      incrementValidationVotes: mock(async () => null),
    };

    const fulfillFavor = new FulfillFavor(mockDbService);
    const result = await fulfillFavor.execute("favor-1", "user-1", "chat-1", "test-user");

    expect(mockDbService.completeFavor).toHaveBeenCalledWith("favor-1", "user-1", 20, "chat-1", "test-user");
    expect(result).toEqual({
      success: true,
      karmaAwarded: 20
    });
  });

  test("getPendingFavors should return pending favors from dbService", async () => {
    const mockDbService = {
      getPendingFavors: mock(async () => [{ id: "favor-1", status: "PENDING" }]),
    } as unknown as DatabaseService;

    const fulfillFavor = new FulfillFavor(mockDbService);
    const result = await fulfillFavor.getPendingFavors();

    expect(mockDbService.getPendingFavors).toHaveBeenCalled();
    expect(result).toEqual([{ id: "favor-1", status: "PENDING" }] as any);
  });

  test("getFavorById should return a favor by id from dbService", async () => {
    const mockDbService = {
      getFavorById: mock(async () => ({ id: "favor-1", status: "PENDING" })),
    } as unknown as DatabaseService;

    const fulfillFavor = new FulfillFavor(mockDbService);
    const result = await fulfillFavor.getFavorById("favor-1");

    expect(mockDbService.getFavorById).toHaveBeenCalledWith("favor-1");
    expect(result).toEqual({ id: "favor-1", status: "PENDING" } as any);
  });

  test("getValidation should return validation from dbService", async () => {
    const mockDbService = {
      getValidation: mock(async () => ({ favorId: "favor-1", userId: "user-1", chatId: "chat-1" })),
    } as unknown as DatabaseService;

    const fulfillFavor = new FulfillFavor(mockDbService);
    const result = await fulfillFavor.getValidation("poll-1");

    expect(mockDbService.getValidation).toHaveBeenCalledWith("poll-1");
    expect(result).toEqual({ favorId: "favor-1", userId: "user-1", chatId: "chat-1" });
  });

  test("incrementValidationVotes should increment votes via dbService", async () => {
    const mockDbService = {
      incrementValidationVotes: mock(async () => ({ yesVotes: 1, noVotes: 0 })),
    } as unknown as DatabaseService;

    const fulfillFavor = new FulfillFavor(mockDbService);
    const result = await fulfillFavor.incrementValidationVotes("poll-1", true);

    expect(mockDbService.incrementValidationVotes).toHaveBeenCalledWith("poll-1", true);
    expect(result).toEqual({ yesVotes: 1, noVotes: 0 });
  });

  test("createValidation should create a validation via dbService", async () => {
    const mockDbService = {
      createValidation: mock(async () => {}),
    } as unknown as DatabaseService;

    const fulfillFavor = new FulfillFavor(mockDbService);
    await fulfillFavor.createValidation("poll-1", "favor-1", "user-1", "chat-1", "test-user");

    expect(mockDbService.createValidation).toHaveBeenCalledWith("poll-1", "favor-1", "user-1", "chat-1", "test-user");
  });

  test("getLeaderboard should return leaderboard for a chat via dbService", async () => {
    const mockDbService = {
      getLeaderboard: mock(async () => [{ user_id: "user-1", karma: 100 }]),
    } as unknown as DatabaseService;

    const fulfillFavor = new FulfillFavor(mockDbService);
    const result = await fulfillFavor.getLeaderboard("chat-1");

    expect(mockDbService.getLeaderboard).toHaveBeenCalledWith("chat-1");
    expect(result).toEqual([{ user_id: "user-1", karma: 100 }]);
  });

  test("getGlobalLeaderboard should return global leaderboard via dbService", async () => {
    const mockDbService = {
      getGlobalLeaderboard: mock(async () => [{ user_id: "user-1", karma: 100 }]),
    } as unknown as DatabaseService;

    const fulfillFavor = new FulfillFavor(mockDbService);
    const result = await fulfillFavor.getGlobalLeaderboard();

    expect(mockDbService.getGlobalLeaderboard).toHaveBeenCalled();
    expect(result).toEqual([{ user_id: "user-1", karma: 100 }]);
  });

  test("resolveValidation should return null if validation is not found", async () => {
    const mockDbService = {
      getValidation: mock(async () => null),
    } as unknown as DatabaseService;

    const fulfillFavor = new FulfillFavor(mockDbService);
    const result = await fulfillFavor.resolveValidation("poll-1", true);

    expect(mockDbService.getValidation).toHaveBeenCalledWith("poll-1");
    expect(result).toBeNull();
  });

  test("resolveValidation should execute favor and delete validation if successful", async () => {
    const validationData = { favorId: "favor-1", userId: "user-1", chatId: "chat-1", userName: "test-user" };
    const mockDbService = {
      getValidation: mock(async () => validationData),
      completeFavor: mock(async () => {}),
      deleteValidation: mock(async () => {}),
    } as unknown as DatabaseService;

    const fulfillFavor = new FulfillFavor(mockDbService);
    const executeSpy = spyOn(fulfillFavor, 'execute');

    const result = await fulfillFavor.resolveValidation("poll-1", true);

    expect(mockDbService.getValidation).toHaveBeenCalledWith("poll-1");
    expect(executeSpy).toHaveBeenCalledWith("favor-1", "user-1", "chat-1", "test-user");
    expect(mockDbService.deleteValidation).toHaveBeenCalledWith("poll-1");
    expect(result).toEqual(validationData);
  });

  test("resolveValidation should only delete validation if not successful", async () => {
    const validationData = { favorId: "favor-1", userId: "user-1", chatId: "chat-1", userName: "test-user" };
    const mockDbService = {
      getValidation: mock(async () => validationData),
      deleteValidation: mock(async () => {}),
    } as unknown as DatabaseService;

    const fulfillFavor = new FulfillFavor(mockDbService);
    const executeSpy = spyOn(fulfillFavor, 'execute');

    const result = await fulfillFavor.resolveValidation("poll-1", false);

    expect(mockDbService.getValidation).toHaveBeenCalledWith("poll-1");
    expect(executeSpy).not.toHaveBeenCalled();
    expect(mockDbService.deleteValidation).toHaveBeenCalledWith("poll-1");
    expect(result).toEqual(validationData);
  });
});
