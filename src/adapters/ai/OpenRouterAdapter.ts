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

// Fallback list of known free models (in preference order)
const FREE_MODEL_FALLBACKS = [
  "qwen/qwen3.6-plus:free",
  "stepfun/step-3.5-flash:free",
  "mistralai/mistral-7b-instruct:free",
  "meta-llama/llama-3.1-8b-instruct:free",
];

export class OpenRouterAdapter implements IAIService {
  private openai: OpenAI;
  private apiKey: string;
  private selectedModel: string | null = null;

  constructor(apiKey: string) {
    this.apiKey = apiKey;
    this.openai = new OpenAI({
      baseURL: "https://openrouter.ai/api/v1",
      apiKey: apiKey,
      defaultHeaders: {
        "HTTP-Referer": "https://midominio.com",
        "X-Title": "FavorChain",
      }
    });
  }

  private async resolveFreeModel(): Promise<string> {
    if (this.selectedModel) return this.selectedModel;

    try {
      const res = await fetch("https://openrouter.ai/api/v1/models", {
        headers: { Authorization: `Bearer ${this.apiKey}` }
      });
      const data = await res.json() as { data: { id: string; pricing: { prompt: string } }[] };
      const freeModels = data.data
        .filter(m => m.id.endsWith(":free") || m.pricing?.prompt === "0")
        .map(m => m.id);

      if (freeModels.length > 0) {
        this.selectedModel = freeModels[0];
        console.log(`✅ OpenRouter free model selected: ${this.selectedModel}`);
        return this.selectedModel;
      }
    } catch (e) {
      console.warn("⚠️ Could not fetch OpenRouter models, using fallback list:", e);
    }

    this.selectedModel = FREE_MODEL_FALLBACKS[0];
    console.log(`✅ OpenRouter fallback model: ${this.selectedModel}`);
    return this.selectedModel;
  }

  async analyzeMessage(text: string): Promise<{ type: 'NECESIDAD' | 'BRAIN'; summary: string; model: string }> {
    const model = await this.resolveFreeModel();

    const response = await this.openai.chat.completions.create({
      model,
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
      model: response.model || model
    };

    return result;
  }
}
