FROM node:22-bookworm-slim AS build
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci --no-audit --no-fund
COPY . .
ENV NEXT_TELEMETRY_DISABLED=1 \
    DATABASE_URL=postgresql://placeholder:placeholder@localhost:5432/placeholder \
    BETTER_AUTH_SECRET=build-only-placeholder-not-a-runtime-secret-please-rotate \
    BETTER_AUTH_URL=http://localhost:3000 \
    APP_URL=http://localhost:3000
RUN npm run build

FROM node:22-bookworm-slim
WORKDIR /app
ENV NODE_ENV=production NEXT_TELEMETRY_DISABLED=1
COPY --from=build --chown=node:node /app/.next/standalone ./
COPY --from=build --chown=node:node /app/.next/static ./.next/static
COPY --from=build --chown=node:node /app/public ./public
COPY --from=build --chown=node:node /app/src/db/migrations ./src/db/migrations
EXPOSE 3000
USER node
CMD ["node", "server.js"]
