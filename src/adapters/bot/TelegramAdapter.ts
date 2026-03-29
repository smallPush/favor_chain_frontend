// Archivo: src/adapters/bot/TelegramAdapter.ts
import { Bot } from "grammy";
import type { ProcessUserMessage } from "../../domain/useCases/ProcessUserMessage";

export class TelegramAdapter {
  private bot: Bot;

  constructor(token: string, private processUserMessage: ProcessUserMessage) {
    this.bot = new Bot(token);
    this.setupHandlers();
  }

  private setupHandlers() {
    this.bot.command("start", (ctx) => ctx.reply("¡Bienvenido a FavorChain! Cuéntame qué necesitas o qué quieres guardar en tu cerebro."));

    this.bot.on("message:text", async (ctx) => {
      const userId = ctx.from.id.toString();
      const text = ctx.message.text;

      try {
        const result = await this.processUserMessage.execute(userId, text);
        
        if (result.type === "NECESIDAD") {
          await ctx.reply(`Favor registrado: "${result.summary}". ¡Has ganado ${result.karmaAwarded} puntos de Karma!`);
        } else {
          await ctx.reply(`Guardado en tu Second Brain: "${result.summary}".`);
        }
      } catch (error) {
        console.error(error);
        await ctx.reply("Lo siento, hubo un error procesando tu mensaje.");
      }
    });
  }

  async start() {
    console.log("Bot de Telegram iniciado...");
    this.bot.start();
  }
}
