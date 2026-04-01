import { describe, expect, test, mock, beforeEach, spyOn, afterEach } from "bun:test";
import { SupabaseAdapter } from "./SupabaseAdapter";

let mockProfilesUpsert = mock().mockResolvedValue({ error: null });
let mockFavorsInsert = mock().mockResolvedValue({ error: null });
let mockProfilesSelect = mock().mockResolvedValue({ data: [{ karma: 50 }], error: null });

const mockQueryChain: any = {
  eq: mock(() => mockQueryChain),
  select: mock(() => mockQueryChain),
  order: mock(() => mockQueryChain),
  single: mock().mockResolvedValue({ data: { karma: 50 }, error: null }),
  gt: mock(() => mockQueryChain),
  limit: mock(() => mockQueryChain),
  then: (resolve: any) => resolve(mockProfilesSelect())
};

mock.module("@supabase/supabase-js", () => {
  return {
    createClient: mock(() => {
      return {
        from: mock((table: string) => {
          if (table === "profiles") {
            return { 
              select: mock(() => mockQueryChain), 
              update: mock(() => mockQueryChain), 
              upsert: mockProfilesUpsert
            };
          }
          if (table === "favors") {
            return { 
              insert: mockFavorsInsert,
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
  beforeEach(() => {
    mockProfilesUpsert.mockClear();
    mockProfilesUpsert.mockResolvedValue({ error: null });

    mockFavorsInsert.mockClear();
    mockFavorsInsert.mockResolvedValue({ error: null });

    mockProfilesSelect.mockClear();
    mockProfilesSelect.mockResolvedValue({ data: [{ karma: 50 }], error: null });
  });

  afterEach(() => {
    mock.restore();
  });

  test("should get user karma", async () => {
    const adapter = new SupabaseAdapter("fake-url", "fake-key");
    const karma = await adapter.getUserKarma("user-1", "chat-1");

    expect(karma).toBe(50);
  });

  describe("saveFavor", () => {
    test("should return early if chatId is not provided", async () => {
      const adapter = new SupabaseAdapter("fake-url", "fake-key");
      const getUserKarmaSpy = spyOn(adapter, "getUserKarma");

      await adapter.saveFavor("user-1", "Need help moving", 10, "NECESIDAD", "input", "model", undefined);

      expect(getUserKarmaSpy).not.toHaveBeenCalled();
      expect(mockProfilesUpsert).not.toHaveBeenCalled();
      expect(mockFavorsInsert).not.toHaveBeenCalled();
    });

    test("should correctly save favor and update karma (happy path)", async () => {
      const adapter = new SupabaseAdapter("fake-url", "fake-key");
      const getUserKarmaSpy = spyOn(adapter, "getUserKarma").mockResolvedValue(50);

      await adapter.saveFavor("user-1", "Need help moving", 10, "NECESIDAD", "input", "model", "chat-1", "JohnDoe");

      expect(getUserKarmaSpy).toHaveBeenCalledWith("user-1", "chat-1");

      expect(mockProfilesUpsert).toHaveBeenCalledWith({
        user_id: "user-1",
        chat_id: "chat-1",
        karma: 60, // 50 (current) + 10 (new)
        user_name: "JohnDoe"
      });

      expect(mockFavorsInsert).toHaveBeenCalledWith({
        user_id: "user-1",
        chat_id: "chat-1",
        description: "Need help moving",
        karma_awarded: 10,
        entry_type: "NECESIDAD",
        status: "PENDING",
        original_input: "input",
        ai_model: "model"
      });
    });

    test("should throw an error if updating profile fails", async () => {
      const adapter = new SupabaseAdapter("fake-url", "fake-key");
      spyOn(adapter, "getUserKarma").mockResolvedValue(50);

      mockProfilesUpsert.mockResolvedValue({ error: { message: "Profile update failed" } });

      expect(
        adapter.saveFavor("user-1", "Need help moving", 10, "NECESIDAD", "input", "model", "chat-1")
      ).rejects.toThrow("Fallo persistiendo perfil: Profile update failed");

      expect(mockProfilesUpsert).toHaveBeenCalled();
      expect(mockFavorsInsert).not.toHaveBeenCalled();
    });

    test("should throw an error if inserting favor fails", async () => {
      const adapter = new SupabaseAdapter("fake-url", "fake-key");
      spyOn(adapter, "getUserKarma").mockResolvedValue(50);

      mockFavorsInsert.mockResolvedValue({ error: { message: "Favor insert failed" } });

      expect(
        adapter.saveFavor("user-1", "Need help moving", 10, "NECESIDAD", "input", "model", "chat-1")
      ).rejects.toThrow("Fallo insertando favor: Favor insert failed");

      expect(mockProfilesUpsert).toHaveBeenCalled();
      expect(mockFavorsInsert).toHaveBeenCalled();
    });
  });
});
