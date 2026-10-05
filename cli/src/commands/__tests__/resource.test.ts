import { mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";
import {
  BASE_TEMPLATE,
  createPackageJson,
  createResourceTsconfig,
  createServiceJson,
  getBackendIndexTemplate,
  getDockerfileTemplate,
  getWorkerIndexTemplate,
  parseResourceType,
  TSCONFIG_TEMPLATE,
  TYPE_SPECIFIC,
} from "../../commands/resource.js";
import {
  FRONTEND_FRAMEWORKS,
  getFrontendFramework,
  resolveFrontendFramework,
} from "../../frontend-frameworks/registry.js";
import { CREATABLE_RESOURCE_TYPES, isCreatableResourceType } from "../../types/index.js";
import { TdkError } from "../../utils/errors.js";
import { discoverResourcesFromRoot } from "../../utils/services.js";
import { KEBAB_CASE_REGEX } from "../../utils/validation.js";

describe("resource command", () => {
  describe("resource name validation", () => {
    it("should accept valid kebab-case names using KEBAB_CASE_REGEX", () => {
      const validNames = ["my-service", "service123", "api-gateway", "a", "test-123-abc"];

      for (const name of validNames) {
        expect(KEBAB_CASE_REGEX.test(name)).toBe(true);
      }
    });

    it("should reject invalid names using KEBAB_CASE_REGEX", () => {
      const invalidNames = [
        "MyService", // camelCase
        "my_service", // underscore
        "my service", // space
        "service.name", // dot
        "Service-Name", // uppercase
        "", // empty
      ];

      for (const name of invalidNames) {
        expect(KEBAB_CASE_REGEX.test(name)).toBe(false);
      }
    });
  });

  describe("service.json template", () => {
    it("should create valid backend service.json using createServiceJson", () => {
      const name = "test-backend";
      const type = "backend";
      const stack = "main";
      const port = 3001;

      const serviceJson = createServiceJson(name, type, stack, port);

      expect(serviceJson).toHaveProperty("name", name);
      expect(serviceJson).toHaveProperty("type", type);
      expect(serviceJson).toHaveProperty("port", port);
      expect(serviceJson).toHaveProperty("stack", stack);
      expect(serviceJson).toHaveProperty("healthCheckPath", "/health");
      expect(serviceJson).not.toHaveProperty("framework");
      expect(serviceJson).toHaveProperty("dependsOn");
      expect(serviceJson).toHaveProperty("build");
      expect(serviceJson).toHaveProperty("dev");
      expect(serviceJson.$schema).toBe("https://tdk-landscape.github.io/schema.service.json");
    });

    it("should create valid frontend service.json using createServiceJson", () => {
      const name = "test-frontend";
      const type = "frontend";
      const stack = "main";
      const port = 3002;

      const serviceJson = createServiceJson(name, type, stack, port);

      expect(serviceJson).toHaveProperty("name", name);
      expect(serviceJson).toHaveProperty("type", type);
      expect(serviceJson).toHaveProperty("port", port);
      expect(serviceJson.dev.watch).toContain("public/**/*");
      expect(serviceJson).toHaveProperty("framework", "react");

      const explicitlySelected = createServiceJson(name, type, stack, port, [], "react");
      expect(explicitlySelected).toHaveProperty("framework", "react");
    });

    it("should create valid worker service.json using createServiceJson", () => {
      const name = "test-worker";
      const type = "worker";
      const stack = "main";
      const port = 0;

      const serviceJson = createServiceJson(name, type, stack, port);

      expect(serviceJson).toHaveProperty("name", name);
      expect(serviceJson).toHaveProperty("type", type);
      expect(serviceJson.port).toBe(0); // Workers may not need ports
      expect(serviceJson.dev.command).toBe("bun run worker");
    });

    it("should have correct TYPE_SPECIFIC extensions for each resource type", () => {
      expect(TYPE_SPECIFIC.backend).toHaveProperty("healthCheckPath", "/health");
      expect(TYPE_SPECIFIC.frontend.dev?.watch).toContain("public/**/*");
      expect(TYPE_SPECIFIC.worker.dev?.command).toBe("bun run worker");
    });

    it("should have correct BASE_TEMPLATE structure", () => {
      expect(BASE_TEMPLATE).toHaveProperty("port", 0);
      expect(BASE_TEMPLATE).toHaveProperty("dependsOn");
      expect(BASE_TEMPLATE).toHaveProperty("build");
      expect(BASE_TEMPLATE).toHaveProperty("dev");
      expect(BASE_TEMPLATE.build).toHaveProperty("dockerfile", "Dockerfile");
    });
  });

  describe("package.json template", () => {
    it("should create backend package.json with Hono using createPackageJson", () => {
      const name = "test-backend";
      const type = "backend";

      const packageJson = createPackageJson(name, type);

      expect(packageJson.name).toBe(`@project/${name}`);
      expect(packageJson).toHaveProperty("dependencies");
      expect(packageJson.dependencies).toHaveProperty("hono");
      expect(packageJson.dependencies).not.toHaveProperty("vite");
      expect(packageJson.scripts.dev).toBe("bun run --watch src/index.ts");
    });

    it("should create frontend package.json with Vite using createPackageJson", () => {
      const name = "test-frontend";
      const type = "frontend";

      const packageJson = createPackageJson(name, type);

      expect(packageJson.name).toBe(`@project/${name}`);
      expect(packageJson.dependencies).not.toHaveProperty("hono");
      expect(packageJson.devDependencies).toHaveProperty("vite");
      expect(packageJson.devDependencies).toHaveProperty("@vitejs/plugin-react");
      expect(packageJson.dependencies).toHaveProperty("react");
      expect(packageJson.dependencies).toHaveProperty("react-dom");
      expect(packageJson.scripts.dev).toBe(
        "vite --config .autogenerated/vite.config.frontend.autogenerated.ts",
      );
    });

    it("keeps frontend framework dependencies out of backend packages", () => {
      const packageJson = createPackageJson("test-backend", "backend");

      expect(packageJson.dependencies).not.toHaveProperty("react");
      expect(packageJson.devDependencies).not.toHaveProperty("@vitejs/plugin-react");
    });

    it("should create worker package.json using createPackageJson", () => {
      const name = "test-worker";
      const type = "worker";

      const packageJson = createPackageJson(name, type);

      expect(packageJson.name).toBe(`@project/${name}`);
      expect(packageJson.dependencies).toHaveProperty("hono");
      expect(packageJson.scripts.build).toBe("tsc");
    });
  });

  describe("tsconfig template", () => {
    it("should have correct TSCONFIG_TEMPLATE structure", () => {
      expect(TSCONFIG_TEMPLATE).toHaveProperty("compilerOptions");
      expect(TSCONFIG_TEMPLATE.compilerOptions).toHaveProperty("target", "ES2022");
      expect(TSCONFIG_TEMPLATE.compilerOptions).toHaveProperty("module", "ESNext");
      expect(TSCONFIG_TEMPLATE.compilerOptions).toHaveProperty("strict", true);
      expect(TSCONFIG_TEMPLATE).toHaveProperty("include");
      expect(TSCONFIG_TEMPLATE.include).toContain("src/**/*");
    });

    it("adds JSX settings through the React provider while keeping the base framework-neutral", () => {
      expect(TSCONFIG_TEMPLATE.compilerOptions).not.toHaveProperty("jsx");
      expect(createResourceTsconfig("frontend").compilerOptions).toHaveProperty("jsx", "react-jsx");
      expect(createResourceTsconfig("backend").compilerOptions).not.toHaveProperty("jsx");
    });

    it("lists node types for non-frontend resources (TS7 does not auto-include @types)", () => {
      for (const type of ["backend", "worker", "mcp"] as const) {
        expect(createResourceTsconfig(type).compilerOptions.types).toEqual(["node"]);
      }
      expect(createResourceTsconfig("frontend").compilerOptions).not.toHaveProperty("types");
    });
  });

  describe("frontend framework providers", () => {
    it("uses React when the framework is omitted, normalizes case, and rejects unknown ids", () => {
      expect(getFrontendFramework().id).toBe("react");
      expect(getFrontendFramework("vue").id).toBe("vue");
      expect(getFrontendFramework("svelte").id).toBe("svelte");
      expect(getFrontendFramework("preact").id).toBe("preact");
      expect(getFrontendFramework("lit").id).toBe("lit");
      expect(getFrontendFramework("vanilla").id).toBe("vanilla");
      expect(getFrontendFramework("solid").id).toBe("solid");
      expect(getFrontendFramework("qwik").id).toBe("qwik");
      expect(() => getFrontendFramework("angular")).toThrow(
        /Supported frameworks: react, vue, svelte, preact, lit, solid, qwik, vanilla, tanstack-router/,
      );
      expect(() => getFrontendFramework("__proto__")).toThrow(/Unknown frontend framework/);
      expect(getFrontendFramework("React").id).toBe("react");
      expect(getFrontendFramework(" VUE ").id).toBe("vue");
      expect(() => getFrontendFramework("angular")).toThrow(TdkError);
      expect(() => getFrontendFramework("")).toThrow(/Unknown frontend framework/);
    });

    it("rejects framework selection for resources that take no framework", () => {
      for (const resourceType of ["worker", "sdk"]) {
        expect(() => resolveFrontendFramework(resourceType, "react")).toThrow(
          /only be used with --type frontend or --type backend/,
        );
      }
    });

    it("leaves backend framework ids to the backend registry", () => {
      expect(resolveFrontendFramework("backend", "express")).toBeUndefined();
    });

    it("keeps the existing React entry and component output under the provider", () => {
      const provider = getFrontendFramework();
      const files = provider.createFiles("sample-web");

      expect(files.map(({ filename }) => filename)).toEqual([
        "index.html",
        "src/main.tsx",
        "src/App.tsx",
      ]);
      expect(files[0]?.content).toContain("<title>sample-web</title>");
      expect(files[0]?.content).toContain("/src/main.tsx");
      expect(files[1]?.content).toContain("ReactDOM.createRoot");
      expect(files[2]?.content).toContain("Frontend resource created with TDK");
      expect(files.some(({ filename }) => filename === "vite.config.ts")).toBe(false);
    });

    it("keeps Vue source and dependencies in its provider", () => {
      const provider = getFrontendFramework("vue");
      const files = provider.createFiles("sample-web");

      expect(provider.dependencies).toHaveProperty("vue");
      expect(provider.devDependencies).toHaveProperty("@vitejs/plugin-vue");
      expect(provider.devDependencies).not.toHaveProperty("@vitejs/plugin-react");
      expect(files.map(({ filename }) => filename)).toEqual([
        "index.html",
        "src/main.ts",
        "src/App.vue",
        "src/vite-env.d.ts",
      ]);
      expect(files[0]?.content).toContain("/src/main.ts");
      expect(files[1]?.content).toContain("createApp(App).mount('#app')");
      expect(files[2]?.content).toContain('<script setup lang="ts">');
      expect(files.some(({ filename }) => filename === "vite.config.ts")).toBe(false);
    });

    it("keeps Svelte source and dependencies in its provider", () => {
      const provider = getFrontendFramework("svelte");
      const files = provider.createFiles("sample-web");

      expect(provider.dependencies).toHaveProperty("svelte");
      expect(provider.devDependencies).toHaveProperty("@sveltejs/vite-plugin-svelte");
      expect(provider.devDependencies).not.toHaveProperty("@vitejs/plugin-react");
      expect(files.map(({ filename }) => filename)).toEqual([
        "index.html",
        "src/main.ts",
        "src/App.svelte",
        "src/vite-env.d.ts",
      ]);
      expect(files[0]?.content).toContain("/src/main.ts");
      expect(files[1]?.content).toContain("mount(App");
      expect(files[2]?.content).toContain('<script lang="ts">');
      expect(files.some(({ filename }) => filename === "vite.config.ts")).toBe(false);
    });

    it("keeps Preact source and dependencies in its provider", () => {
      const provider = getFrontendFramework("preact");
      const files = provider.createFiles("sample-web");

      expect(provider.dependencies).toHaveProperty("preact");
      expect(provider.dependencies).not.toHaveProperty("react");
      expect(provider.devDependencies).toHaveProperty("@preact/preset-vite");
      expect(provider.devDependencies).not.toHaveProperty("@vitejs/plugin-react");
      expect(provider.compilerOptions).toEqual({ jsx: "react-jsx", jsxImportSource: "preact" });
      expect(files.map(({ filename }) => filename)).toEqual([
        "index.html",
        "src/main.tsx",
        "src/App.tsx",
      ]);
      expect(files[0]?.content).toContain("/src/main.tsx");
      expect(files[1]?.content).toContain("from 'preact'");
      expect(files[2]?.content).toContain("Frontend resource created with TDK");
      expect(files.some(({ filename }) => filename === "vite.config.ts")).toBe(false);
    });
  });

  describe("lit provider", () => {
    it("keeps Lit source and dependencies in its provider", () => {
      const provider = getFrontendFramework("lit");
      const files = provider.createFiles("sample-web");

      expect(provider.dependencies).toHaveProperty("lit");
      expect(provider.dependencies).not.toHaveProperty("react");
      expect(provider.devDependencies).toEqual({});
      expect(files.map(({ filename }) => filename)).toEqual([
        "index.html",
        "src/main.ts",
        "src/app-root.ts",
      ]);
      expect(files[0]?.content).toContain("<app-root></app-root>");
      expect(files[2]?.content).toContain("from 'lit'");
      expect(files[2]?.content).toContain("Frontend resource created with TDK");
      expect(files.some(({ filename }) => filename === "vite.config.ts")).toBe(false);
    });

    it("keeps Vanilla TypeScript source in its provider, with no framework dependency", () => {
      const provider = getFrontendFramework("vanilla");
      const files = provider.createFiles("sample-web");

      expect(provider.dependencies).toEqual({});
      expect(provider.devDependencies).toEqual({});
      expect(provider.compilerOptions).toEqual({});
      expect(files.map(({ filename }) => filename)).toEqual([
        "index.html",
        "src/main.ts",
        "src/app.ts",
      ]);
      expect(files[0]?.content).toContain('<div id="app"></div>');
      expect(files[1]?.content).toContain("from './app'");
      expect(files[2]?.content).toContain("Frontend resource created with TDK");
      expect(files.some(({ filename }) => filename === "vite.config.ts")).toBe(false);
    });

    it("keeps Solid source and dependencies in its provider", () => {
      const provider = getFrontendFramework("solid");
      const files = provider.createFiles("sample-web");

      expect(provider.dependencies).toHaveProperty("solid-js");
      expect(provider.dependencies).not.toHaveProperty("react");
      expect(provider.devDependencies).toHaveProperty("vite-plugin-solid");
      expect(provider.devDependencies).not.toHaveProperty("@vitejs/plugin-react");
      expect(provider.compilerOptions).toEqual({ jsx: "preserve", jsxImportSource: "solid-js" });
      expect(files.map(({ filename }) => filename)).toEqual([
        "index.html",
        "src/main.tsx",
        "src/App.tsx",
      ]);
      expect(files[1]?.content).toContain("from 'solid-js/web'");
      expect(files[2]?.content).toContain("Frontend resource created with TDK");
      expect(files.some(({ filename }) => filename === "vite.config.ts")).toBe(false);
    });

    it("keeps TanStack Router source and dependencies in its provider", () => {
      const provider = getFrontendFramework("tanstack-router");
      const files = provider.createFiles("sample-web");

      expect(provider.id).toBe("tanstack-router");
      expect(provider.dependencies).toHaveProperty("@tanstack/react-router");
      expect(provider.dependencies).toHaveProperty("react");
      expect(provider.devDependencies).toHaveProperty("@vitejs/plugin-react");
      expect(provider.compilerOptions).toEqual({ jsx: "react-jsx" });
      expect(files.map(({ filename }) => filename)).toEqual([
        "index.html",
        "src/main.tsx",
        "src/router.tsx",
      ]);
      // The app is served under /<name>/, so the router must take Vite's base as its basepath.
      expect(files[1]?.content).toContain("RouterProvider");
      expect(files[2]?.content).toContain("basepath: import.meta.env.BASE_URL");
      // `tsc` fails the image build on import.meta.env without the Vite client types (seen in a real tdk up).
      expect(files[2]?.content).toContain('/// <reference types="vite/client" />');
      expect(files[2]?.content).toContain("createRoute");
      expect(files[2]?.content).toContain("Frontend resource created with TDK");
      expect(files.some(({ filename }) => filename === "vite.config.ts")).toBe(false);
    });

    it("keeps Qwik source and dependencies in its provider", () => {
      const provider = getFrontendFramework("qwik");
      const files = provider.createFiles("sample-web");

      expect(provider.dependencies).toHaveProperty("@builder.io/qwik");
      expect(provider.dependencies).not.toHaveProperty("react");
      expect(provider.devDependencies).not.toHaveProperty("@vitejs/plugin-react");
      expect(provider.compilerOptions).toEqual({
        jsx: "react-jsx",
        jsxImportSource: "@builder.io/qwik",
      });
      expect(files.map(({ filename }) => filename)).toEqual([
        "index.html",
        "src/main.tsx",
        "src/App.tsx",
      ]);
      expect(files[1]?.content).toContain("render(document.getElementById('app')");
      expect(files[2]?.content).toContain("component$");
      expect(files[2]?.content).toContain("Frontend resource created with TDK");
      expect(files.some(({ filename }) => filename === "vite.config.ts")).toBe(false);
    });
  });

  describe("legacy frontend service metadata", () => {
    it("discovers a frontend without framework without rewriting service.json", () => {
      const projectRoot = mkdtempSync(join(tmpdir(), "tdk-legacy-frontend-"));
      try {
        const serviceDir = join(projectRoot, "apps", "legacy-web");
        mkdirSync(serviceDir, { recursive: true });
        const servicePath = join(serviceDir, "service.json");
        const original = '{"appName":"legacy-web","appType":"frontend","stack":"main"}\n';
        writeFileSync(servicePath, original);

        const resources = discoverResourcesFromRoot(projectRoot);

        expect(resources).toHaveLength(1);
        expect(resources[0]?.config).not.toHaveProperty("framework");
        expect(readFileSync(servicePath, "utf-8")).toBe(original);
      } finally {
        rmSync(projectRoot, { recursive: true, force: true });
      }
    });
  });

  describe("dockerfile template", () => {
    it("follows the service port and health path", () => {
      const dockerfile = getDockerfileTemplate(4123, "/health");
      expect(dockerfile).toContain("FROM oven/bun:1.2");
      expect(dockerfile).toContain("WORKDIR /app");
      expect(dockerfile).toContain("EXPOSE 4123");
      expect(dockerfile).toContain("ENV PORT=4123");
      expect(dockerfile).toContain("HEALTHCHECK");
      expect(dockerfile).toContain("http://localhost:4123/health");
      expect(dockerfile).not.toContain("3000");
      expect(dockerfile).not.toContain("curl");
    });

    it("does not require a per-service bun.lock", () => {
      expect(getDockerfileTemplate(4000)).toContain("COPY package.json bun.lock* ./");
    });

    it("omits the health check when the service declares no health path", () => {
      expect(getDockerfileTemplate(6000)).not.toContain("HEALTHCHECK");
    });

    it("says that tdk up does not use it", () => {
      expect(getDockerfileTemplate(4000)).toMatch(/tdk up. does NOT build this file/);
    });
  });

  describe("backend index.ts template", () => {
    it("should have health check endpoints via getBackendIndexTemplate", () => {
      const name = "test-service";
      const indexContent = getBackendIndexTemplate(name);

      expect(indexContent).toContain("app.get('/health'");
      expect(indexContent).toContain("app.get('/health/live'");
      expect(indexContent).toContain("app.get('/health/ready'");
      expect(indexContent).toContain("async (c)");
      expect(indexContent).toContain(`service: '${name}'`);
    });

    it("should have root endpoint with service info", () => {
      const name = "test-service";
      const indexContent = getBackendIndexTemplate(name);

      expect(indexContent).toContain("app.get('/',");
      expect(indexContent).toContain("endpoints:");
    });
  });

  describe("worker index.ts template", () => {
    it("should have worker configuration via getWorkerIndexTemplate", () => {
      const name = "test-worker";
      const workerContent = getWorkerIndexTemplate(name);

      expect(workerContent).toContain("WORKER_POLL_INTERVAL");
      expect(workerContent).toContain("WORKER_MAX_RETRIES");
      expect(workerContent).toContain("WORKER_BATCH_SIZE");
      expect(workerContent).toContain("interface Job");
      expect(workerContent).toContain("async function main()");
    });

    it("should have graceful shutdown handling", () => {
      const name = "test-worker";
      const workerContent = getWorkerIndexTemplate(name);

      expect(workerContent).toContain("process.on('SIGTERM'");
      expect(workerContent).toContain("process.on('SIGINT'");
      expect(workerContent).toContain("shutting down gracefully");
    });
  });

  describe("resource type validation", () => {
    it("should only accept valid resource types via isCreatableResourceType", () => {
      const validTypes = ["backend", "frontend", "worker", "mcp", "bring-your-own"];
      const invalidTypes = ["api", "microservice", "service", "app", "library", "sdk"];

      for (const type of validTypes) {
        expect(isCreatableResourceType(type)).toBe(true);
      }

      for (const type of invalidTypes) {
        expect(isCreatableResourceType(type)).toBe(false);
      }
    });

    it("should have correct CREATABLE_RESOURCE_TYPES", () => {
      expect(CREATABLE_RESOURCE_TYPES).toContain("backend");
      expect(CREATABLE_RESOURCE_TYPES).toContain("frontend");
      expect(CREATABLE_RESOURCE_TYPES).toContain("worker");
      expect(CREATABLE_RESOURCE_TYPES).toContain("mcp");
      expect(CREATABLE_RESOURCE_TYPES).toContain("bring-your-own");
      expect(CREATABLE_RESOURCE_TYPES).toHaveLength(5);
    });
  });
});

describe("service.json schema", () => {
  it("keeps framework open to every registered frontend provider", () => {
    const schemaPath = join(
      dirname(fileURLToPath(import.meta.url)),
      "../../../../engine/schemas/service-schema.json",
    );
    const schema = JSON.parse(readFileSync(schemaPath, "utf-8"));

    // Unknown user fields are preserved and warned about rather than rejected.
    expect(schema.additionalProperties).toBe(true);
    expect(schema.required).toContain("schemaVersion");
    expect(schema.properties.schemaVersion).toMatchObject({ const: 1, type: "integer" });
    expect(schema.properties.appType.enum).toContain("bring-your-own");
    expect(schema.properties.stack.type).toBe("string");
    expect(schema.properties.stack.enum).toBeUndefined();
    expect(schema.properties.image.type).toBe("string");
    expect(schema.properties.exposeViaProxy.type).toBe("boolean");
    // The provider registry is the contract, so the schema stays open and every registered id fits.
    expect(schema.properties.framework.enum).toBeUndefined();
    const idPattern = new RegExp(schema.properties.framework.pattern);
    for (const id of Object.keys(FRONTEND_FRAMEWORKS)) expect(id).toMatch(idPattern);
    expect("Not_A_Provider").not.toMatch(idPattern);
    expect(schema.properties.sablier.properties.deferStart).toMatchObject({
      default: false,
      type: "boolean",
    });
    expect(createServiceJson("web", "frontend", "app", 3000, [], "vue").framework).toBe("vue");
    expect(createServiceJson("web", "frontend", "app", 3000).schemaVersion).toBe(1);
    expect(createServiceJson("web", "frontend", "app", 3000).$schema).toContain(
      "schema.service.json",
    );
  });
});

describe("parseResourceType", () => {
  it("accepts every creatable type, sdk and the byo alias", () => {
    for (const type of [...CREATABLE_RESOURCE_TYPES, "sdk"]) {
      expect(parseResourceType(type)).toBe(type);
    }
    expect(parseResourceType("byo")).toBe("bring-your-own");
  });

  it("rejects an unknown type with the supported list instead of prompting", () => {
    expect(() => parseResourceType("bogus")).toThrow(TdkError);
    expect(() => parseResourceType("bogus")).toThrow(
      /Unknown resource type "bogus"\. Supported types: backend, frontend/,
    );
    expect(() => parseResourceType("")).toThrow(/Unknown resource type/);
  });
});
