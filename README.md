# FavorChain

**FavorChain** is an AI-powered platform integrated with Telegram Bots to match community needs and manage your personal notes ("Second Brain"). Through this, you earn **Karma** points by helping others.

---

## 🤖 How to Start Using the Telegram Bot

Follow these simple steps from your phone or computer:

### 1. Start the Conversation
1. Open Telegram and search for `@your_bot_username` (the one you created with BotFather).
2. Press the **Start** button or type the command:
   ```text
   /start
   ```
   The bot will welcome you and be ready to listen.

### 2. Save Knowledge (Second Brain)
To save a reminder, an important note, or something you learned, just send it as a normal message: 
> **You:** "Remember that the ElysiaJS framework is very fast and used with Bun."
> **Bot:** "Saved to your Second Brain: ElysiaJS + Bun..."

### 3. Register a Community Favor (Karma)
The bot will automatically detect using AI if the message you just sent is a help you provided to another person. If it's a favor, you'll earn Karma!
> **You:** "Today I helped my neighbor Pedro carry the grocery bags to his apartment."
> **Bot:** "Favor registered: Helping with bags. You've earned 10 Karma points!"

---

## 💻 How to View Your Karma History (Frontend)

The project includes a retro-futuristic dashboard to check all your accumulated points.

1. **Find your Telegram ID:** Your real "User" in the bot is numeric. You can get it by talking to bots like `@userinfobot`. 
2. **Access the Dashboard:**
   Open [http://localhost:5173](http://localhost:5173) in your browser.
3. **Scan/Search your user:**
   Enter your numeric ID in the search bar and you will instantly see the favors you performed and your total Karma glowing on the screen.

---

## 👥 Use in Community Groups (Hackathon)

The true potential of **FavorChain** is unleashed in neighborhood groups, universities, or entire Telegram communities:

1. **Invite the Bot to your Group:** Go to the bot's profile and tap "Add to a Group". Select the community where you want it to act.
2. **Initial Setup:** By default, bots don't read all messages in groups for privacy. If you want the bot to automatically listen and match the community, you must go to **BotFather**, select the bot, go to `Bot Settings` -> `Group Privacy` and set it to **Turn Off "Enable Privacy Mode"**.
3. **Passive Karma:** From then on, when two people talk (e.g., "I'll lend you my notes Juan"), the bot will organically intervene to reward their good deeds without needing to be invoked.

---

## 🚀 Deployment with Docker (Dockploy)

To bring up both environments (Backend and Frontend) in an isolated and professional way, you can use **Docker Compose**:

1. **Configure your environment variables:**  
   Ensure the `.env` file in the root has the keys for Supabase, OpenRouter, and Telegram.

2. **Build and start the containers:**
   ```bash
   docker-compose up --build -d
   ```

3. **Access the applications:**
   - **Frontend (Dashboard):** [http://localhost:5173](http://localhost:5173)
   - **Backend (API):** [http://localhost:3000](http://localhost:3000)

4. **View logs:**
   ```bash
   docker-compose logs -f
   ```

---

## 🛠️ Backend Technical Details

The **FavorChain** central server is designed using **Hexagonal Architecture** (Ports and Adapters) to ensure business logic is independent of external technology.

### Technology Stack
- **Bun**: Ultra-fast TypeScript runtime.
- **ElysiaJS**: High-performance web framework for the API.
- **Supabase (PostgreSQL)**: Persistence for profiles, Karma points, and favors.
- **OpenRouter (OpenAI SDK)**: AI model orchestration (Gemini 1.5 Flash) for natural language analysis.
- **grammY**: Robust framework for Telegram bot interaction.

### Project Structure
- `src/domain/`: Pure business logic and interface definitions (Ports).
- `src/adapters/`: Concrete infrastructure implementations (Supabase, OpenRouter, Telegram).
- `src/index.ts`: Entry point that orchestrates dependency injection and starts the services.

### Development Execution
To run only the backend outside of Docker:

1. **Install dependencies**: `bun install`
2. **Configure .env**: Use `.env.example` as a reference.
3. **Start the server**: `bun run dev`
