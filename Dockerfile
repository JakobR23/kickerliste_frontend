# Stage 1 — install dependencies and generate static assets
FROM node:20-alpine AS builder
WORKDIR /app

# Enable corepack so Node uses the pnpm version declared in package.json
RUN corepack enable

COPY package.json pnpm-lock.yaml ./
RUN pnpm install --frozen-lockfile

COPY . .
RUN pnpm exec nuxt generate

# Stage 2 — serve with Nginx
# node_modules and source files are discarded; only .output/public/ is copied across
FROM nginx:alpine
COPY --from=builder /app/.output/public /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 80
