import type { FileGenerationTask } from "../types/index.js";
export declare function writeFilesWithProgress(basePath: string, tasks: FileGenerationTask[], onProgress?: (task: FileGenerationTask, index: number, total: number) => void): void;
/**
 * Write JSON data to a file.
 * @param filePath - Path to the file
 * @param data - JSON-serializable data
 * @param space - Number of spaces for indentation (default: 2)
 */
export declare function writeJsonFile(filePath: string, data: unknown, space?: number): void;
export declare function writeJsonFileInDir(dir: string, filename: string, data: unknown, space?: number): void;
export declare function writeTextFile(filePath: string, content: string): void;
export declare function writeTextFileInDir(dir: string, filename: string, content: string): void;
export declare function ensureDirectory(dirPath: string): void;
//# sourceMappingURL=file-helpers.d.ts.map