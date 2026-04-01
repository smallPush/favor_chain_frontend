import { describe, expect, test, mock } from "bun:test";
import { ProcessUserMessage } from "./ProcessUserMessage";
import type { IAIService } from "../ports/IAIService";
import type { DatabaseService } from "../ports/DatabaseService";

describe("ProcessUserMessage", () => {
  test("should process NECESIDAD message, award karma and save favor", async () => {
    const mockAiService: IAIService = {
      analyzeMessage: mock(async () => ({ type: "NECESIDAD", summary: "Need help moving" })),
    };

    const mockDbService: DatabaseService = {
      getUserKarma: mock(async () => 0),
      saveFavor: mock(async () => {}),
    };

    const processUserMessage = new ProcessUserMessage(mockAiService, mockDbService);
    const result = await processUserMessage.execute("user-1", "I need help moving my couch", "chat-1");

    expect(mockAiService.analyzeMessage).toHaveBeenCalledWith("I need help moving my couch");
    expect(mockDbService.saveFavor).toHaveBeenCalledWith("user-1", "Need help moving", 10, "NECESIDAD", "I need help moving my couch", undefined, "chat-1", undefined);
    expect(result).toEqual({
      type: "NECESIDAD",
      summary: "Need help moving",
      karmaAwarded: 10,
    });
  });

  test("should process BRAIN message, award no karma but still save favor", async () => {
    const mockAiService: IAIService = {
      analyzeMessage: mock(async () => ({ type: "BRAIN", summary: "Idea for an app" })),
    };

    const mockDbService: DatabaseService = {
      getUserKarma: mock(async () => 0),
      saveFavor: mock(async () => {}),
    };

    const processUserMessage = new ProcessUserMessage(mockAiService, mockDbService);
    const result = await processUserMessage.execute("user-2", "I have a great idea for an app", "chat-2");

    expect(mockAiService.analyzeMessage).toHaveBeenCalledWith("I have a great idea for an app");
    expect(mockDbService.saveFavor).toHaveBeenCalledWith("user-2", "Idea for an app", 0, "BRAIN", "I have a great idea for an app", undefined, "chat-2", undefined);
    expect(result).toEqual({
      type: "BRAIN",
      summary: "Idea for an app",
      karmaAwarded: 0,
    });
  });
});
