FROM oven/bun:1.3 AS base
WORKDIR /usr/src/app
WORKDIR /app

FROM base AS install
RUN mkdir -p /temp/dev
COPY package.json bun.lock /temp/dev/
RUN cd /temp/dev && bun install

RUN mkdir -p /temp/prod
COPY package.json bun.lock /temp/prod/
RUN cd /temp/prod && bun install --production

FROM base AS buntime
COPY --from=install /temp/dev/node_modules node_modules
COPY . .
RUN bun run build
ENV NODE_ENV=production

USER bun
EXPOSE 3000/tcp
HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
  CMD wget -qO- http://localhost:3000/ || exit 1
ENV HOSTNAME=0.0.0.0
ENTRYPOINT [ "bun", "run", "start:ci" ]

