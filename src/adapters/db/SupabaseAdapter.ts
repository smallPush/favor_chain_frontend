// Archivo: src/adapters/db/SupabaseAdapter.ts
import { createClient, SupabaseClient } from "@supabase/supabase-js";
import type { DatabaseService } from "../../domain/ports/DatabaseService";

export class SupabaseAdapter implements DatabaseService {
  private client: SupabaseClient;

  constructor(url: string, key: string) {
    this.client = createClient(url, key);
  }

  async getUserKarma(userId: string): Promise<number> {
    const { data, error } = await this.client
      .from("profiles")
      .select("karma")
      .eq("user_id", userId)
      .single();

    if (error || !data) return 0;
    return data.karma;
  }

  async getUserFavors(userId: string): Promise<any[]> {
    const { data, error } = await this.client
      .from("favors")
      .select("id, description, karma_awarded, entry_type, created_at")
      .eq("user_id", userId)
      .order("created_at", { ascending: false });

    if (error || !data) return [];
    return data;
  }

  async saveFavor(userId: string, description: string, karma: number, type: 'NECESIDAD' | 'BRAIN'): Promise<void> {
    const currentKarma = await this.getUserKarma(userId);

    // Asegurar que el perfil existe (upsert) siempre
    await this.client
      .from("profiles")
      .upsert({ user_id: userId, karma: currentKarma + karma });

    // Guardar la entrada con su tipo (NECESIDAD o BRAIN)
    await this.client
      .from("favors")
      .insert({ user_id: userId, description, karma_awarded: karma, entry_type: type });
  }
}
