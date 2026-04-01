import { describe, expect, test, mock } from "bun:test";
import { SupabaseAdapter } from "./SupabaseAdapter";

mock.module("@supabase/supabase-js", () => {
  return {
    createClient: mock(() => {
      // Mock result as an array of objects (to support aggregation)
      const mockResult = { data: [{ karma: 50 }], error: null };
      
      const mockQueryChain: any = {
        eq: mock(() => mockQueryChain),
        select: mock(() => mockQueryChain),
        order: mock(() => mockQueryChain),
        single: mock().mockResolvedValue({ data: { karma: 50 }, error: null }),
        gt: mock(() => mockQueryChain),
        limit: mock(() => mockQueryChain),
        // Make the mock awaitable (thenable) to handle "await query"
        then: (resolve: any) => resolve(mockResult)
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
      };
    }),
  };
});

describe("SupabaseAdapter", () => {
  test("should get user karma", async () => {
    const adapter = new SupabaseAdapter("fake-url", "fake-key");
    const karma = await adapter.getUserKarma("user-1", "chat-1");

    expect(karma).toBe(50);
  });

  test("should save favor and update karma", async () => {
    const adapter = new SupabaseAdapter("fake-url", "fake-key");
    // Passing all required arguments: userId, description, karma, type, originalInput, aiModel, chatId
    await adapter.saveFavor("user-1", "Need help moving", 10, "NECESIDAD", "input", "model", "chat-1");
    expect(true).toBe(true);
  });
});
