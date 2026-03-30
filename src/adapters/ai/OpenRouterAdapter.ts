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
  public logs: AiLog[] = [];

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
    const response = await this.openai.chat.completions.create({
      model: "openrouter/free",
      messages: [
        {
          role: "system",
          content: "Analiza el mensaje y determina si es una 'NECESIDAD' (un favor que alguien pide) o 'BRAIN' (información para el segundo cerebro). Responde en JSON: { \"type\": \"NECESIDAD\" | \"BRAIN\", \"summary\": \"resumen corto\" }"
        },
        { role: "user", content: text }
      ],
      response_format: { type: "json_object" }
    });

    const body = response.choices[0]?.message?.content || "{}";
    const content = JSON.parse(body);
    const result = {
      type: content.type || "BRAIN",
      summary: content.summary || text.substring(0, 50)
    };

    // Añadir log a la memoria temporal (limitado a 50)
    const newLog: AiLog = {
      id: Math.random().toString(36).substr(2, 9),
      timestamp: new Date().toISOString(),
      input: text,
      output: JSON.stringify(result, null, 2),
      model: response.model || "openrouter/free"
    };
    
    this.logs.unshift(newLog);
    if (this.logs.length > 50) this.logs.pop();

    return result;
  }
}
