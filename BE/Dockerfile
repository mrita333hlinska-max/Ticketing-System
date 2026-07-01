# Backend image (application/API tier).
#
# Debian-slim (glibc) rather than Alpine so the native `argon2` module installs
# from a prebuilt binary with no build toolchain. The container applies pending
# migrations on startup (via src/index.ts) and then serves the API.
FROM node:22-slim

WORKDIR /app

# Install dependencies first for better layer caching. `npm ci` also fetches the
# argon2 prebuilt binary for this platform.
COPY package.json package-lock.json ./
RUN npm ci

# Application source + committed migrations (drizzle/).
COPY . .

ENV NODE_ENV=production
EXPOSE 3000

# `start` runs `tsx src/index.ts`, which migrates then listens.
CMD ["npm", "run", "start"]
