import { describe, expect, test, mock, afterEach, spyOn } from "bun:test";
import { SupabaseAdapter } from "./SupabaseAdapter";

let mockSupabaseResponse: { data: any; error: any } = { data: [{ karma: 50 }], error: null };

mock.module("@supabase/supabase-js", () => {
  return {
    createClient: mock(() => {
      const mockQueryChain: any = {
        eq: mock(() => mockQueryChain),
        select: mock(() => mockQueryChain),
        order: mock(() => mockQueryChain),
        single: mock().mockImplementation(() => Promise.resolve(mockSupabaseResponse)),
        gt: mock(() => mockQueryChain),
        limit: mock(() => mockQueryChain),
        // Make the mock awaitable (thenable) to handle "await query"
        then: (resolve: any, reject: any) => Promise.resolve(mockSupabaseResponse).then(resolve, reject)
      };

      return {
        from: mock((table: string) => {
          if (table === "profiles") {
            return { 
              select: mock(() => mockQueryChain), 
              update: mock(() => mockQueryChain), 
              upsert: mock().mockResolvedValue({ error: null }) 
            };
          }
          if (table === "favors") {
            return { 
              insert: mock().mockResolvedValue({ error: null }), 
              select: mock(() => mockQueryChain) 
            };
          }
          return mockQueryChain;
        }),
        rpc: mock().mockResolvedValue({ data: null, error: null }),
      };
    }),
  };
});

describe("SupabaseAdapter", () => {
  afterEach(() => {
    // Reset the mock response after each test
    mockSupabaseResponse = { data: [{ karma: 50 }], error: null };
  });

  test("should get user karma", async () => {
    const adapter = new SupabaseAdapter("fake-url", "fake-key");
    const karma = await adapter.getUserKarma("user-1", "chat-1");

    expect(karma).toBe(50);
  });

  test("should return 0 when getUserKarma encounters a database error", async () => {
    const adapter = new SupabaseAdapter("fake-url", "fake-key");
    const consoleErrorSpy = spyOn(console, "error").mockImplementation(() => {});

    // Simulate database error
    mockSupabaseResponse = { data: null, error: { message: "Simulated DB Error" } };

    const karma = await adapter.getUserKarma("error-user-1", "chat-1");

    expect(karma).toBe(0);
    expect(consoleErrorSpy).toHaveBeenCalledWith("❌ Error al obtener karma en Supabase:", "Simulated DB Error");

    consoleErrorSpy.mockRestore();
  });

  test("should save favor and update karma", async () => {
    const adapter = new SupabaseAdapter("fake-url", "fake-key");
    // Passing all required arguments: userId, description, karma, type, originalInput, aiModel, chatId
    await adapter.saveFavor("user-1", "Need help moving", 10, "NECESIDAD", "input", "model", "chat-1");
    expect(true).toBe(true);
  });
});
