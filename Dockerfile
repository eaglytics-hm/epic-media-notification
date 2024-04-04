FROM node:20-bookworm-slim as builder

ENV NODE_ENV build

WORKDIR /app

COPY . .

RUN npm ci

RUN npx tsc --project tsconfig.build.json

RUN npm prune --production

# ---

FROM node:20-bookworm-slim

ENV NODE_ENV production

WORKDIR /app

COPY --from=builder /app/package*.json ./
COPY --from=builder /app/node_modules/ ./node_modules/
COPY --from=builder /app/dist/ ./dist/

EXPOSE 8080

CMD ["node", "dist/index.js"]
