// Archivo: src/adapters/db/SupabaseAdapter.ts
import { createClient, SupabaseClient } from "@supabase/supabase-js";
import type { DatabaseService, Favor } from "../../domain/ports/DatabaseService";

export class SupabaseAdapter implements DatabaseService {
  private client: SupabaseClient;

  constructor(url: string, key: string) {
    this.client = createClient(url, key);
  }

  async getUserKarma(userId: string, chatId: string): Promise<number> {
    const query = this.client
      .from("profiles")
      .select("karma")
      .eq("user_id", userId);
    
    if (chatId !== "global") {
      query.eq("chat_id", chatId);
    }

    const { data, error } = await query;

    if (error) {
      console.error("❌ Error al obtener karma en Supabase:", error.message);
      return 0;
    }

    // Sumar el karma de todos los perfiles encontrados (si es global)
    return (data || []).reduce((sum, row) => sum + (row.karma || 0), 0);
  }

  async getUserFavors(userId: string, chatId: string): Promise<Favor[]> {
    const query = this.client
      .from("favors")
      .select("id, user_id, chat_id, description, karma_awarded, entry_type, status, completed_by, created_at")
      .eq("user_id", userId);
    
    if (chatId !== "global") {
      query.eq("chat_id", chatId);
    }

    const { data, error } = await query
      .order("created_at", { ascending: false });

    if (error) {
      console.error("❌ Error al obtener favores del usuario:", error.message);
      return [];
    }
    return (data as Favor[]) || [];
  }

  async getPendingFavors(): Promise<Favor[]> {
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
    return (data as Favor[]) || [];
  }

  async getRecentLogs(limit: number = 50): Promise<Favor[]> {
    const { data, error } = await this.client
      .from("favors")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(limit);

    if (error) {
      console.error("❌ Error al obtener logs recientes:", error.message);
      return [];
    }
    return (data as Favor[]) || [];
  }

  async saveFavor(userId: string, description: string, karma: number, type: 'NECESIDAD' | 'BRAIN', originalInput?: string, aiModel?: string, chatId?: string, userName?: string): Promise<void> {
    if (!chatId) return; // Karma must be associated with a chat

    const { error } = await this.client.rpc("save_favor_and_update_karma", {
      p_user_id: userId,
      p_chat_id: chatId,
      p_description: description,
      p_karma_awarded: karma,
      p_entry_type: type,
      p_original_input: originalInput || null,
      p_ai_model: aiModel || null,
      p_user_name: userName || null
    });

    if (error) {
      console.error("❌ Error al guardar favor y actualizar karma:", error.message);
      throw new Error(`Fallo guardando favor: ${error.message}`);
    }
  }

  async completeFavor(favorId: string, completedByUserId: string, karmaAwarded: number, chatId: string, userName?: string): Promise<void> {
    const { error } = await this.client.rpc("complete_favor_and_update_karma", {
      p_favor_id: favorId,
      p_completed_by: completedByUserId,
      p_karma_awarded: karmaAwarded,
      p_chat_id: chatId,
      p_user_name: userName || null
    });

    if (error) {
      console.error("❌ Error al completar favor y actualizar karma:", error.message);
      throw new Error(`Fallo completando favor: ${error.message}`);
    }
  }

  async getFavorById(favorId: string): Promise<Favor | null> {
    const { data, error } = await this.client
      .from("favors")
      .select("*")
      .eq("id", favorId)
      .single();

    if (error) {
      console.error("❌ Error al obtener favor por ID:", error.message);
      return null;
    }
    return data as Favor;
  }

  async createValidation(pollId: string, favorId: string, userId: string, chatId: string, userName?: string): Promise<void> {
    const { error } = await this.client
      .from("favor_validations")
      .insert({ poll_id: pollId, favor_id: favorId, user_id: userId, chat_id: chatId, user_name: userName });

    if (error) {
      console.error("❌ Error al crear validación:", error.message);
      throw new Error(`Fallo creando validación: ${error.message}`);
    }
  }

