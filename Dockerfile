# Base Node.js image
FROM node:20-alpine AS build

WORKDIR /app

# Copy root, Backend, and Frontend manifests
COPY package.json ./
COPY Backend/package*.json ./Backend/
COPY Frontend/package*.json ./Frontend/

# Install dependencies
RUN npm --prefix Backend install --omit=dev
RUN npm --prefix Frontend install

# Copy application source code
COPY . .

# Build the Frontend static bundle
RUN npm --prefix Frontend run build

# Production runtime stage
FROM node:20-alpine AS runtime

WORKDIR /app

ENV NODE_ENV=production
ENV PORT=5000

COPY --from=build /app/Backend ./Backend
COPY --from=build /app/Frontend/dist ./Frontend/dist
COPY --from=build /app/package.json ./package.json

EXPOSE 5000

CMD ["node", "Backend/server.js"]
