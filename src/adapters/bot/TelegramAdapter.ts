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
        const userName = ctx.from.first_name || "Usuario";
        const chatId = ctx.chat?.id.toString() || "";

        try {
          const favor = await this.fulfillFavor.getFavorById(favorId);
          if (!favor) {
            return ctx.answerCallbackQuery("Error: Favor no encontrado.");
          }

          // Iniciar encuesta de validación
          const poll = await ctx.replyWithPoll(
            `🗳️ ¿Confirmáis que ${userName} ha realizado el favor: "${favor.description}"?`,
            ["✅ Sí, lo ha hecho", "❌ No, aún no"],
            { 
              is_anonymous: false, 
              open_period: 60, // 1 minuto para votar
              reply_to_message_id: ctx.callbackQuery.message?.message_id
            }
          );

          await this.fulfillFavor.createValidation(poll.poll.id, favorId, userId, chatId);
          
          await ctx.answerCallbackQuery("¡Encuesta de validación iniciada!");
          await ctx.editMessageText(`⏳ **Validación en curso**\nEsperando votos para confirmar que "${favor.description}" ha sido completado.`);
        } catch (error) {
          console.error(error);
          await ctx.answerCallbackQuery("Error al iniciar la validación.");
        }
      }
    });

    // Escuchar el cierre de encuestas para procesar resultados
    this.bot.on("poll", async (ctx) => {
      const poll = ctx.poll;
      
      if (poll.is_closed) {
        try {
          const yesVotes = poll.options[0].voter_count;
          const noVotes = poll.options[1].voter_count;
          const isSuccessful = yesVotes > noVotes && yesVotes > 0;

          const validation = await this.fulfillFavor.resolveValidation(poll.id, isSuccessful);
          
          if (validation) {
            if (isSuccessful) {
              await this.bot.api.sendMessage(validation.chatId, `✅ **Favor Validado**\nLa comunidad ha confirmado la tarea. ¡Se han asignado los puntos de Karma!`);
            } else {
              await this.bot.api.sendMessage(validation.chatId, `❌ **Favor no Validado**\nLa encuesta ha terminado sin votos suficientes o con mayoría negativa.`);
            }
          }
        } catch (error) {
          console.error("Error al procesar resultado de encuesta:", error);
        }
      }
    });

    this.bot.on("message:text", async (ctx) => {
      const userId = ctx.from.id.toString();
      const chatId = ctx.chat.id.toString();
      const text = ctx.message.text;

      try {
        const result = await this.processUserMessage.execute(userId, text, chatId);
        
        if (result.type === "NECESIDAD") {
          await ctx.react("🤝");
        } else {
          await ctx.react("👾");
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
