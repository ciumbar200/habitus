FROM node:22-alpine AS manifests
WORKDIR /workspace
COPY package.json package-lock.json ./
COPY packages/habitus-core/package.json packages/habitus-core/package.json
COPY habitus-app/package.json habitus-app/package.json

FROM manifests AS build
RUN npm ci
COPY packages/habitus-core packages/habitus-core
COPY habitus-app habitus-app
WORKDIR /workspace/habitus-app
RUN npm run build:coolify

FROM manifests AS production-dependencies
ENV NODE_ENV=production
RUN npm ci --omit=dev && npm cache clean --force

FROM node:22-alpine AS runtime
ENV NODE_ENV=production \
    HOST=0.0.0.0 \
    PORT=3000
WORKDIR /app
COPY --from=production-dependencies /workspace/node_modules ./node_modules
COPY --from=build /workspace/habitus-app/dist ./dist
COPY --from=build /workspace/habitus-app/server-dist ./server-dist
USER node
EXPOSE 3000
HEALTHCHECK --interval=30s --timeout=5s --start-period=20s --retries=3 \
  CMD node -e "fetch('http://127.0.0.1:3000/healthz').then(r=>{if(!r.ok)process.exit(1)}).catch(()=>process.exit(1))"
CMD ["node", "server-dist/server.mjs"]
