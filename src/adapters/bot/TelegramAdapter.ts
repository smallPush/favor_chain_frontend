import { Bot, InlineKeyboard } from "grammy";
import type { ProcessUserMessage } from "../../domain/useCases/ProcessUserMessage";
import type { FulfillFavor } from "../../domain/useCases/FulfillFavor";

export class TelegramAdapter {
  private bot: Bot;

  constructor(
    token: string, 
    private processUserMessage: ProcessUserMessage,
    private fulfillFavor: FulfillFavor
  ) {
    this.bot = new Bot(token);
    this.setupHandlers();
  }

  private setupHandlers() {
    this.bot.command("start", (ctx) => ctx.reply("¡Bienvenido a FavorChain! Cuéntame qué necesitas o qué quieres guardar en tu cerebro. Usa /favores para ver qué necesitan otros."));

    this.bot.command("favores", async (ctx) => {
      try {
        const favors = await this.fulfillFavor.getPendingFavors();
        
        if (favors.length === 0) {
          return ctx.reply("No hay favores pendientes en este momento. ¡Sé el primero en pedir uno!");
        }

        await ctx.reply("🌟 **Favores Pendientes** 🌟\nAquí tienes lo que otros necesitan:");

        for (const favor of favors) {
          const keyboard = new InlineKeyboard()
            .text("✅ ¡Yo lo hago!", `fulfill_${favor.id}`);
          
          await ctx.reply(`👉 ${favor.description}`, { reply_markup: keyboard });
        }
      } catch (error) {
        console.error(error);
        await ctx.reply("Error al obtener la lista de favores.");
      }
    });

    // Manejar el clic en el botón "Yo lo hago"
    this.bot.on("callback_query:data", async (ctx) => {
      const data = ctx.callbackQuery.data;
      
      if (data.startsWith("fulfill_")) {
        const favorId = data.replace("fulfill_", "");
        const userId = ctx.from.id.toString();

        try {
          const result = await this.fulfillFavor.execute(favorId, userId);
          
          await ctx.answerCallbackQuery("¡Favor completado!");
          await ctx.editMessageText(`✅ **Favor Completado**\nHas ganado ${result.karmaAwarded} puntos de Karma. ¡Gracias por ayudar!`);
        } catch (error) {
          console.error(error);
          await ctx.answerCallbackQuery("Error al completar el favor.");
        }
      }
    });

    this.bot.on("message:text", async (ctx) => {
      const userId = ctx.from.id.toString();
      const text = ctx.message.text;

      try {
        const result = await this.processUserMessage.execute(userId, text);
        
        if (result.type === "NECESIDAD") {
          await ctx.reply(`Favor registrado: "${result.summary}". ¡Has ganado ${result.karmaAwarded} puntos de Karma! Otros usuarios lo verán en /favores.`);
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
