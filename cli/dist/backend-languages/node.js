export const NODE_DEV_COMMAND = "node --watch --experimental-strip-types src/index.ts";
export const nodeBackendProvider = {
    id: "node",
    label: "Node.js + Hono",
    devCommand: NODE_DEV_COMMAND,
    watch: ["src/**/*"],
    installHint: "npm install",
    createFiles(name) {
        return [
            {
                filename: "package.json",
                content: `${JSON.stringify({
                    name: `@project/${name}`,
                    version: "0.0.1",
                    type: "module",
                    engines: { node: ">=22.12" },
                    scripts: {
                        dev: NODE_DEV_COMMAND,
                        build: "tsc",
                        start: "node dist/index.js",
                        test: "vitest run",
                    },
                    dependencies: { "@hono/node-server": "^1.13.0", hono: "^4.0.0" },
                    devDependencies: {
                        "@types/node": "^22.0.0",
                        typescript: "^5.6.0",
                        vitest: "^3.0.0",
                    },
                }, null, 2)}\n`,
                description: "Generating package.json",
                emoji: "📦",
            },
            {
                filename: "tsconfig.json",
                content: `${JSON.stringify({
                    compilerOptions: {
                        target: "ES2022",
                        module: "NodeNext",
                        moduleResolution: "NodeNext",
                        strict: true,
                        esModuleInterop: true,
                        skipLibCheck: true,
                        outDir: "./dist",
                        rootDir: "./src",
                    },
                    include: ["src/**/*"],
                    exclude: ["node_modules", "dist"],
                }, null, 2)}\n`,
                description: "Generating tsconfig.json",
                emoji: "⚙️",
            },
            {
                filename: "src/index.ts",
                content: `import { serve } from '@hono/node-server';
import { Hono } from 'hono';

export const app = new Hono();

app.get('/health', (c) => c.json({ status: 'ok', service: '${name}' }));

app.get('/', (c) =>
  c.json({ service: '${name}', version: '1.0.0', endpoints: ['/health'] }),
);

// Importing the app in tests must not open a port.
if (process.env.VITEST === undefined) {
  const port = Number(process.env.PORT ?? 3000);
  serve({ fetch: app.fetch, port });
  console.log(\`🚀 ${name} listening on http://localhost:\${port}\`);
}
`,
                description: "Generating backend source",
                emoji: "💻",
            },
            {
                filename: `tests/${name}.test.ts`,
                content: `import { describe, expect, it } from 'vitest';
import { app } from '../src/index.js';

describe('${name}', () => {
  it('answers /health', async () => {
    const res = await app.request('/health');
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ status: 'ok', service: '${name}' });
  });
});
`,
                description: "Generating test file",
                emoji: "🧪",
            },
            {
                filename: "Dockerfile",
                content: `FROM node:22-slim

WORKDIR /app

RUN apt-get update && apt-get install -y --no-install-recommends curl \\
  && rm -rf /var/lib/apt/lists/*

COPY package.json ./
RUN npm install

COPY . .
RUN npm run build

HEALTHCHECK --interval=10s --timeout=5s --retries=3 \\
  CMD curl -f http://localhost:\${PORT:-3000}/health || exit 1

EXPOSE 3000

CMD ["npm", "run", "dev"]
`,
                description: "Generating Dockerfile",
                emoji: "🐳",
            },
        ];
    },
};
//# sourceMappingURL=node.js.map