import { readFileSync } from "node:fs";
import path from "node:path";

const root = path.resolve(import.meta.dirname, "..");
JSON.parse(readFileSync(path.join(root, "src", "manifest.json"), "utf8"));