  async getValidation(pollId: string): Promise<{ favorId: string; userId: string; chatId: string; userName?: string; yesVotes?: number; noVotes?: number; } | null> {
    const { data, error } = await this.client
      .from("favor_validations")
      .select("favor_id, user_id, chat_id, user_name, yes_votes, no_votes")
      .eq("poll_id", pollId)
      .single();

    if (error) {
      if (error.code !== "PGRST116") {
        console.error("❌ Error al obtener validación:", error.message);
      }
      return null;
    }

    return {
      favorId: data.favor_id,
      userId: data.user_id,
      chatId: data.chat_id,
      userName: data.user_name,
      yesVotes: data.yes_votes || 0,
      noVotes: data.no_votes || 0
    };
  }

  async incrementValidationVotes(pollId: string, isYes: boolean): Promise<{ yesVotes: number, noVotes: number } | null> {
    const column = isYes ? "yes_votes" : "no_votes";
    
    // Usamos rpc para incremento atómico si existe, o un update simple con el valor actual
    // Para simplificar sin crear nuevos RPCs en el servidor, primero obtenemos y luego actualizamos
    const current = await this.getValidation(pollId);
    if (!current) return null;

    const newValue = isYes ? (current.yesVotes || 0) + 1 : (current.noVotes || 0) + 1;

    const { data, error } = await this.client
      .from("favor_validations")
      .update({ [column]: newValue })
      .eq("poll_id", pollId)
      .select("yes_votes, no_votes")
      .single();

    if (error) {
      console.error("❌ Error al incrementar votos:", error.message);
      return null;
    }

    return {
      yesVotes: data.yes_votes || 0,
      noVotes: data.no_votes || 0
    };
  }

  async deleteValidation(pollId: string): Promise<void> {
    const { error } = await this.client
      .from("favor_validations")
      .delete()
      .eq("poll_id", pollId);

    if (error) {
      console.error("❌ Error al borrar validación:", error.message);
    }
  }

  async getLeaderboard(chatId: string, limit: number = 10): Promise<{ user_id: string; karma: number; }[]> {
    const { data, error } = await this.client
      .from("profiles")
      .select("user_id, karma, user_name")
      .eq("chat_id", chatId)
      .order("karma", { ascending: false })
      .limit(limit);

    if (error) {
      console.error("❌ Error al obtener el ranking:", error.message);
      return [];
    }

    return data || [];
  }

  async getGlobalLeaderboard(limit: number = 10): Promise<{ user_id: string; user_name?: string; karma: number; }[]> {
    // 1. Obtener todos los perfiles que tengan algo de karma
    const { data, error } = await this.client
      .from("profiles")
      .select("user_id, karma, user_name")
      .gt("karma", 0);

    if (error) {
      console.error("❌ Error al obtener ranking global de Supabase:", error.message);
      return [];
    }

    if (!data || data.length === 0) {
      console.log("⚠️ No se han encontrado perfiles con karma positivo.");
      return [];
    }

    // 2. Agrupar por user_id y sumar
    const grouped = data.reduce((acc: any, curr: any) => {
      const uid = String(curr.user_id);
      if (!acc[uid]) {
        acc[uid] = { user_id: uid, user_name: curr.user_name, karma: 0 };
      }
      acc[uid].karma += Number(curr.karma);
      // Priorizar el nickname si está disponible
      if (curr.user_name && !acc[uid].user_name) {
        acc[uid].user_name = curr.user_name;
      }
      return acc;
    }, {});

    // 3. Ordenar y limitar
    const result = Object.values(grouped)
      .sort((a: any, b: any) => b.karma - a.karma)
      .slice(0, limit) as any;

    console.log(`📊 Ranking Global calculado con ${result.length} contribuidores.`);
    return result;
  }

  async findUserIdByName(name: string): Promise<string | null> {
    const { data, error } = await this.client
      .from("profiles")
      .select("user_id, karma")
      .ilike("user_name", `%${name}%`) // Búsqueda flexible parcial, insensible a mayúsculas
      .order("karma", { ascending: false })
      .limit(1);

    if (error || !data || data.length === 0) {
      return null;
    }

    return data[0].user_id;
  }
}
