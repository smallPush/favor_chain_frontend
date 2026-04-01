import { describe, expect, test, mock } from "bun:test";
import { OpenRouterAdapter } from "./OpenRouterAdapter";
import OpenAI from "openai";

// Mock the openAI module using bun's mock.module
mock.module("openai", () => {
  return {
    default: class MockOpenAI {
      chat = {
        completions: {
          create: mock().mockResolvedValue({
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
          }),
        },
      };
    },
  };
});

describe("OpenRouterAdapter", () => {
  test("should analyze message and return NECESIDAD", async () => {
    const adapter = new OpenRouterAdapter("fake-api-key");
    const result = await adapter.analyzeMessage("I need someone to help me move my couch.");

    expect(result).toEqual({
      type: "NECESIDAD",
      summary: "Need help moving couch",
    });
  });
});
