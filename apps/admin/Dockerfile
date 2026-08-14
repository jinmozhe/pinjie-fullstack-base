FROM node:24-alpine AS build

WORKDIR /workspace
RUN corepack enable
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY apps/admin/package.json apps/admin/package.json
COPY apps/web/package.json apps/web/package.json
COPY packages packages
RUN pnpm install --frozen-lockfile
COPY apps/admin apps/admin
RUN pnpm --filter @pinjie/admin build

FROM nginx:1.29-alpine AS runtime
COPY apps/admin/nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=build /workspace/apps/admin/dist /usr/share/nginx/html
RUN chown -R nginx:nginx /var/cache/nginx /var/log/nginx /usr/share/nginx/html
USER nginx
EXPOSE 3001
HEALTHCHECK --interval=10s --timeout=3s --start-period=5s --retries=6 CMD ["wget", "--quiet", "--spider", "http://127.0.0.1:3001/healthz"]
