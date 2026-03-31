# FavorChain - Frontend (Dashboard)

This is the web client for **FavorChain**, built with **React**, **TypeScript**, and **Vite**. This is where users can visualize their Karma history and view the AI monitor in real-time.

## 🚀 Technologies

- **React 18**: Library for the user interface.
- **TypeScript**: For safe and typed development.
- **Vite**: Ultra-fast build tool.
- **Tailwind CSS**: For a modern and responsive design.
- **Lucide React**: Elegant icon set.

## 🛠️ Local Development

To run the frontend on your local machine:

1. **Install dependencies:**
   ```bash
   bun install
   ```
   *(You can also use `npm install` if you don't have Bun)*.

2. **Configure environment variables:**
   Create a `.env` file in this folder with your API URL:
   ```text
   VITE_API_URL=http://localhost:3000
   ```

3. **Start development server:**
   ```bash
   bun run dev
   ```
   Open [http://localhost:5173](http://localhost:5173) in your browser.

## 📦 Build for Production

To generate static files ready for deployment:

```bash
bun run build
```

The files will be generated in the `dist/` folder.

## 🐳 Docker

If you prefer using Docker, this project already includes an optimized multi-stage `Dockerfile` that compiles the app and serves it using **Nginx**. Refer to the root README for more details on the full deployment.
