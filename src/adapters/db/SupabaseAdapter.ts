// Archivo: src/adapters/db/SupabaseAdapter.ts
import { createClient, SupabaseClient } from "@supabase/supabase-js";
import type { DatabaseService } from "../../domain/ports/DatabaseService";

export class SupabaseAdapter implements DatabaseService {
  private client: SupabaseClient;

  constructor(url: string, key: string) {
    this.client = createClient(url, key);
  }

  async getUserKarma(userId: string, chatId: string): Promise<number> {
    const { data, error } = await this.client
      .from("profiles")
      .select("karma")
      .eq("user_id", userId)
      .eq("chat_id", chatId)
      .single();

    if (error) {
      if (error.code !== "PGRST116") { // PGRST116 es 'no encontrado'
        console.error("❌ Error al obtener karma en Supabase:", error.message, error.details);
      }
      return 0;
    }
    return data?.karma || 0;
  }

  async getUserFavors(userId: string, chatId: string): Promise<any[]> {
    const { data, error } = await this.client
      .from("favors")
      .select("id, user_id, chat_id, description, karma_awarded, entry_type, status, completed_by, created_at")
      .eq("user_id", userId)
      .eq("chat_id", chatId)
      .order("created_at", { ascending: false });

    if (error) {
      console.error("❌ Error al obtener favores del usuario:", error.message);
      return [];
    }
    return data || [];
  }

  async getPendingFavors(): Promise<any[]> {
    const { data, error } = await this.client
      .from("favors")
      .select("id, user_id, description, karma_awarded, entry_type, status, created_at")
      .eq("status", "PENDING")
      .eq("entry_type", "NECESIDAD")
      .order("created_at", { ascending: true });

    if (error) {
      console.error("❌ Error al obtener favores pendientes:", error.message);
      return [];
    }
    return data || [];
  }

  async getRecentLogs(limit: number = 50): Promise<any[]> {
    const { data, error } = await this.client
      .from("favors")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(limit);

    if (error) {
      console.error("❌ Error al obtener logs recientes:", error.message);
      return [];
    }
    return data || [];
  }

  async saveFavor(userId: string, description: string, karma: number, type: 'NECESIDAD' | 'BRAIN', originalInput?: string, aiModel?: string, chatId?: string): Promise<void> {
    if (!chatId) return; // Karma must be associated with a chat

    const currentKarma = await this.getUserKarma(userId, chatId);

    // Asegurar que el perfil existe (upsert) siempre
    const { error: profileError } = await this.client
      .from("profiles")
      .upsert({ user_id: userId, chat_id: chatId, karma: currentKarma + karma });

    if (profileError) {
      console.error("❌ Error al actualizar el perfil de usuario:", profileError.message);
      throw new Error(`Fallo persistiendo perfil: ${profileError.message}`);
    }

    // Guardar la entrada con su tipo (NECESIDAD o BRAIN)
    const { error: favorError } = await this.client
      .from("favors")
      .insert({ 
        user_id: userId, 
        chat_id: chatId,
        description, 
        karma_awarded: karma, 
        entry_type: type, 
        status: 'PENDING',
        original_input: originalInput,
        ai_model: aiModel
      });

    if (favorError) {
      console.error("❌ Error al insertar el favor:", favorError.message);
      throw new Error(`Fallo insertando favor: ${favorError.message}`);
    }
  }

  async completeFavor(favorId: string, completedByUserId: string, karmaAwarded: number, chatId: string): Promise<void> {
    // 1. Marcar el favor como completado
    const { error: updateError } = await this.client
      .from("favors")
      .update({ status: 'COMPLETED', completed_by: completedByUserId })
      .eq("id", favorId);

    if (updateError) {
      console.error("❌ Error al completar el favor en BD:", updateError.message);
      throw new Error(`Fallo completando favor: ${updateError.message}`);
    }

    // 2. Darle el karma al usuario que lo ha hecho
    const currentKarma = await this.getUserKarma(completedByUserId, chatId);
    const { error: karmaError } = await this.client
      .from("profiles")
      .upsert({ user_id: completedByUserId, chat_id: chatId, karma: currentKarma + karmaAwarded });

    if (karmaError) {
      console.error("❌ Error al sumar karma al donante:", karmaError.message);
      throw new Error(`Fallo sumando karma: ${karmaError.message}`);
    }
  }
}
