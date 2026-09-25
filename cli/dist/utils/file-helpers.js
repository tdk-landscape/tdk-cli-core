import { existsSync, mkdirSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";
import chalk from "chalk";
export function writeFilesWithProgress(basePath, tasks, onProgress) {
    for (let i = 0; i < tasks.length; i++) {
        const task = tasks[i];
        console.log(chalk.blue(`${task.emoji} ${task.description}...`));
        if (task.type === "json") {
            writeJsonFileInDir(basePath, task.filename, task.content);
        }
        else {
            writeTextFileInDir(basePath, task.filename, String(task.content));
        }
        if (onProgress) {
            onProgress(task, i, tasks.length);
        }
    }
}
/**
 * Write JSON data to a file.
 * @param filePath - Path to the file
 * @param data - JSON-serializable data
 * @param space - Number of spaces for indentation (default: 2)
 */
export function writeJsonFile(filePath, data, space = 2) {
    const content = `${JSON.stringify(data, null, space)}\n`;
    writeFileSync(filePath, content, "utf-8");
}
export function writeJsonFileInDir(dir, filename, data, space = 2) {
    const filePath = resolve(dir, filename);
    writeJsonFile(filePath, data, space);
}
export function writeTextFile(filePath, content) {
    writeFileSync(filePath, content, "utf-8");
}
export function writeTextFileInDir(dir, filename, content) {
    const filePath = resolve(dir, filename);
    writeTextFile(filePath, content);
}
export function ensureDirectory(dirPath) {
    if (!existsSync(dirPath)) {
        mkdirSync(dirPath, { recursive: true });
    }
}
//# sourceMappingURL=file-helpers.js.map