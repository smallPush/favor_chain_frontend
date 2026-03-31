import { describe, it, expect, mock, beforeEach } from "bun:test";
import { SupabaseAdapter } from "./SupabaseAdapter";

const mockFrom = mock();
const mockClient = {
  from: mockFrom
};

// Mock createClient from @supabase/supabase-js
mock.module("@supabase/supabase-js", () => {
  return {
    createClient: () => mockClient
  };
});

describe("SupabaseAdapter", () => {
  let adapter: SupabaseAdapter;

  beforeEach(() => {
    mockFrom.mockReset();
    adapter = new SupabaseAdapter("fake_url", "fake_key");
  });

  describe("saveFavor", () => {
    it("should save favor and update karma successfully", async () => {
      // Mock insert favor (success)
      const mockInsert = mock().mockResolvedValue({ error: null });
      // Mock get user karma (success)
      const mockSelect = mock().mockReturnValue({
        eq: mock().mockReturnValue({
          single: mock().mockResolvedValue({ data: { karma: 10 }, error: null })
        })
      });
      // Mock update karma (success)
      const mockUpdate = mock().mockReturnValue({
        eq: mock().mockResolvedValue({ error: null })
      });

      mockFrom.mockImplementation((table: string) => {
        if (table === "favors") return { insert: mockInsert };
        if (table === "profiles") return { select: mockSelect, update: mockUpdate };
        return {};
      });

      await expect(adapter.saveFavor("user1", "did a favor", 5)).resolves.toBeUndefined();

      expect(mockInsert).toHaveBeenCalledWith({ user_id: "user1", description: "did a favor", karma_awarded: 5 });
    });

    it("should throw error if inserting favor fails", async () => {
      const mockInsert = mock().mockResolvedValue({ error: { message: "DB Error" } });

      mockFrom.mockImplementation((table: string) => {
        if (table === "favors") return { insert: mockInsert };
        return {};
      });

      await expect(adapter.saveFavor("user1", "did a favor", 5)).rejects.toThrow("Error saving favor: DB Error");
    });

    it("should throw error if updating profile karma fails", async () => {
      // Mock insert favor (success)
      const mockInsert = mock().mockResolvedValue({ error: null });
      // Mock get user karma (success)
      const mockSelect = mock().mockReturnValue({
        eq: mock().mockReturnValue({
          single: mock().mockResolvedValue({ data: { karma: 10 }, error: null })
        })
      });
      // Mock update karma (fail)
      const mockUpdate = mock().mockReturnValue({
        eq: mock().mockResolvedValue({ error: { message: "Update Error" } })
      });

      mockFrom.mockImplementation((table: string) => {
        if (table === "favors") return { insert: mockInsert };
        if (table === "profiles") return { select: mockSelect, update: mockUpdate };
        return {};
      });

      await expect(adapter.saveFavor("user1", "did a favor", 5)).rejects.toThrow("Error updating profile karma: Update Error");
    });
  });
});
