FROM oven/bun:alpine AS dev

WORKDIR /app

COPY package.json bun.lock ./
RUN --mount=type=cache,target=/root/.cache/bun \
    bun install --frozen-lockfile

COPY . .

EXPOSE 3000

CMD ["bun", "--hot", "src/index.tsx"]


FROM oven/bun:alpine AS builder

WORKDIR /app

COPY package.json bun.lock ./
RUN --mount=type=cache,target=/root/.cache/bun \
    bun install --frozen-lockfile

COPY . .

ARG BUN_PUBLIC_API_URL
ENV BUN_PUBLIC_API_URL=$BUN_PUBLIC_API_URL

RUN bun run build.ts


FROM oven/bun:alpine AS prod-deps

WORKDIR /app

COPY package.json bun.lock ./
RUN --mount=type=cache,target=/root/.cache/bun \
    bun install --production --frozen-lockfile


FROM oven/bun:alpine

WORKDIR /app

COPY --from=prod-deps /app/node_modules ./node_modules
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/src/prod-server.ts ./src/
COPY --from=builder /app/src/embed ./src/embed
COPY --from=builder /app/src/assets/fonts ./src/assets/fonts

EXPOSE 3000

ENV NODE_ENV=production

CMD ["bun", "src/prod-server.ts"]
