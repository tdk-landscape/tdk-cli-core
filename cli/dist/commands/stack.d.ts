import { Command } from "commander";
type StackResourceConfig = {
    [key: string]: unknown;
    appName?: string;
    stack?: string;
};
export declare function parseStackResourceConfig(content: string, configPath: string): StackResourceConfig;
export declare const stackCommand: Command;
export {};
//# sourceMappingURL=stack.d.ts.map