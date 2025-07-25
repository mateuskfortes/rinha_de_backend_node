FROM oven/bun:debian

WORKDIR /usr/local/app

COPY package.json ./
COPY bun.lock ./
COPY src ./src/

RUN bun install

# Expose the port that the application listens on.
EXPOSE 8080

# Run the application.
CMD bun run --watch src/main.ts
