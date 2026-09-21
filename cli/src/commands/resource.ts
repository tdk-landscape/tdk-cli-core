import { existsSync, mkdirSync } from "node:fs";
import { isAbsolute, relative, resolve } from "node:path";
import chalk from "chalk";
import { Command } from "commander";
import { hasDddLicense } from "../generator/extension-fetch.js";
import type { CreatableResourceType, FileGenerationTask } from "../types/index.js";
import { CREATABLE_RESOURCE_TYPES } from "../types/index.js";
import { assertValid, confirmOrCancel } from "../utils/command-helpers.js";
import { errorFactories, requireProjectRoot, runCommand } from "../utils/errors.js";
import { writeFilesWithProgress } from "../utils/file-helpers.js";
import { showCommandHeader } from "../utils/formatting.js";
import { assignPort } from "../utils/port-assignment.js";
import { promptSelect, promptText } from "../utils/prompt.js";
import { getDefaultFeaturesForResourceType } from "../utils/resource-features.js";
import { discoverResources } from "../utils/services.js";
import { createKebabCaseValidator, isPathSafe, validateResourceName } from "../utils/validation.js";

export const BASE_TEMPLATE = {
  port: 0, // Will be assigned
  dependencies: [],
  build: {
    dockerfile: "Dockerfile",
    context: ".",
  },
  dev: {
    command: "bun run dev",
    watch: ["src/**/*"],
  },
} as const;

interface TypeSpecificConfig {
  healthCheck?: string;
  dev?: {
    command: string;
    watch: string[];
  };
}

export const TYPE_SPECIFIC: Record<CreatableResourceType, TypeSpecificConfig> = {
  backend: {
    healthCheck: "/health",
  },
  frontend: {
    dev: {
      command: "bun run dev",
      watch: ["src/**/*", "public/**/*"],
    },
  },
  worker: {
    dev: {
      command: "bun run worker",
      watch: ["src/**/*"],
    },
  },
};

export function createServiceJson(
  name: string,
  type: CreatableResourceType,
  stack: string,
  port: number,
  extraFeatures: string[] = [],
) {
  const typeSpecific = TYPE_SPECIFIC[type];

  const base = JSON.parse(JSON.stringify(BASE_TEMPLATE));
  for (const [key, value] of Object.entries(typeSpecific)) {
    if (typeof value === "object" && value !== null && !Array.isArray(value)) {
      base[key] = { ...base[key], ...value };
    } else {
      base[key] = value;
    }
  }

  return {
    ...base,
    appName: name,
    appType: type,
    features: [...getDefaultFeaturesForResourceType(type), ...extraFeatures],
    name,
    type,
    stack,
    port,
  };
}

export function createPackageJson(name: string, type: string) {
  const isFrontend = type === "frontend";

  return {
    name: `@project/${name}`,
    version: "0.0.1",
    type: "module",
    scripts: {
      dev: isFrontend ? "vite" : "bun run --watch src/index.ts",
      build: isFrontend ? "tsc && vite build" : "tsc",
      test: "vitest",
      lint: "biome check .",
      "lint:fix": "biome check . --write",
    },
    dependencies: {
      ...(isFrontend ? {} : { hono: "^4.0.0" }),
    },
    devDependencies: {
      "@types/bun": "latest",
      typescript: "^7.0.2",
      vitest: "^5.0.0",
      "@biomejs/biome": "^2.5.13",

      ...(isFrontend ? { vite: "^5.0.0" } : {}),
    },
  };
}

export const TSCONFIG_TEMPLATE = {
  compilerOptions: {
    target: "ES2022",
    module: "ESNext",
    moduleResolution: "bundler",
    strict: true,
    esModuleInterop: true,
    skipLibCheck: true,
    forceConsistentCasingInFileNames: true,
    outDir: "./dist",
    rootDir: "./src",
    declaration: true,
    declarationMap: true,
    sourceMap: true,
  },
  include: ["src/**/*"],
  exclude: ["node_modules", "dist"],
};

export const DOCKERFILE_TEMPLATE = `FROM oven/bun:1.2

WORKDIR /app

# Copy package files
COPY package.json bun.lock ./

# Install dependencies
RUN bun install --frozen-lockfile

# Copy source
COPY . .

# Build if needed
RUN bun run build

# Health check
HEALTHCHECK --interval=10s --timeout=5s --retries=3 \\
  CMD curl -f http://localhost:3000/health || exit 1

EXPOSE 3000

CMD ["bun", "run", "start"]
`;

