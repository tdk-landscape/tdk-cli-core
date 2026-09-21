#!/usr/bin/env node

import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const cliPath = join(__dirname, "..", "dist", "cli.js");

import(cliPath).catch((err) => {
  console.error("Failed to start TDK:", err);
  process.exit(1);
});
