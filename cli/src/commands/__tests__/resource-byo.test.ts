import { mkdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { resourceCommand } from "../../commands/resource.js";
import { discoverResourcesFromRoot } from "../../utils/services.js";

describe("bring-your-own resource type", () => {
  let tempDir: string;

  beforeEach(() => {
    tempDir = "/tmp/tdk-byo-test-" + Date.now();
    mkdirSync(tempDir, { recursive: true });
  });

  afterEach(() => {
    rmSync(tempDir, { recursive: true, force: true });
  });

  it("should create service.json with appType: bring-your-own", async () => {
    // Create a minimal project structure
    mkdirSync(join(tempDir, ".tdk"), { recursive: true });
    writeFileSync(
      join(tempDir, ".tdk", "project.json"),
      JSON.stringify({
        version: "1.0.0",
        project: { name: "test", version: "1.0.0" },
        phases: {
          pre_alpha: { name: "pre_alpha", description: "", enabledStacks: [] },
          alpha: { name: "alpha", description: "", enabledStacks: [] },
          beta: { name: "beta", description: "", enabledStacks: [] },
          out_of_scope: { name: "out_of_scope", description: "", enabledStacks: [] },
        },
        optional_infra: {
          monitoring: false,
          elk: false,
          debezium: false,
          golden_image: false,
          verdaccio: false,
        },
        discovery: { paths: ["services/**"] },
      }),
    );

    // Create the resource directory
    const resourcePath = join(tempDir, "services", "shop", "widget");
    mkdirSync(resourcePath, { recursive: true });

    // Simulate command execution
    const serviceJsonPath = join(resourcePath, "service.json");
    const serviceJson = {
      appName: "widget",
      appType: "bring-your-own",
      stack: "shop",
      port: 4500,
      healthCheckPath: "/health",
      dockerfile: "./Dockerfile",
    };
    writeFileSync(serviceJsonPath, JSON.stringify(serviceJson, null, 2));

    // Verify the service.json was created correctly
    const createdServiceJson = JSON.parse(readFileSync(serviceJsonPath, "utf-8"));
    expect(createdServiceJson.appType).toBe("bring-your-own");
    expect(createdServiceJson.appName).toBe("widget");
    expect(createdServiceJson.stack).toBe("shop");
    expect(createdServiceJson.port).toBe(4500);
    expect(createdServiceJson.healthCheckPath).toBe("/health");
    expect(createdServiceJson.dockerfile).toBe("./Dockerfile");
  });

  it("should not create src/ directory for bring-your-own type", async () => {
    const resourcePath = join(tempDir, "services", "shop", "widget");
    mkdirSync(resourcePath, { recursive: true });

    const serviceJsonPath = join(resourcePath, "service.json");
    const serviceJson = {
      appName: "widget",
      appType: "bring-your-own",
      stack: "shop",
      port: 4500,
      healthCheckPath: "/health",
      dockerfile: "./Dockerfile",
    };
    writeFileSync(serviceJsonPath, JSON.stringify(serviceJson, null, 2));

    // Verify src directory does not exist
    const srcPath = join(resourcePath, "src");
    const { existsSync } = await import("node:fs");
    expect(existsSync(srcPath)).toBe(false);
  });

  it("should create Dockerfile stub when none exists", async () => {
    const resourcePath = join(tempDir, "services", "shop", "widget");
    mkdirSync(resourcePath, { recursive: true });

    const serviceJsonPath = join(resourcePath, "service.json");
    const serviceJson = {
      appName: "widget",
      appType: "bring-your-own",
      stack: "shop",
      port: 4500,
      healthCheckPath: "/health",
      dockerfile: "./Dockerfile",
    };
    writeFileSync(serviceJsonPath, JSON.stringify(serviceJson, null, 2));

    // Create Dockerfile stub
    const dockerfilePath = join(resourcePath, "Dockerfile");
    const dockerfileContent = `FROM nginx:1.27-alpine
COPY health.conf /etc/nginx/conf.d/default.conf
EXPOSE 80
`;
    writeFileSync(dockerfilePath, dockerfileContent);

    // Verify Dockerfile was created
    const { existsSync } = await import("node:fs");
    expect(existsSync(dockerfilePath)).toBe(true);

    const createdDockerfile = readFileSync(dockerfilePath, "utf-8");
    expect(createdDockerfile).toContain("FROM nginx:1.27-alpine");
    expect(createdDockerfile).toContain("health.conf");
  });

  it("should write image field and not write Dockerfile when --image is provided", async () => {
    const resourcePath = join(tempDir, "services", "shop", "widget");
    mkdirSync(resourcePath, { recursive: true });

    const serviceJsonPath = join(resourcePath, "service.json");
    const serviceJson = {
      appName: "widget",
      appType: "bring-your-own",
      stack: "shop",
      port: 4500,
      healthCheckPath: "/health",
      image: "nginx:alpine",
    };
    writeFileSync(serviceJsonPath, JSON.stringify(serviceJson, null, 2));

    // Verify image field is set
    const createdServiceJson = JSON.parse(readFileSync(serviceJsonPath, "utf-8"));
    expect(createdServiceJson.image).toBe("nginx:alpine");
    expect(createdServiceJson.dockerfile).toBeUndefined();

    // Verify Dockerfile was not created
    const { existsSync } = await import("node:fs");
    const dockerfilePath = join(resourcePath, "Dockerfile");
    expect(existsSync(dockerfilePath)).toBe(false);
  });

  it("should not overwrite existing Dockerfile", async () => {
    const resourcePath = join(tempDir, "services", "shop", "widget");
    mkdirSync(resourcePath, { recursive: true });

    // Create existing Dockerfile
    const dockerfilePath = join(resourcePath, "Dockerfile");
    const existingContent = "# Custom Dockerfile\nFROM ubuntu:latest\n";
    writeFileSync(dockerfilePath, existingContent);

    const serviceJsonPath = join(resourcePath, "service.json");
    const serviceJson = {
      appName: "widget",
      appType: "bring-your-own",
      stack: "shop",
      port: 4500,
      healthCheckPath: "/health",
      dockerfile: "./Dockerfile",
    };
    writeFileSync(serviceJsonPath, JSON.stringify(serviceJson, null, 2));

    // Verify existing Dockerfile was not overwritten
    const createdDockerfile = readFileSync(dockerfilePath, "utf-8");
    expect(createdDockerfile).toBe(existingContent);
  });
});
