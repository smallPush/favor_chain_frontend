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

  private async listFavors(ctx: any) {
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
  }

  private setupHandlers() {
    this.bot.command("start", (ctx) => ctx.reply("¡Bienvenido a FavorChain! Cuéntame qué necesitas o qué quieres guardar en tu cerebro. Usa /favores para ver qué necesitan otros."));

    this.bot.command("favores", async (ctx) => {
      await this.listFavors(ctx);
    });

    this.bot.command("ranking", async (ctx) => {
      const chatId = ctx.chat?.id.toString() || "global";
      try {
        const leaderboard = await this.fulfillFavor.getLeaderboard(chatId);
        
        if (leaderboard.length === 0) {
          return ctx.reply("Aún no hay nadie en el ranking de este grupo. ¡Empieza a realizar favores!");
        }

        let message = "🏆 **Ranking de Karma - FavorChain** 🏆\n\n";
        const medals = ["🥇", "🥈", "🥉"];

        for (let i = 0; i < leaderboard.length; i++) {
          const entry = leaderboard[i];
          const rank = i < 3 ? medals[i] : `${i + 1}.`;
          // Usamos el nombre guardado en DB si existe, si no intentamos obtenerlo o usamos ID
          let name = entry.user_name || entry.user_id;
          
          if (!entry.user_name) {
            try {
              const member = await ctx.getChatMember(parseInt(entry.user_id));
              name = member.user.first_name;
            } catch (e) {
              // Mantener ID como fallback
            }
          }
          
          message += `${rank} **${name}**: ${entry.karma} pts\n`;
        }

        await ctx.reply(message, { parse_mode: "Markdown" });
      } catch (error) {
        console.error("Error al obtener el ranking:", error);
        await ctx.reply("Hubo un error al obtener el ranking.");
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

          await this.fulfillFavor.createValidation(poll.poll.id, favorId, userId, chatId, userName);
          
          await ctx.answerCallbackQuery("¡Encuesta de validación iniciada!");
          await ctx.editMessageText(`⏳ **Validación en curso**\nEsperando votos para confirmar que "${favor.description}" ha sido completado.`);
        } catch (error) {
          console.error(error);
          await ctx.answerCallbackQuery("Error al iniciar la validación.");
        }
      }
    });

    // Escuchar votos individuales para validación en tiempo real (más rápido)
    this.bot.on("poll_answer", async (ctx) => {
      const { poll_id, option_ids } = ctx.pollAnswer;
      const isYes = option_ids.includes(0);

      try {
        const validation = await this.fulfillFavor.getValidation(poll_id);
        if (!validation) return;

        // Registrar el voto y obtener totales actuales
        const totals = await this.fulfillFavor.incrementValidationVotes(poll_id, isYes);
        if (!totals) return;

        // Obtener total de miembros para calcular mayoría
        const memberCount = await ctx.api.getChatMemberCount(validation.chatId);
        // Descontamos al bot y al que pide el favor? No, simplificamos: mayoría de miembros visibles.
        // Si hay 3 personas, el 50% es 1.5, necesitamos 2 votos.
        // Si hay 10 personas, el 50% es 5, necesitamos 6 votos.
        const threshold = Math.floor(memberCount / 2) + 1;

        console.log(`🗳️ Voto en poll ${poll_id}: Yes=${totals.yesVotes}, No=${totals.noVotes}, Threshold=${threshold}`);

        if (totals.yesVotes >= threshold) {
          // ¡Mayoría alcanzada! Completar favor inmediatamente
          const favor = await this.fulfillFavor.getFavorById(validation.favorId);
          if (favor && favor.status === "PENDING") {
            await this.fulfillFavor.resolveValidation(poll_id, true);
            await this.bot.api.sendMessage(validation.chatId, `✅ **Favor Validado por Mayoría** (${totals.yesVotes}/${memberCount})\nLa comunidad ha confirmado la tarea rápidamente. ¡Puntos asignados!`);
            
            // Intentar detener la encuesta para que no sigan votando
            try {
              await this.bot.api.stopPoll(validation.chatId, parseInt(poll_id)); // A veces poll_id no es un int simple en Telegram
            } catch (e) {
              // stopPoll suele requerir message_id, que no tenemos aquí. No es crítico.
            }
          }
        }
      } catch (error) {
        console.error("Error al procesar poll_answer:", error);
      }
    });

    // Escuchar el cierre de encuestas (como fallback o cuando expira el tiempo)
    this.bot.on("poll", async (ctx) => {
      const poll = ctx.poll;
      
      if (poll.is_closed) {
        try {
          const validation = await this.fulfillFavor.getValidation(poll.id);
          if (!validation) return;

          // Si ya se resolvió por mayoría, resolveValidation no hará nada o devolverá null
          const yesVotes = poll.options[0].voter_count;
          const noVotes = poll.options[1].voter_count;
          const isSuccessful = yesVotes > noVotes && yesVotes > 0;

          const result = await this.fulfillFavor.resolveValidation(poll.id, isSuccessful);
          
          if (result) {
            if (isSuccessful) {
              await this.bot.api.sendMessage(validation.chatId, `✅ **Favor Validado** (Tiempo agotado)\nLa comunidad ha confirmado la tarea. ¡Se han asignado los puntos de Karma!`);
            } else {
              await this.bot.api.sendMessage(validation.chatId, `❌ **Favor no Validado**\nLa encuesta ha terminado sin votos suficientes o con mayoría negativa.`);
            }
          }
        } catch (error) {
          console.error("Error al procesar resultado de encuesta final:", error);
        }
      }
    });

    this.bot.on("message:text", async (ctx) => {
      const userId = ctx.from.id.toString();
      const userName = ctx.from.first_name;
      const chatId = ctx.chat?.id?.toString() || "global";
      const text = ctx.message.text;

      // Si mencionan al bot explícitamente
      const botMention = `@${ctx.me.username}`;
      const isMentioned = text.includes(botMention) || ctx.message.entities?.some(e => e.type === "mention");

      if (isMentioned) {
        await ctx.reply("¡Hola! Soy FavorChain, tu asistente de favores y cerebro digital.\n\n" +
          "• **Para pedir un favor:** Escribe lo que necesitas y la IA lo registrará.\n" +
          "• **Para el Cerebro:** Cualquier otra cosa que digas se guardará en tu historial personal.\n" +
          "• **Para ayudar:** Mira la lista de favores abajo y pulsa 'Yo lo hago'.\n\n" +
          "No puedo darte más respuestas por ahora, pero aquí tienes los favores pendientes:");
        
        await this.listFavors(ctx);
        return;
      }

      try {
        const result = await this.processUserMessage.execute(userId, text, chatId, userName);
        
        try {
          if (result.type === "NECESIDAD") {
            await ctx.react("🤝");
          } else {
            await ctx.react("👾");
          }
        } catch (e) {
          // Ignore react errors if the bot lacks permissions
        }
      } catch (error) {
        const errMsg = error instanceof Error ? error.message : String(error);
        const errStack = error instanceof Error ? error.stack : "";
        console.error("❌ Error procesando mensaje de Telegram:");
        console.error("  userId:", userId, "chatId:", chatId);
        console.error("  text:", text);
        console.error("  error:", errMsg);
        console.error("  stack:", errStack);
        await ctx.reply(`Lo siento, hubo un error procesando tu mensaje.\n\n[Debug] ${errMsg}`);
      }
    });
  }

  async start() {
    console.log("Bot de Telegram iniciado...");
    this.bot.start();
  }
}
