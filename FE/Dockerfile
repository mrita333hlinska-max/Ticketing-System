# Frontend image (presentation tier): build the SPA, then serve it via nginx,
# which also reverse-proxies /api to the backend so the app and API are
# same-origin (session cookies work with no CORS).
FROM node:22-slim AS build

WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci
COPY . .

# Use the real HTTP backend (same-origin /api), not the in-memory dev stub.
ENV VITE_USE_HTTP_API=true
RUN npm run build

FROM nginx:alpine
COPY nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=build /app/dist /usr/share/nginx/html
EXPOSE 80
