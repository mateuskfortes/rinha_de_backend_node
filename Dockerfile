FROM oven/bun:debian

WORKDIR /usr/src/app

COPY package.json ./
COPY bun.lock ./
COPY src ./

RUN bun install

# Expose the port that the application listens on.
EXPOSE 9999

# Run the application.
CMD bun run main.ts
