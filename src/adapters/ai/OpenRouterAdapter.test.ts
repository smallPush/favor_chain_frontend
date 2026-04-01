import { describe, expect, test, mock } from "bun:test";
import { OpenRouterAdapter } from "./OpenRouterAdapter";
import OpenAI from "openai";

const mockCreate = mock().mockResolvedValue({
  choices: [
    {
      message: {
        content: JSON.stringify({
          type: "NECESIDAD",
          summary: "Need help moving couch",
        }),
      },
    },
  ],
});

// Mock the openAI module using bun's mock.module
mock.module("openai", () => {
  return {
    default: class MockOpenAI {
      chat = {
        completions: {
          create: mockCreate,
        },
      };
    },
  };
});

describe("OpenRouterAdapter", () => {
  test("should analyze message and return NECESIDAD", async () => {
    mockCreate.mockResolvedValueOnce({
      choices: [
        {
          message: {
            content: JSON.stringify({
              type: "NECESIDAD",
              summary: "Need help moving couch",
            }),
          },
        },
      ],
    });
    const adapter = new OpenRouterAdapter("fake-api-key");
    const result = await adapter.analyzeMessage("I need someone to help me move my couch.");

    expect(result).toEqual({
      type: "NECESIDAD",
      summary: "Need help moving couch",
      model: "google/gemini-1.5-flash",
    });
  });

  test("should analyze message and return BRAIN", async () => {
    mockCreate.mockResolvedValueOnce({
      model: "google/gemini-1.5-pro",
      choices: [
        {
          message: {
            content: JSON.stringify({
              type: "BRAIN",
              summary: "A cool fact about space",
            }),
          },
        },
      ],
    });
    const adapter = new OpenRouterAdapter("fake-api-key");
    const result = await adapter.analyzeMessage("Here is a cool fact about space.");

    expect(result).toEqual({
      type: "BRAIN",
      summary: "A cool fact about space",
      model: "google/gemini-1.5-pro",
    });
  });

  test("should handle malformed JSON gracefully", async () => {
    mockCreate.mockResolvedValueOnce({
      choices: [
        {
          message: {
            content: "this is not valid json",
          },
        },
      ],
    });
    const adapter = new OpenRouterAdapter("fake-api-key");
    const result = await adapter.analyzeMessage("I am a test string.");

    expect(result).toEqual({
      type: "BRAIN",
      summary: "I am a test string.",
      model: "google/gemini-1.5-flash",
    });
  });

  test("should handle missing choices/content gracefully", async () => {
    mockCreate.mockResolvedValueOnce({
      choices: [],
    });
    const adapter = new OpenRouterAdapter("fake-api-key");
    const result = await adapter.analyzeMessage("Another test string.");

    expect(result).toEqual({
      type: "BRAIN",
      summary: "Another test string.",
      model: "google/gemini-1.5-flash",
    });
  });
});