export function getBackendIndexTemplate(name: string) {
  return `import { Hono } from 'hono';

const app = new Hono();

// Health check endpoint (required by TILT_RESOURCE_DEFAULTS.star)
app.get('/health', (c) => {
  return c.json({ status: 'ok', service: '${name}' });
});

app.get('/health/live', (c) => {
  return c.json({ status: 'alive', timestamp: Date.now() });
});

app.get('/health/ready', async (c) => {
  const dependencies: Record<string, string> = {};
  let allReady = true;

  // Add dependency checks here (database, cache, etc.)
  // Mark allReady = false if any dependency is unhealthy

  const status = allReady ? 'ready' : 'not_ready';
  return c.json({ status, dependencies }, allReady ? 200 : 503);
});

app.get('/', (c) => {
  return c.json({
    service: '${name}',
    version: '1.0.0',
    endpoints: ['/health', '/health/live', '/health/ready']
  });
});

const port = process.env.PORT || 3000;
console.log('\\n🚀 ${name} running on http://localhost:' + port);
console.log('📊 Health check: http://localhost:' + port + '/health\\n');

export default {
  port,
  fetch: app.fetch,
};
`;
}

function getFrontendIndexTemplate(name: string) {
  return `<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>${name}</title>
  </head>
  <body>
    <div id="root"></div>
    <script type="module" src="/src/main.tsx"></script>
  </body>
</html>
`;
}

const FRONTEND_MAIN_TEMPLATE = `import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);
`;

function getFrontendAppTemplate(name: string) {
  return `function App() {
  return (
    <div style={{ padding: '2rem', fontFamily: 'system-ui' }}>
      <h1>${name}</h1>
      <p>Frontend resource created with TDK</p>
    </div>
  );
}

export default App;
`;
}

function getShutdownHandlerTemplate(signal: string): string {
  return `process.on('${signal}', () => {
  console.log('[Worker] ${signal} received, shutting down gracefully...');
  process.exit(0);
});`;
}

export function getWorkerIndexTemplate(name: string) {
  return `console.log('🚀 ${name} worker started');

interface Job {
  id: string;
  type: string;
  payload: Record<string, JsonValue>;
  priority?: number;
  timestamp?: string;
}

const CONFIG = {
  pollIntervalMs: parseInt(process.env.WORKER_POLL_INTERVAL || '5000'),
  maxRetries: parseInt(process.env.WORKER_MAX_RETRIES || '3'),
  batchSize: parseInt(process.env.WORKER_BATCH_SIZE || '10'),
};

async function processJob(job: Job): Promise<void> {
  console.log('[Worker] Processing job:', job.id, 'type:', job.type);

  // Add job processing logic here using job.payload

  await new Promise(resolve => setTimeout(resolve, 1000));
  console.log('[Worker] Job completed:', job.id);
}

async function fetchJobs(): Promise<Job[]> {
  // Connect to your queue (Redis, RabbitMQ, etc.) and fetch jobs
  return [];
}

async function main() {
  console.log('[Worker] Configuration:', CONFIG);

  while (true) {
    try {
      const jobs = await fetchJobs();

      if (jobs.length === 0) {
        await new Promise(resolve => setTimeout(resolve, CONFIG.pollIntervalMs));
        continue;
      }

      console.log('[Worker] Fetched \${jobs.length} jobs');

      for (const job of jobs) {
        try {
          await processJob(job);
        } catch (error: unknown) {
          console.error('[Worker] Job failed:', error);
        }
      }
    } catch (error: unknown) {
      console.error('[Worker] Error in main loop:', error);
      // Wait before retrying to avoid tight error loops
      await new Promise(resolve => setTimeout(resolve, CONFIG.pollIntervalMs));
    }
  }
}

${getShutdownHandlerTemplate("SIGTERM")}

${getShutdownHandlerTemplate("SIGINT")}

main().catch((err) => {
  console.error('[Worker] Fatal error:', err);
  process.exit(1);
});
`;
}

function getTestTemplate(name: string) {
  return `import { describe, it, expect } from 'vitest';

describe('${name}', () => {
  it('should pass a basic test', () => {
    expect(true).toBe(true);
  });
});
`;
}

