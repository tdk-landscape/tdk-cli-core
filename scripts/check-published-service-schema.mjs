import { readFile } from "node:fs/promises";

const schemaUrl = "https://tdk-landscape.github.io/schema.service.json";
const sourcePath = new URL("../engine/schemas/service-schema.json", import.meta.url);
const source = await readFile(sourcePath, "utf8");
const response = await fetch(schemaUrl, { cache: "no-store" });

if (!response.ok) {
  throw new Error(`Could not fetch published service schema (${response.status}): ${schemaUrl}`);
}

const published = await response.text();
if (published !== source) {
  throw new Error(
    `Published service schema differs from engine/schemas/service-schema.json. ` +
      `Sync and deploy the Pages schema before merging changes to the source schema.`,
  );
}

console.log("Published service schema matches engine/schemas/service-schema.json.");
