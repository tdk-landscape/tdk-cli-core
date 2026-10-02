# A real Elysia app from `bun create elysia`: the scaffolder runs at build time.
FROM oven/bun:1
WORKDIR /work
RUN bun create elysia app
WORKDIR /work/app
# The generated app hard-codes `.listen(3000)`; TDK assigns the port through PORT. Patch it, and fail the build if the line is not there.
RUN sed -i 's/\.listen(3000)/.listen(Number(process.env.PORT ?? 3000))/' src/index.ts \
 && grep -q 'process.env.PORT' src/index.ts
# `bun run dev` is `bun run --watch src/index.ts`.
CMD ["bun", "run", "dev"]
