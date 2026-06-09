# --- Build stage ---
FROM node:24-alpine AS builder

WORKDIR /app

COPY package*.json ./
RUN npm install --ignore-scripts

COPY tsconfig.json ./
COPY src/ ./src/
COPY public/ ./public/

RUN npm run build

# --- Test stage ---
FROM builder AS test

COPY jest.config.ts tsconfig.test.json ./
COPY tests/ ./tests/

CMD ["npm", "test"]

# --- Runtime stage ---
FROM node:24-alpine AS runtime

ENV NODE_ENV=production

WORKDIR /app

COPY --from=builder /app/package*.json ./
RUN npm ci --omit=dev --ignore-scripts && npm cache clean --force

COPY --from=builder /app/dist ./dist
COPY --from=builder /app/public ./public

EXPOSE 8082

USER node

CMD ["node", "dist/index.js"]