export const resourceCommand = new Command("resource")
  .description("Create a new resource (service) from scratch, or register an existing one")
  .argument("[name]", "Resource name (kebab-case)")
  .option("-t, --type <type>", "Resource type: backend, frontend, worker, sdk", "backend")
  .option("-s, --stack <stack>", "Stack to assign resource to", "default")
  .option("-p, --path <path>", "Custom path for resource directory")
  .option("--resource-path <path>", "Alias for --path (for backward compatibility)")
  .option("--register-existing", "Register an existing resource without creating templates")
  .option(
    "--ddd",
    "Scaffold DDD (domain-driven design) folders + path aliases (Premium - requires TDK_LICENSE_KEY)",
  )
  .action(async (name, options) => {
    await runCommand(async () => {
      const projectRoot = requireProjectRoot();

      // Support --resource-path as alias for --path
      const resourcePath = options.resourcePath || options.path;

      showCommandHeader("Resource Creation");

      const allResources = discoverResources();

      let resourceName = name;
      if (!resourceName) {
        const inputName = await promptText({
          message: "Resource name (kebab-case):",
          validate: (input: string) => {
            const validation = createKebabCaseValidator("resource")(input);
            return validation === true || validation;
          },
        });
        resourceName = inputName;
      } else {
        assertValid(validateResourceName(resourceName));
      }

      // Support sdk type for registering existing SDKs
      let resourceType: CreatableResourceType | "sdk";
      const validTypes = [...CREATABLE_RESOURCE_TYPES, "sdk"] as const;
      if (!validTypes.includes(options.type)) {
        const selectedType = await promptSelect({
          message: "Resource type:",
          choices: [
            { title: "backend - API service with HTTP endpoints", value: "backend" },
            { title: "frontend - Web application/UI", value: "frontend" },
            { title: "worker - Background job processor", value: "worker" },
            { title: "sdk - Library/SDK (register existing)", value: "sdk" },
          ],
        });
        resourceType = selectedType;
      } else {
        resourceType = options.type;
      }

      let dddEnabled = false;
      if (options.ddd) {
        if (resourceType !== "backend" && resourceType !== "worker") {
          console.log(
            chalk.yellow(
              `\n⚠️  --ddd only applies to backend/worker resources, ignoring for type "${resourceType}"`,
            ),
          );
        } else {
          const granted = await hasDddLicense(projectRoot);
          if (!granted) {
            throw new Error(
              "DDD scaffolding is a Premium feature and requires a license key that grants it. " +
                "Set export TDK_LICENSE_KEY=<key> (get one at https://tdk-landscape.github.io/#waitlist) and try again.",
            );
          }
          dddEnabled = true;
        }
      }

      let stackName = options.stack;
      if (stackName === "default") {
        const existingResources = allResources;
        const stackSet = new Set<string>();
        for (const r of existingResources) {
          if (r.stack) stackSet.add(r.stack);
        }
        const existingStacks = Array.from(stackSet);

        if (existingStacks.length > 0) {
          const selectedStack = await promptSelect({
            message: "Assign to stack:",
            choices: [
              ...existingStacks.map((s) => ({ title: s, value: s })),
              { title: "Create new stack", value: "__new__" },
            ],
          });

          if (selectedStack === "__new__") {
            const newStack = await promptText({
              message: "New stack name:",
              validate: (input: string) => {
                const validation = createKebabCaseValidator("stack")(input);
                return validation === true || validation;
              },
            });
            stackName = newStack;
          } else {
            stackName = selectedStack;
          }
        } else {
          const newStack = await promptText({
            message: "Stack name (first resource):",
            initial: "main",
            validate: (input: string) => {
              const validation = createKebabCaseValidator("stack")(input);
              return validation === true || validation;
            },
          });
          stackName = newStack;
        }
      }

      let finalResourcePath = resourcePath;
      if (!finalResourcePath) {
        const defaultPaths: Record<CreatableResourceType | "sdk", string> = {
          backend: `services/${stackName}/${resourceName}`,
          frontend: `apps/${resourceName}`,
          worker: `workers/${resourceName}`,
          sdk: `packages/${resourceName}`,
        };
        finalResourcePath = defaultPaths[resourceType];
      }

      const fullPath = resolve(projectRoot, finalResourcePath);

      // Prevent path traversal attacks
      const relativePathResult = relative(projectRoot, fullPath);
      if (relativePathResult.startsWith("..") || isAbsolute(relativePathResult)) {
        errorFactories.invalidPath(fullPath).exit();
      }

      if (!isPathSafe(finalResourcePath)) {
        errorFactories.invalidPath(finalResourcePath).exit();
      }

      // Check if resource already exists
      const isExistingResource = existsSync(fullPath);
      const hasServiceJson = existsSync(resolve(fullPath, "service.json"));
      const shouldRegisterExisting =
        options.registerExisting ||
        resourceType === "sdk" ||
        (isExistingResource && hasServiceJson);

      if (isExistingResource && !shouldRegisterExisting) {
        errorFactories.directoryExists(fullPath).exit();
      }

      const assignedPort =
        resourceType === "sdk"
          ? 0
          : assignPort(resourceType as CreatableResourceType, allResources);

      console.log(chalk.gray("\nResource details:"));
      console.log(chalk.gray(`  Name:  ${resourceName}`));
      console.log(chalk.gray(`  Type:  ${resourceType}`));
      console.log(chalk.gray(`  Stack: ${stackName}`));
      console.log(chalk.gray(`  Port:  ${assignedPort || "N/A (SDK)"}`));
      console.log(chalk.gray(`  Path:  ${finalResourcePath}`));

      if (shouldRegisterExisting && hasServiceJson) {
        console.log(
          chalk.yellow("\n⚠️  Existing resource detected - will update service.json only"),
        );
      }

      const confirmed = await confirmOrCancel(
        shouldRegisterExisting && hasServiceJson
          ? "\nRegister existing resource?"
          : "\nCreate resource?",
      );
      if (!confirmed) return;

      // Handle existing resource registration
      if (shouldRegisterExisting && hasServiceJson) {
        // Read existing service.json
        const { readFileSync } = await import("node:fs");
        const existingServiceJsonPath = resolve(fullPath, "service.json");
        const existingContent = readFileSync(existingServiceJsonPath, "utf-8");
        const existingServiceJson = JSON.parse(existingContent);

        // Update with new values while preserving existing fields
        const updatedServiceJson = {
          ...existingServiceJson,
          appName: resourceName,
          appType: resourceType === "sdk" ? "sdk" : existingServiceJson.appType || resourceType,
          stack: stackName,
          ...(assignedPort > 0 && { port: assignedPort }),
        };

        // Write updated service.json
        const { writeFileSync } = await import("node:fs");
        writeFileSync(existingServiceJsonPath, JSON.stringify(updatedServiceJson, null, 2));

        console.log(chalk.green("\n✅ Existing resource registered successfully!"));
        console.log(chalk.gray(`\nLocation: ${fullPath}`));
        console.log(chalk.gray(`\nNext steps:`));
        console.log(chalk.gray(`  tdk up ${stackName}`));
        return;
      }

      // Create directory structure for new resources
      console.log(chalk.blue("\n📁 Creating directory structure..."));
      mkdirSync(fullPath, { recursive: true });
      mkdirSync(resolve(fullPath, "src"), { recursive: true });
      mkdirSync(resolve(fullPath, "tests"), { recursive: true });
      if (dddEnabled) {
        for (const layer of ["domain", "application", "infrastructure", "presentation"]) {
          mkdirSync(resolve(fullPath, "src", layer), { recursive: true });
        }
      }

      // Prepare file generation tasks
      const serviceJson = createServiceJson(
        resourceName,
        resourceType as CreatableResourceType,
        stackName,
        assignedPort,
        dddEnabled ? ["ddd"] : [],
      );
      const packageJson = createPackageJson(resourceName, resourceType);

      const tasks: FileGenerationTask[] = [
        {
          type: "json",
          filename: "service.json",
          content: serviceJson,
          description: "Generating service.json",
          emoji: "📝",
        },
        {
          type: "json",
          filename: "package.json",
          content: packageJson,
          description: "Generating package.json",
          emoji: "📦",
        },
        {
          type: "json",
          filename: "tsconfig.json",
          content: TSCONFIG_TEMPLATE,
          description: "Generating tsconfig.json",
          emoji: "⚙️",
        },
        {
          type: "text",
          filename: "Dockerfile",
          content: DOCKERFILE_TEMPLATE,
          description: "Generating Dockerfile",
          emoji: "🐳",
        },
      ];

      // Add source files based on resource type
      if (resourceType === "backend") {
        tasks.push({
          type: "text",
          filename: "src/index.ts",
          content: getBackendIndexTemplate(resourceName),
          description: "Generating backend source",
          emoji: "💻",
        });
      } else if (resourceType === "frontend") {
        tasks.push({
          type: "text",
          filename: "index.html",
          content: getFrontendIndexTemplate(resourceName),
          description: "Generating HTML template",
          emoji: "💻",
        });
        tasks.push({
          type: "text",
          filename: "src/main.tsx",
          content: FRONTEND_MAIN_TEMPLATE,
          description: "Generating React entry",
          emoji: "💻",
        });
        tasks.push({
          type: "text",
          filename: "src/App.tsx",
          content: getFrontendAppTemplate(resourceName),
          description: "Generating React app",
          emoji: "💻",
        });
      } else if (resourceType === "worker") {
        tasks.push({
          type: "text",
          filename: "src/index.ts",
          content: getWorkerIndexTemplate(resourceName),
          description: "Generating worker source",
          emoji: "💻",
        });
      }

      // Add test file
      tasks.push({
        type: "text",
        filename: `tests/${resourceName}.test.ts`,
        content: getTestTemplate(resourceName),
        description: "Generating test file",
        emoji: "🧪",
      });

      // Execute all file writes with progress
      console.log(chalk.blue("💻 Generating source files..."));
      writeFilesWithProgress(fullPath, tasks);

      console.log(chalk.green("\n✅ Resource created successfully!"));
      console.log(chalk.gray(`\nLocation: ${fullPath}`));
      console.log(chalk.gray(`\nNext steps:`));
      console.log(chalk.gray(`  cd ${finalResourcePath}`));
      console.log(chalk.gray(`  bun install`));
      console.log(chalk.gray(`  tdk up ${stackName}`));
    });
  });
