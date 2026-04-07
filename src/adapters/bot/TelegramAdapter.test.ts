import { describe, expect, test, mock, beforeEach } from "bun:test";
import { TelegramAdapter } from "./TelegramAdapter";
import type { ProcessUserMessage } from "../../domain/useCases/ProcessUserMessage";

let mockCommandHandlers: Record<string, Function> = {};
let mockMessageHandlers: Record<string, Function> = {};
let mockStart = mock();

mock.module("grammy", () => {
  return {
    Bot: class MockBot {
      command(cmd: string, handler: Function) {
        mockCommandHandlers[cmd] = handler;
      }
      on(event: string, handler: Function) {
        mockMessageHandlers[event] = handler;
      }
      react = mock();
      api = {
        sendMessage: mock().mockResolvedValue({}),
        stopPoll: mock().mockResolvedValue({}),
      };
      start = mockStart;
      me = { username: "FavorChainBot" };
    },
  };
});

describe("TelegramAdapter", () => {
  const mockFulfillFavor = {
    getPendingFavors: mock().mockResolvedValue([]),
    execute: mock().mockResolvedValue({ karmaAwarded: 10 }),
    getFavorById: mock().mockResolvedValue({ description: "Test favor", status: "PENDING" }),
    createValidation: mock().mockResolvedValue({}),
    getValidation: mock().mockResolvedValue({ favorId: "favor-1", userId: "user-1", chatId: "chat-1" }),
    incrementValidationVotes: mock().mockResolvedValue({ yesVotes: 1, noVotes: 0 }),
    resolveValidation: mock().mockResolvedValue({ chatId: "123" }),
    getLeaderboard: mock().mockResolvedValue([{ user_id: "123", karma: 100 }]),
  } as any;

  beforeEach(() => {
    mockFulfillFavor.resolveValidation.mockClear();
    mockFulfillFavor.incrementValidationVotes.mockClear();
  });

  test("should setup handlers and handle start command", async () => {
    mockCommandHandlers = {};
    mockMessageHandlers = {};

    const mockProcessUserMessage = {
      execute: mock().mockResolvedValue({ type: "NECESIDAD", summary: "Need help", karmaAwarded: 10 }),
    } as unknown as ProcessUserMessage;

    const adapter = new TelegramAdapter("fake-token", mockProcessUserMessage, mockFulfillFavor);

    expect(mockCommandHandlers["start"]).toBeDefined();
    expect(mockMessageHandlers["message:text"]).toBeDefined();

    const mockCtx = {
      reply: mock().mockResolvedValue({}),
      from: { id: 123 },
      chat: { id: 123 },
      message: { text: "Hello" },
    };

    await mockCommandHandlers["start"](mockCtx);
    expect(mockCtx.reply).toHaveBeenCalledWith("¡Bienvenido a FavorChain! Cuéntame qué necesitas o qué quieres guardar en tu cerebro. Usa /favores para ver qué necesitan otros.");
  });

  test("should handle NECESIDAD text message", async () => {
    const mockProcessUserMessage = {
      execute: mock().mockResolvedValue({ type: "NECESIDAD", summary: "Need help", karmaAwarded: 10 }),
    } as unknown as ProcessUserMessage;

    const adapter = new TelegramAdapter("fake-token", mockProcessUserMessage, mockFulfillFavor);

    const mockCtx = {
      me: { username: "FavorChainBot" },
      reply: mock().mockResolvedValue({}),
      react: mock().mockResolvedValue({}),
      from: { id: 123 },
      chat: { id: 123 },
      message: { text: "I need help" },
    };

    await mockMessageHandlers["message:text"](mockCtx);

    expect(mockProcessUserMessage.execute).toHaveBeenCalledWith("123", "I need help", "123", undefined);
    expect(mockCtx.react).toHaveBeenCalledWith("🤝");
  });

  test("should handle bot mention and bypass AI", async () => {
    const mockProcessUserMessage = { execute: mock() } as any;
    const adapter = new TelegramAdapter("fake-token", mockProcessUserMessage, mockFulfillFavor);

    const mockCtx = {
      me: { username: "FavorChainBot" },
      reply: mock().mockResolvedValue({}),
      from: { id: 123 },
      chat: { id: 123 },
      message: { text: "Hey @FavorChainBot help me", entities: [{ type: "mention", offset: 4, length: 14 }] },
    };

    await mockMessageHandlers["message:text"](mockCtx);

    expect(mockCtx.reply).toHaveBeenCalledWith(expect.stringContaining("¡Hola! Soy FavorChain"));
    expect(mockFulfillFavor.getPendingFavors).toHaveBeenCalled();
    expect(mockProcessUserMessage.execute).not.toHaveBeenCalled();
  });

  test("should handle BRAIN text message", async () => {
    const mockProcessUserMessage = {
      execute: mock().mockResolvedValue({ type: "BRAIN", summary: "App idea", karmaAwarded: 0 }),
    } as unknown as ProcessUserMessage;

    const adapter = new TelegramAdapter("fake-token", mockProcessUserMessage, mockFulfillFavor);

    const mockCtx = {
      me: { username: "FavorChainBot" },
      reply: mock().mockResolvedValue({}),
      react: mock().mockResolvedValue({}),
      from: { id: 123 },
      chat: { id: 123 },
      message: { text: "App idea" },
    };

    await mockMessageHandlers["message:text"](mockCtx);

    expect(mockProcessUserMessage.execute).toHaveBeenCalledWith("123", "App idea", "123", undefined);
    expect(mockCtx.react).toHaveBeenCalledWith("👾");
  });

  test("should handle error in text message", async () => {
    const mockProcessUserMessage = {
      execute: mock().mockRejectedValue(new Error("Test error")),
    } as unknown as ProcessUserMessage;

    const adapter = new TelegramAdapter("fake-token", mockProcessUserMessage, mockFulfillFavor);

    const mockCtx = {
      me: { username: "FavorChainBot" },
      reply: mock().mockResolvedValue({}),
      react: mock().mockResolvedValue({}),
      from: { id: 123 },
      chat: { id: 123 },
      message: { text: "App idea" },
    };

    const consoleErrorMock = mock(() => {});
    const originalConsoleError = console.error;
    console.error = consoleErrorMock;

    await mockMessageHandlers["message:text"](mockCtx);

    expect(mockCtx.reply).toHaveBeenCalledWith(expect.stringContaining('Lo siento, hubo un error procesando tu mensaje.'));
    console.error = originalConsoleError;
  });

  test("should call bot start", async () => {
    const mockProcessUserMessage = {
      execute: mock(),
    } as unknown as ProcessUserMessage;

    const adapter = new TelegramAdapter("fake-token", mockProcessUserMessage, mockFulfillFavor);
    await adapter.start();

    expect(mockStart).toHaveBeenCalled();
  });

  test("should handle claim favor callback", async () => {
    const mockProcessUserMessage = {} as any;
    const adapter = new TelegramAdapter("fake-token", mockProcessUserMessage, mockFulfillFavor);

    const mockCtx = {
      callbackQuery: { data: "fulfill_favor-1", message: { message_id: 100 } },
      from: { id: 123, first_name: "TestUser" },
      chat: { id: 123 },
      answerCallbackQuery: mock().mockResolvedValue({}),
      editMessageText: mock().mockResolvedValue({}),
      replyWithPoll: mock().mockResolvedValue({ poll: { id: "poll-1" } }),
    };

    await mockMessageHandlers["callback_query:data"](mockCtx);

    expect(mockFulfillFavor.getFavorById).toHaveBeenCalledWith("favor-1");
    expect(mockCtx.replyWithPoll).toHaveBeenCalled();
    expect(mockFulfillFavor.createValidation).toHaveBeenCalled();
  });

  test("should handle poll resolution when closed", async () => {
    const mockProcessUserMessage = {} as any;
    const adapter = new TelegramAdapter("fake-token", mockProcessUserMessage, mockFulfillFavor);

    const mockCtx = {
      poll: { 
        id: "poll-1", 
        is_closed: true, 
        options: [{ voter_count: 5 }, { voter_count: 0 }] 
      },
      api: {
        sendMessage: mock().mockResolvedValue({}),
      }
    };

    await mockMessageHandlers["poll"](mockCtx);

    expect(mockFulfillFavor.resolveValidation).toHaveBeenCalledWith("poll-1", true);
  });

  test("should handle real-time poll majority", async () => {
    const mockProcessUserMessage = {} as any;
    const adapter = new TelegramAdapter("fake-token", mockProcessUserMessage, mockFulfillFavor);

    const mockCtx = {
      poll: {
        id: "poll-1",
        is_closed: false,
        options: [{ voter_count: 2 }, { voter_count: 0 }], // 2 'Yes' votes
      },
      api: {
        getChatMemberCount: mock().mockResolvedValue(3), // Threshold is 2
        sendMessage: mock().mockResolvedValue({}),
      },
    };

    // Mock resolveValidation to return something so it succeeds
    mockFulfillFavor.resolveValidation.mockResolvedValueOnce({ chatId: "123", favorId: "favor-1", userId: "user-1" });

    await mockMessageHandlers["poll"](mockCtx);

    expect(mockFulfillFavor.resolveValidation).toHaveBeenCalledWith("poll-1", true);
  });
});
