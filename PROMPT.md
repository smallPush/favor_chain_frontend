Actúa como un Senior Backend Engineer experto en TypeScript, Bun y Arquitectura Hexagonal.
Estoy construyendo el MVP para una hackaton llamado "FavorChain": un bot de Telegram y API web que usa IA para emparejar favores comunitarios y gestionar un "Second Brain" personal con un sistema de puntos (Karma).

EL STACK:
- Entorno: Bun
- Web Framework: ElysiaJS
- Telegram: grammy
- IA: OpenRouter (usando el SDK oficial de 'openai' en npm)
- Base de Datos: Supabase (PostgreSQL)

LA ARQUITECTURA (Hexagonal):
Quiero que generes la estructura de carpetas y el código TypeScript para los siguientes archivos, separando estrictamente el Dominio de la Infraestructura:

1. DOMINIO (`src/domain/`):
- `ports/IAIService.ts`: Interfaz con el método `analyzeMessage(text)`.
- `ports/DatabaseService.ts`: Interfaz con métodos `getUserKarma(userId)` y `saveFavor(userId, description, karma)`.
- `useCases/ProcessUserMessage.ts`: La lógica de negocio que recibe el texto, usa la IA para detectar si es "NECESIDAD" o "BRAIN", y usa la base de datos para sumar +10 de Karma si es un favor.

2. ADAPTADORES (`src/adapters/`):
- `ai/OpenRouterAdapter.ts`: Implementa IAIService. MUY IMPORTANTE: Usa el SDK de 'openai' configurado para OpenRouter según su Quickstart:
  baseURL: "https://openrouter.ai/api/v1", defaultHeaders: { "HTTP-Referer": "https://midominio.com", "X-Title": "FavorChain" }. Usa el modelo "google/gemini-1.5-flash".
- `db/SupabaseAdapter.ts`: Implementa DatabaseService usando '@supabase/supabase-js'.
- `bot/TelegramAdapter.ts`: Usa 'grammy'. Recibe mensajes y los pasa al caso de uso.

3. ENTRYPOINT (`src/index.ts`):
- El Composition Root. Instancia los adaptadores de Supabase y OpenRouter, inyéctalos en el ProcessUserMessage, arranca el bot de Telegram y levanta el servidor de ElysiaJS en el puerto 3000 con un endpoint POST `/verify-subscription` que devuelva el karma del usuario.

REGLAS DE SALIDA:
- Devuelve SOLO código válido, separando cada archivo con comentarios claros con la ruta del archivo (ej. `// Archivo: src/domain/ports/IAIService.ts`).
- No añadas explicaciones largas, asume que sé cómo ejecutarlo.
