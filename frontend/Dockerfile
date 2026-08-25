# Build stage
FROM node:20-alpine AS build

WORKDIR /app

COPY frontend/package.json frontend/package-lock.json* ./
RUN npm ci || npm install --no-fund --no-audit

COPY frontend/ ./
RUN npm run build

# Serve stage
FROM nginx:1.27-alpine

COPY frontend/nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=build /app/dist /usr/share/nginx/html

EXPOSE 80

HEALTHCHECK --interval=30s --timeout=5s CMD wget -qO- http://localhost/ >/dev/null 2>&1 || exit 1
