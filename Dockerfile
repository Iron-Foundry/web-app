FROM oven/bun:alpine

WORKDIR /app

COPY package.json bun.lockb* ./
RUN bun install --frozen-lockfile 2>/dev/null || bun install

COPY . .

EXPOSE 3000

ENV NODE_ENV=production

CMD ["bun", "src/index.tsx"]
