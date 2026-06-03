# Base stage
FROM node:22.15-bookworm-slim AS base
WORKDIR /app

RUN mkdir -p uploads && chown node:node /app/uploads

COPY package*.json ./

# Development stage
FROM base AS development

RUN --mount=type=cache,target=/root/.npm \
    npm install
COPY . .

CMD ["npm", "run", "dev"]

# Prodcution dependencies
FROM base AS prod-deps
RUN --mount=type=cache,target=/root/.npm \
    npm ci --omit=dev

# Production stage
FROM base AS production

ENV NODE_ENV=production

COPY --from=prod-deps /app/node_modules ./node_modules

COPY . .

USER node

EXPOSE 5000

CMD [ "node", "index.js" ]