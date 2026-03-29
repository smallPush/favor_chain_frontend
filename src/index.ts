// Archivo: src/index.ts
import { Elysia } from "elysia";
import { OpenRouterAdapter } from "./adapters/ai/OpenRouterAdapter";
import { SupabaseAdapter } from "./adapters/db/SupabaseAdapter";
import { TelegramAdapter } from "./adapters/bot/TelegramAdapter";
import { ProcessUserMessage } from "./domain/useCases/ProcessUserMessage";

// Configuración (Idealmente desde variables de entorno)
const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY || "";
const SUPABASE_URL = process.env.SUPABASE_URL || "";
const SUPABASE_KEY = process.env.SUPABASE_KEY || "";
const TELEGRAM_TOKEN = process.env.TELEGRAM_TOKEN || "";

// 1. Instanciar Adaptadores (Infraestructura)
const aiService = new OpenRouterAdapter(OPENROUTER_API_KEY);
const dbService = new SupabaseAdapter(SUPABASE_URL, SUPABASE_KEY);

// 2. Instanciar Casos de Uso (Dominio)
const processUserMessage = new ProcessUserMessage(aiService, dbService);

// 3. Instanciar Entrypoints (Adaptadores de Entrada)
const bot = new TelegramAdapter(TELEGRAM_TOKEN, processUserMessage);

// 4. Iniciar Bot
bot.start();

// 5. Iniciar Servidor API (ElysiaJS)
new Elysia()
  .post("/verify-subscription", async ({ body }: { body: { userId: string } }) => {
    const karma = await dbService.getUserKarma(body.userId);
    return { userId: body.userId, karma };
  })
  .listen(3000);

console.log("API de FavorChain corriendo en el puerto 3000");
