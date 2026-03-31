import { describe, it, expect, mock } from "bun:test";
import { OpenRouterAdapter } from "./OpenRouterAdapter";
import OpenAI from "openai";

// Mock the OpenAI module
mock.module("openai", () => {
  return {
    default: class MockOpenAI {
      chat = {
        completions: {
          create: mock().mockImplementation(() => {
            return Promise.resolve({
              choices: [
                {
                  message: {
                    content: "Invalid JSON {",
                  },
                },
              ],
            });
          }),
        },
      };
    },
  };
});

describe("OpenRouterAdapter", () => {
  it("should handle invalid JSON responses gracefully without crashing", async () => {
    // Suppress console.error for the expected error
    const originalConsoleError = console.error;
    console.error = mock();

    const adapter = new OpenRouterAdapter("fake-api-key");
    const text = "A really long text message that should be truncated properly for the summary default value fallback";

    // This should not throw an error
    const result = await adapter.analyzeMessage(text);

    // Should fallback to default values
    expect(result.type).toBe("BRAIN");
    expect(result.summary).toBe(text.substring(0, 50));

    // Verify console.error was called due to JSON parse failure
    expect(console.error).toHaveBeenCalled();

    // Restore console.error
    console.error = originalConsoleError;
  });

  it("should handle missing choices array gracefully", async () => {
    const originalConsoleError = console.error;
    console.error = mock();

    // Re-mock specifically for this test
    mock.module("openai", () => {
      return {
        default: class MockOpenAI {
          chat = {
            completions: {
              create: mock().mockImplementation(() => {
                return Promise.resolve({
                  // Empty choices or missing entirely
                  choices: [],
                });
              }),
            },
          };
        },
      };
    });

    // Re-instantiate to use the new mock
    const adapter = new OpenRouterAdapter("fake-api-key");
    const text = "A really long text message that should be truncated properly for the summary default value fallback";

    const result = await adapter.analyzeMessage(text);

    expect(result.type).toBe("BRAIN");
    expect(result.summary).toBe(text.substring(0, 50));

    console.error = originalConsoleError;
  });
});
