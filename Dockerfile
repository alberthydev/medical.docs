FROM node:22.22.2-bookworm-slim AS build
WORKDIR /srv
COPY package.json package-lock.json ./
RUN npm ci --no-audit --no-fund
COPY index.html metadata.json vite.config.ts tsconfig.json server.ts ./
COPY src ./src
COPY server ./server
RUN npm run build && npm prune --omit=dev --no-audit --no-fund

FROM node:22.22.2-bookworm-slim
WORKDIR /srv
ENV NODE_ENV=production HOST=0.0.0.0 PORT=3000
COPY --from=build /srv/node_modules ./node_modules
COPY --from=build /srv/dist ./dist
USER node
EXPOSE 3000
CMD ["node", "dist/server.cjs"]
