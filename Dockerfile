# Stage 1: Dependencies and Build
FROM node:22-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

# Stage 2: Production Runner
FROM node:22-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production
ENV PORT=3000

# Install only production deps — the server bundle externalises node_modules
# (esbuild --packages=external), so express/jose/cookie/etc. are needed at runtime.
COPY package*.json ./
RUN npm ci --omit=dev

# Built client (dist/public) + bundled server (dist/index.js)
COPY --from=builder /app/dist ./dist

# Seed gallery images. The named volume (see compose) initialises from this on
# first run, then persists uploads/deletes across restarts and redeploys.
COPY uploads ./uploads

EXPOSE 3000
CMD ["node", "dist/index.js"]
