# API image. Build context = repo root:  docker build -f apps/api/Dockerfile .
FROM node:20-slim AS build
WORKDIR /app
COPY package.json ./
COPY packages/shared/package.json packages/shared/
COPY apps/api/package.json apps/api/
RUN npm install
COPY tsconfig.base.json ./
COPY packages/shared packages/shared
COPY apps/api apps/api
RUN npm run build --workspace @onstep/shared \
    && npm run build --workspace @onstep/api

FROM node:20-slim
WORKDIR /app
ENV NODE_ENV=production
COPY --from=build /app/node_modules ./node_modules
COPY --from=build /app/packages ./packages
COPY --from=build /app/apps/api ./apps/api
COPY --from=build /app/package.json ./package.json
EXPOSE 8080
CMD ["node", "apps/api/dist/index.js"]
