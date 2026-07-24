# Worker image. Build context = repo root:  docker build -f apps/worker/Dockerfile .
FROM node:20-slim AS build
WORKDIR /app
COPY package.json ./
COPY packages/shared/package.json packages/shared/
COPY apps/worker/package.json apps/worker/
RUN npm install
COPY tsconfig.base.json ./
COPY packages/shared packages/shared
COPY apps/worker apps/worker
RUN npm run build --workspace @onstep/shared \
    && npm run build --workspace @onstep/worker

FROM node:20-slim
WORKDIR /app
ENV NODE_ENV=production
COPY --from=build /app/node_modules ./node_modules
COPY --from=build /app/packages ./packages
COPY --from=build /app/apps/worker ./apps/worker
COPY --from=build /app/package.json ./package.json
CMD ["node", "apps/worker/dist/index.js"]
