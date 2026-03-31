# Stage 1: Build the Vite application with Bun
FROM oven/bun:latest as build
WORKDIR /app

# Install dependencies
COPY package.json bun.lock ./
RUN bun install --frozen-lockfile

# Build the app
COPY . .
RUN bun run build

# Stage 2: Serve the build with a lightweight web server (Nginx)
FROM nginx:alpine
COPY --from=build /app/dist /usr/share/nginx/html

# Expose port (consistent with conventional frontend)
EXPOSE 80

# Run Nginx
CMD ["nginx", "-g", "daemon off;"]
