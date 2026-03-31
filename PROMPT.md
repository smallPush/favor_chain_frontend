Act as a Senior Backend Engineer expert in TypeScript, Bun, and Hexagonal Architecture.
I am building the MVP for a hackathon called "FavorChain": a Telegram bot and web API that uses AI to match community favors and manage a personal "Second Brain" with a point system (Karma).

THE STACK:
- Environment: Bun
- Web Framework: ElysiaJS
- Telegram: grammy
- AI: OpenRouter (using the official 'openai' SDK on npm)
- Database: Supabase (PostgreSQL)

THE ARCHITECTURE (Hexagonal):
I want you to generate the folder structure and TypeScript code for the following files, strictly separating Domain from Infrastructure:

1. DOMAIN (`src/domain/`):
- `ports/IAIService.ts`: Interface with the method `analyzeMessage(text)`.
- `ports/DatabaseService.ts`: Interface with methods `getUserKarma(userId)` and `saveFavor(userId, description, karma)`.
- `useCases/ProcessUserMessage.ts`: Business logic that receives text, uses AI to detect if it's "NEED" or "BRAIN", and uses the database to add +10 Karma if it's a favor.

2. ADAPTERS (`src/adapters/`):
- `ai/OpenRouterAdapter.ts`: Implements IAIService. VERY IMPORTANT: Use the 'openai' SDK configured for OpenRouter according to its Quickstart:
  baseURL: "https://openrouter.ai/api/v1", defaultHeaders: { "HTTP-Referer": "https://mydomain.com", "X-Title": "FavorChain" }. Use the "google/gemini-1.5-flash" model.
- `db/SupabaseAdapter.ts`: Implements DatabaseService using '@supabase/supabase-js'.
- `bot/TelegramAdapter.ts`: Use 'grammy'. Receives messages and passes them to the use case.

3. ENTRYPOINT (`src/index.ts`):
- The Composition Root. Instantiate the Supabase and OpenRouter adapters, inject them into ProcessUserMessage, start the Telegram bot, and start the ElysiaJS server on port 3000 with a POST `/verify-subscription` endpoint that returns the user's karma.

OUTPUT RULES:
- Return ONLY valid code, separating each file with clear comments including the file path (e.g., `// File: src/domain/ports/IAIService.ts`).
- Do not add long explanations; assume I know how to run it.
