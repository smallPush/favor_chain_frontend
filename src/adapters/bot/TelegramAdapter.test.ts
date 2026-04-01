import { describe, expect, test, mock } from "bun:test";
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
      start = mockStart;
    },
  };
});

describe("TelegramAdapter", () => {
  const mockFulfillFavor = {
    getPendingFavors: mock().mockResolvedValue([]),
    execute: mock().mockResolvedValue({ karmaAwarded: 10 }),
  } as any;

  test("should setup handlers and handle start command", async () => {
    // Reset handlers
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
      reply: mock().mockResolvedValue({}),
      react: mock().mockResolvedValue({}),
      from: { id: 123 },
      chat: { id: 123 },
      message: { text: "I need help" },
    };

    await mockMessageHandlers["message:text"](mockCtx);

    expect(mockProcessUserMessage.execute).toHaveBeenCalledWith("123", "I need help", "123");
    expect(mockCtx.react).toHaveBeenCalledWith("🤝");
  });

  test("should handle BRAIN text message", async () => {
    const mockProcessUserMessage = {
      execute: mock().mockResolvedValue({ type: "BRAIN", summary: "App idea", karmaAwarded: 0 }),
    } as unknown as ProcessUserMessage;

    const adapter = new TelegramAdapter("fake-token", mockProcessUserMessage, mockFulfillFavor);

    const mockCtx = {
      reply: mock().mockResolvedValue({}),
      react: mock().mockResolvedValue({}),
      from: { id: 123 },
      chat: { id: 123 },
      message: { text: "App idea" },
    };

    await mockMessageHandlers["message:text"](mockCtx);

    expect(mockProcessUserMessage.execute).toHaveBeenCalledWith("123", "App idea", "123");
    expect(mockCtx.react).toHaveBeenCalledWith("👾");
  });

  test("should handle error in text message", async () => {
    const mockProcessUserMessage = {
      execute: mock().mockRejectedValue(new Error("Test error")),
    } as unknown as ProcessUserMessage;

    const adapter = new TelegramAdapter("fake-token", mockProcessUserMessage, mockFulfillFavor);

    const mockCtx = {
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

    expect(mockCtx.reply).toHaveBeenCalledWith('Lo siento, hubo un error procesando tu mensaje.');
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
});
