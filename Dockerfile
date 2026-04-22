FROM node:24-bookworm-slim AS deps

WORKDIR /app

RUN apt-get update && apt-get install -y --no-install-recommends python3 make g++ && rm -rf /var/lib/apt/lists/*

COPY package.json package-lock.json ./
RUN npm ci

FROM deps AS build-server

COPY tsconfig.json ./
COPY src ./src
RUN npm run build:server

FROM deps AS build-frontend

COPY frontend ./frontend
COPY vite.config.ts ./
RUN npm run build:frontend

FROM node:24-bookworm-slim AS prod-deps

WORKDIR /app

RUN apt-get update && apt-get install -y --no-install-recommends python3 make g++ && rm -rf /var/lib/apt/lists/*

COPY package.json package-lock.json ./
RUN npm ci --omit=dev

FROM node:24-bookworm-slim AS runtime

WORKDIR /app

ENV NODE_ENV=production

COPY package.json ./
COPY --from=prod-deps /app/node_modules ./node_modules
COPY --from=build-server /app/dist ./dist
COPY --from=build-frontend /app/frontend-dist ./frontend-dist

EXPOSE 8080

CMD ["sh", "-c", "npm run start"]
