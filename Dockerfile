# Stage 1: Build
FROM node:20-slim AS builder

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install all dependencies
RUN npm install

# Copy source and config
COPY . .

# Build TypeScript to JavaScript
RUN npm run build

# Stage 2: Production
FROM node:20-slim

WORKDIR /app

# Copy package files for production install
COPY package*.json ./

# Install only production dependencies
RUN npm install --omit=dev

# Copy the compiled code from the builder stage
COPY --from=builder /app/dist ./dist

# The server requires a .env and the certificate file to run.
# These should be mounted as volumes at runtime for security.
# Example: -v .env:/app/.env -v cert.p12:/app/cert.p12

# Standard entrypoint
ENTRYPOINT ["node", "dist/index.js"]
