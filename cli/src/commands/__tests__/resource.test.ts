import { describe, expect, it } from "vitest";
import {
  BASE_TEMPLATE,
  createPackageJson,
  createServiceJson,
  DOCKERFILE_TEMPLATE,
  getBackendIndexTemplate,
  getWorkerIndexTemplate,
  TSCONFIG_TEMPLATE,
  TYPE_SPECIFIC,
} from "../../commands/resource.js";
import { CREATABLE_RESOURCE_TYPES, isCreatableResourceType } from "../../types/index.js";
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
      expect(serviceJson).toHaveProperty("healthCheck", "/health");
      expect(serviceJson).toHaveProperty("dependencies");
      expect(serviceJson).toHaveProperty("build");
      expect(serviceJson).toHaveProperty("dev");
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
      expect(TYPE_SPECIFIC.backend).toHaveProperty("healthCheck", "/health");
      expect(TYPE_SPECIFIC.frontend.dev.watch).toContain("public/**/*");
      expect(TYPE_SPECIFIC.worker.dev.command).toBe("bun run worker");
    });

    it("should have correct BASE_TEMPLATE structure", () => {
      expect(BASE_TEMPLATE).toHaveProperty("port", 0);
      expect(BASE_TEMPLATE).toHaveProperty("dependencies");
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
      expect(packageJson.scripts.dev).toBe("vite");
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
  });

  describe("dockerfile template", () => {
    it("should have correct DOCKERFILE_TEMPLATE content", () => {
      expect(DOCKERFILE_TEMPLATE).toContain("FROM oven/bun:1.2");
      expect(DOCKERFILE_TEMPLATE).toContain("WORKDIR /app");
      expect(DOCKERFILE_TEMPLATE).toContain("HEALTHCHECK");
      expect(DOCKERFILE_TEMPLATE).toContain("EXPOSE 3000");
      expect(DOCKERFILE_TEMPLATE).toContain("bun install --frozen-lockfile");
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
      const validTypes = ["backend", "frontend", "worker"];
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
      expect(CREATABLE_RESOURCE_TYPES).toHaveLength(3);
    });
  });
});
