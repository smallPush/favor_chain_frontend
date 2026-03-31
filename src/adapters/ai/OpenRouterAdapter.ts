// Archivo: src/adapters/ai/OpenRouterAdapter.ts
import OpenAI from "openai";
import type { IAIService } from "../../domain/ports/IAIService";

export class OpenRouterAdapter implements IAIService {
  private openai: OpenAI;

  constructor(apiKey: string) {
    this.openai = new OpenAI({
      baseURL: "https://openrouter.ai/api/v1",
      apiKey: apiKey,
      defaultHeaders: {
        "HTTP-Referer": "https://midominio.com",
        "X-Title": "FavorChain",
      }
    });
  }

  async analyzeMessage(text: string): Promise<{ type: 'NECESIDAD' | 'BRAIN'; summary: string }> {
    try {
      const response = await this.openai.chat.completions.create({
        model: "google/gemini-1.5-flash",
        messages: [
          {
            role: "system",
            content: "Analiza el mensaje y determina si es una 'NECESIDAD' (un favor que alguien pide) o 'BRAIN' (información para el segundo cerebro). Responde en JSON: { \"type\": \"NECESIDAD\" | \"BRAIN\", \"summary\": \"resumen corto\" }"
          },
          { role: "user", content: text }
        ],
        response_format: { type: "json_object" }
      });

      const content = JSON.parse(response.choices[0].message.content || "{}");
      return {
        type: content.type || "BRAIN",
        summary: content.summary || text.substring(0, 50)
      };
    } catch (error) {
      console.error("Error analyzing message with OpenRouter:", error);
      return {
        type: "BRAIN",
        summary: text.substring(0, 50)
      };
    }
  }
}
