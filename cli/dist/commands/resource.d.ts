import { Command } from "commander";
import { getBackendIndexTemplate } from "../backend-languages/bun.js";
import type { CreatableResourceType } from "../types/index.js";
export declare const BASE_TEMPLATE: {
    readonly port: 0;
    readonly dependencies: readonly [];
    readonly build: {
        readonly dockerfile: "Dockerfile";
        readonly context: ".";
    };
    readonly dev: {
        readonly command: "bun run dev";
        readonly watch: readonly ["src/**/*"];
    };
};
interface TypeSpecificConfig {
    healthCheck?: string;
    dev?: {
        command: string;
        watch: string[];
    };
}
export declare const TYPE_SPECIFIC: Record<CreatableResourceType, TypeSpecificConfig>;
export declare function resolveByoPort(value: string | undefined, assignedPort: number, resources: Array<{
    config?: {
        port?: number;
    };
}>): number;
export declare function createServiceJson(name: string, type: CreatableResourceType, stack: string, port: number, extraFeatures?: string[], frameworkId?: string, languageId?: string): any;
export declare function createPackageJson(name: string, type: string, frameworkId?: string): {
    name: string;
    version: string;
    type: string;
    scripts: {
        dev: string;
        build: string;
        start?: string | undefined;
        test: string;
        lint: string;
        "lint:fix": string;
    };
    dependencies: {
        [x: string]: string;
    };
    devDependencies: {
        "@types/bun": string;
        "@types/node": string;
        typescript: string;
        vitest: string;
        "@biomejs/biome": string;
        vite?: string | undefined;
    };
};
export declare function createResourceTsconfig(resourceType: CreatableResourceType, frameworkId?: string): {
    compilerOptions: {
        target: string;
        module: string;
        moduleResolution: string;
        strict: boolean;
        esModuleInterop: boolean;
        skipLibCheck: boolean;
        forceConsistentCasingInFileNames: boolean;
        outDir: string;
        rootDir: string;
        declaration: boolean;
        declarationMap: boolean;
        sourceMap: boolean;
    };
    include: string[];
    exclude: string[];
};
export declare const TSCONFIG_TEMPLATE: {
    compilerOptions: {
        target: string;
        module: string;
        moduleResolution: string;
        strict: boolean;
        esModuleInterop: boolean;
        skipLibCheck: boolean;
        forceConsistentCasingInFileNames: boolean;
        outDir: string;
        rootDir: string;
        declaration: boolean;
        declarationMap: boolean;
        sourceMap: boolean;
    };
    include: string[];
    exclude: string[];
};
export declare const DOCKERFILE_TEMPLATE = "FROM oven/bun:1.2\n\nWORKDIR /app\n\n# Copy package files\nCOPY package.json bun.lock ./\n\n# Install dependencies\nRUN bun install --frozen-lockfile\n\n# Copy source\nCOPY . .\n\n# Build if needed\nRUN bun run build\n\n# Health check\nHEALTHCHECK --interval=10s --timeout=5s --retries=3 \\\n  CMD curl -f http://localhost:3000/health || exit 1\n\nEXPOSE 3000\n\nCMD [\"bun\", \"run\", \"start\"]\n";
export { getBackendIndexTemplate };
export declare function getWorkerIndexTemplate(name: string): string;
export declare const resourceCommand: Command;
//# sourceMappingURL=resource.d.ts.map