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

  async saveFavor(userId: string, description: string, karma: number, type: 'NECESIDAD' | 'BRAIN', originalInput?: string, aiModel?: string, chatId?: string, userName?: string): Promise<void> {
    if (!chatId) return; // Karma must be associated with a chat

    const currentKarma = await this.getUserKarma(userId, chatId);

    // Asegurar que el perfil existe (upsert) con el nombre de usuario si se proporciona
    const { error: profileError } = await this.client
      .from("profiles")
      .upsert({ 
        user_id: userId, 
        chat_id: chatId, 
        karma: currentKarma + karma,
        user_name: userName 
      });

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

  async completeFavor(favorId: string, completedByUserId: string, karmaAwarded: number, chatId: string, userName?: string): Promise<void> {
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
      .upsert({ 
        user_id: completedByUserId, 
        chat_id: chatId, 
        karma: currentKarma + karmaAwarded,
        user_name: userName // Guardar/actualizar el nombre si se proporciona
      });

    if (karmaError) {
      console.error("❌ Error al sumar karma al donante:", karmaError.message);
      throw new Error(`Fallo sumando karma: ${karmaError.message}`);
    }
  }

  async getFavorById(favorId: string): Promise<any | null> {
    const { data, error } = await this.client
      .from("favors")
      .select("*")
      .eq("id", favorId)
      .single();

    if (error) {
      console.error("❌ Error al obtener favor por ID:", error.message);
      return null;
    }
    return data;
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

  async getValidation(pollId: string): Promise<{ favorId: string; userId: string; chatId: string; userName?: string; } | null> {
    const { data, error } = await this.client
      .from("favor_validations")
      .select("favor_id, user_id, chat_id, user_name")
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
      userName: data.user_name
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
    // Para el ranking global, sumamos el karma de todas las entradas por user_id
    // Nota: Supabase asume que rpc es mejor para agregaciones complejas, 
    // pero podemos intentar un select agrupado si la API lo permite o usar una vista.
    // Dado que profiles tiene user_id + chat_id como PK, necesitamos sumar.
    
    // Como alternativa sencilla sin RPC: obtener todos y agrupar en JS (si no hay miles)
    const { data, error } = await this.client
      .from("profiles")
      .select("user_id, karma, user_name");

    if (error) {
      console.error("❌ Error al obtener ranking global:", error.message);
      return [];
    }

    const grouped = (data || []).reduce((acc: any, curr: any) => {
      if (!acc[curr.user_id]) {
        acc[curr.user_id] = { user_id: curr.user_id, user_name: curr.user_name, karma: 0 };
      }
      acc[curr.user_id].karma += curr.karma;
      // Priorizar el nombre más reciente si existe
      if (curr.user_name) acc[curr.user_id].user_name = curr.user_name;
      return acc;
    }, {});

    return Object.values(grouped)
      .sort((a: any, b: any) => b.karma - a.karma)
      .slice(0, limit) as any;
  }
}
