# Use a modern Bun image (compatible with bun.lock v1)
FROM oven/bun:latest as base
WORKDIR /usr/src/app

# Install dependencies separately to leverage Docker cache
COPY package.json bun.lock ./
RUN bun install --frozen-lockfile

# Copy the rest of the application
COPY . .

# Expose port (consistent with src/index.ts)
EXPOSE 3000

# Run the backend
CMD [ "bun", "run", "start" ]
