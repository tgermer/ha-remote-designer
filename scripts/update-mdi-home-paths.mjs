#!/usr/bin/env node
// Run with: node scripts/update-mdi-home-paths.mjs
// When to run: after changing src/app/mdiHomeSet.ts to rebuild the home-set path map.
import fs from "node:fs";
import path from "node:path";
import * as MDI from "@mdi/js";

const root = process.cwd();
const listPath = path.join(root, "src/app/mdiHomeSet.ts");
const outPath = path.join(root, "src/app/mdiHomePaths.ts");

const text = fs.readFileSync(listPath, "utf8");
const icons = Array.from(new Set([...text.matchAll(/"(mdi:[^"]+)"/g)].map((m) => m[1])));

function kebabToPascal(s) {
    return s
        .split("-")
        .filter(Boolean)
        .map((p) => p.charAt(0).toUpperCase() + p.slice(1))
        .join("");
}

const missing = [];
const entries = [];
for (const icon of icons) {
    const raw = icon.startsWith("mdi:") ? icon.slice(4) : icon;
    const key = `mdi${kebabToPascal(raw)}`;
    const d = MDI[key];
    if (!d) {
        missing.push(icon);
        continue;
    }
    entries.push([icon, d]);
}

const lines = [];
lines.push("export const MDI_HOME_PATHS: Record<string, string> = {");
for (const [icon, d] of entries) {
    lines.push(`    \"${icon}\": \"${d.replace(/\\/g, "\\\\").replace(/\"/g, "\\\"")}",`);
}
lines.push("};\n");

fs.writeFileSync(outPath, lines.join("\n"));

if (missing.length) {
    console.warn(`Missing ${missing.length} icons: ${missing.join(", ")}`);
}
console.log(`Wrote ${entries.length} icons to ${outPath}`);
