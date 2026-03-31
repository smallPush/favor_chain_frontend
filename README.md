# favor_chain_frontend

## Deployment with Dokploy

This application can be easily deployed using [Dokploy](https://dokploy.com/), a lightweight PaaS that simplifies deployment.

### Steps to Deploy

1. **Create an Application in Dokploy**
   - Go to your Dokploy dashboard.
   - Click on **Applications** and then **Create Application**.
   - Give it a name (e.g., `favor-chain-bot`).

2. **Configure the Repository**
   - In the application settings, select the **Git** deployment method.
   - Connect your repository (GitHub, GitLab, etc.).
   - Select the branch you want to deploy (e.g., `main`).

3. **Configure Environment Variables**
   - Navigate to the **Environment** tab in your Dokploy application.
   - Add all the necessary environment variables found in your `.env.example` file:
     - `OPENROUTER_API_KEY`
     - `SUPABASE_URL`
     - `SUPABASE_KEY`
     - `TELEGRAM_TOKEN`
     - `INTERNAL_API_KEY` (if required)

4. **Build Settings**
   - We provide a `Dockerfile` for easy deployment.
   - In the **Build** tab, choose **Dockerfile** as the build type.
   - Dokploy will automatically use the `Dockerfile` at the root of the project to build the image.

5. **Port Configuration**
   - In the **General** tab, ensure the **Port** is set to `3000` (or the port defined in your Elysia app).

6. **Deploy**
   - Click the **Deploy** button.
   - Dokploy will build the Docker image using Bun and start the container.
   - Check the **Logs** tab to ensure the server and bot have started successfully.
