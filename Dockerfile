FROM node:20-alpine AS builder
WORKDIR /app

# Install build tools (required for some npm packages)
RUN apk add --no-cache python3 make g++

# Copy package manifest(s) first to leverage Docker cache
COPY package.json package-lock.json* ./
COPY bun.lock* ./

# Install all deps (including devDeps needed for build)
RUN npm install --force

# Copy source and build
COPY . .
RUN npm run build

# Runner stage
FROM node:20-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production

# Copy only what's needed to run
COPY --from=builder /app/.next ./.next
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package.json ./package.json
COPY --from=builder /app/public ./public

EXPOSE 3000

HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
  CMD wget -qO- http://localhost:3000/ || exit 1

USER node

# Use the CI start script which runs `next start`
CMD ["npm", "run", "start:ci"]
