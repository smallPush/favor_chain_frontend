import { Elysia, t } from "elysia";
import { cors } from "@elysiajs/cors";
import { OpenRouterAdapter } from "./adapters/ai/OpenRouterAdapter";
import { SupabaseAdapter } from "./adapters/db/SupabaseAdapter";
import { TelegramAdapter } from "./adapters/bot/TelegramAdapter";
import { ProcessUserMessage } from "./domain/useCases/ProcessUserMessage";
import { FulfillFavor } from "./domain/useCases/FulfillFavor";
import { setupDatabase } from "./adapters/db/setupDatabase";

// Configuración
const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY || "";
const SUPABASE_URL = process.env.SUPABASE_URL || "";
const SUPABASE_KEY = process.env.SUPABASE_KEY || "";
const TELEGRAM_TOKEN = process.env.TELEGRAM_TOKEN || "";

console.log("🔍 Depuración de variables:");
console.log("- SUPABASE_URL:", SUPABASE_URL ? "✅ Cargada" : "❌ VACÍA");
console.log("- TELEGRAM_TOKEN:", TELEGRAM_TOKEN ? `✅ Cargada (Empieza por: ${TELEGRAM_TOKEN.substring(0, 5)}...)` : "❌ VACÍA");


// 🗄️ Iniciar Auto-Migración (Desactivado por falta de IPv6 en el servidor/red)
// await setupDatabase();

// 1. Instanciar Adaptadores (Infraestructura)
const aiService = new OpenRouterAdapter(OPENROUTER_API_KEY);
const dbService = new SupabaseAdapter(SUPABASE_URL, SUPABASE_KEY);

// 2. Instanciar Casos de Uso (Dominio)
const processUserMessage = new ProcessUserMessage(aiService, dbService);
const fulfillFavor = new FulfillFavor(dbService);

// 3. Instanciar Entrypoints (Adaptadores de Entrada)
const bot = new TelegramAdapter(TELEGRAM_TOKEN, processUserMessage, fulfillFavor);

// 4. Iniciar Servidor API (ElysiaJS)
const app = new Elysia()
  .use(cors())
  .post("/verify-subscription", async ({ body }) => {
    const karma = await dbService.getUserKarma(body.userId);
    return { userId: body.userId, karma };
  }, {
    body: t.Object({ userId: t.String() })
  })
  .get("/karma/:userId", async ({ params: { userId } }) => {
    const karma = await dbService.getUserKarma(userId);
    const favors = await dbService.getUserFavors(userId);
    return { userId, karma, favors };
  })
  .get("/api/logs", async () => {
    const recentFavors = await dbService.getRecentLogs(50);
    return recentFavors.map(f => ({
      id: f.id,
      timestamp: f.created_at,
      input: f.original_input || f.description,
      output: JSON.stringify({ type: f.entry_type, summary: f.description }),
      model: f.ai_model || "google/gemini-1.5-flash"
    }));
  })
  .listen(3000, ({ hostname, port }) => {
    console.log(`API de FavorChain corriendo en http://${hostname}:${port}`);
  });

// 5. Iniciar Bot
bot.start().catch((err) => {
  console.error("Error al iniciar el Bot de Telegram:", err);
});

process.on("unhandledRejection", (reason, promise) => {
  console.error("Unhandled Rejection at:", promise, "reason:", reason);
});
