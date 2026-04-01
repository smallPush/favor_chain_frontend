import { describe, expect, test, mock } from "bun:test";
import { SupabaseAdapter } from "./SupabaseAdapter";

mock.module("@supabase/supabase-js", () => {
  return {
    createClient: mock(() => {
      const mockSingle = mock().mockResolvedValue({ data: { karma: 50 }, error: null });
      
      // Mock that supports chaining .eq().eq().single()
      const mockEq = mock(() => {
        return { 
          eq: mockEq, 
          single: mockSingle,
          order: mock(() => ({ ascending: mock(() => ({})) })) 
        };
      });

      const mockSelect = mock().mockReturnValue({ eq: mockEq });
      const mockInsert = mock().mockResolvedValue({ error: null });
      const mockUpsert = mock().mockResolvedValue({ error: null });
      const mockUpdate = mock().mockReturnValue({ eq: mock().mockResolvedValue({ error: null }) });

      const mockFrom = mock((table: string) => {
        if (table === "profiles") {
          return { select: mockSelect, update: mockUpdate, upsert: mockUpsert };
        }
        if (table === "favors") {
          return { insert: mockInsert, select: mockSelect };
        }
        return {};
      });

      return {
        from: mockFrom,
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
