# Base stage
FROM node:22.15-bookworm-slim AS base

WORKDIR /app

COPY package*.json .

# Development stage
FROM base AS development

RUN --mount=type=cache,target=/root/.npm \
    npm install

COPY . .

CMD ["npm", "run", "dev" ]

# Builder stage
FROM base AS builder

RUN --mount=type=cache,target=/root/.npm \
    npm ci

COPY . .

ENV NODE_ENV=production
RUN npm run build

# Production stage
FROM nginxinc/nginx-unprivileged:alpine AS production

COPY ./nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=builder /app/dist /usr/share/nginx/html

EXPOSE 8080

CMD ["nginx", "-g", "daemon off;"]
