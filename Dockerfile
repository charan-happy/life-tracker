# Frontend Vite app
FROM node:20-alpine AS base
WORKDIR /app

ARG GEMINI_API_KEY
ARG VITE_API_BASE_URL
ENV GEMINI_API_KEY=${GEMINI_API_KEY}
ENV VITE_API_BASE_URL=${VITE_API_BASE_URL}

COPY package.json package-lock.json* pnpm-lock.yaml* yarn.lock* ./
RUN npm ci || npm install

COPY . .

# Build static assets
RUN npm run build

# Final image serves built app via Vite preview (simple)
FROM node:20-alpine
WORKDIR /app
ENV NODE_ENV=production
COPY --from=base /app/package.json ./
COPY --from=base /app/node_modules ./node_modules
COPY --from=base /app/dist ./dist
EXPOSE 3000
CMD ["npm", "run", "preview"]
