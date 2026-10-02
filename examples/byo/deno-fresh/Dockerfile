# A real Deno Fresh 2 app (Vite, no Tailwind): the scaffolder runs at build time.
FROM denoland/deno:latest
ENV DENO_NO_PROMPT=1
WORKDIR /work
RUN deno run -A jsr:@fresh/init app --force --tailwind=false --vscode=false --docker=false </dev/null
WORKDIR /work/app
# Fresh 2's dev server is Vite: listen beyond loopback (--host) and on the port TDK assigns.
CMD ["sh", "-c", "deno task dev --host 0.0.0.0 --port ${PORT:-5173}"]
