FROM oven/bun:alpine AS builder

WORKDIR /app

COPY package.json bun.lockb* ./
RUN bun install --frozen-lockfile 2>/dev/null || bun install

COPY . .

RUN bun run build.ts


FROM oven/bun:alpine

WORKDIR /app

COPY --from=builder /app/dist ./dist
COPY --from=builder /app/src/prod-server.ts ./src/

EXPOSE 3000

ENV NODE_ENV=production

CMD ["bun", "src/prod-server.ts"]
