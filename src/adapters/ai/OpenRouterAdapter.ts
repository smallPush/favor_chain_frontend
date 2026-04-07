// Archivo: src/adapters/ai/OpenRouterAdapter.ts
import OpenAI from "openai";
import type { IAIService } from "../../domain/ports/IAIService";

export interface AiLog {
  id: string;
  timestamp: string;
  input: string;
  output: string;
  model: string;
}

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

  async analyzeMessage(text: string): Promise<{ type: 'NECESIDAD' | 'BRAIN'; summary: string; model: string }> {
    const response = await this.openai.chat.completions.create({
      model: "google/gemini-2.0-flash-lite:free",
      messages: [
        {
          role: "system",
          content: "Analiza el mensaje y determina si es una 'NECESIDAD' (un favor que alguien pide) o 'BRAIN' (información para el segundo cerebro). Responde en JSON: { \"type\": \"NECESIDAD\" | \"BRAIN\", \"summary\": \"resumen corto\" }"
        },
        { role: "user", content: text }
      ]
    });

    let body = response.choices[0]?.message?.content || "{}";
    body = body.replace(/```json/gi, "").replace(/```/g, "").trim();

    let content: any = {};
    try {
      const parsed = JSON.parse(body);
      content = (typeof parsed === "object" && parsed !== null) ? parsed : {};
    } catch (e) {
      console.warn("Failed to parse AI response body:", e);
      content = {};
    }
    const result = {
      type: content.type || "BRAIN",
      summary: content.summary || text.substring(0, 50),
      model: response.model || "google/gemini-1.5-flash"
    };

    return result;
  }
}
