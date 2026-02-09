#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";
import os from "node:os";
import { execSync } from "node:child_process";

const REPO_URL = "https://github.com/elax46/custom-brand-icons.git";
const TMP_DIR = path.join(os.tmpdir(), "custom-brand-icons");
const ICONS_DIR = path.join(TMP_DIR, "icon-svg");
const TARGET_JSON = path.join(process.cwd(), "src/phu/phu-icons.json");

function rmrf(p) {
    fs.rmSync(p, { recursive: true, force: true });
}

function walkSvgs(dir) {
    const out = [];
    if (!fs.existsSync(dir)) return out;
    const stack = [dir];
    while (stack.length) {
        const next = stack.pop();
        for (const entry of fs.readdirSync(next, { withFileTypes: true })) {
            const full = path.join(next, entry.name);
            if (entry.isDirectory()) {
                stack.push(full);
            } else if (entry.isFile() && entry.name.toLowerCase().endsWith(".svg")) {
                out.push(full);
            }
        }
    }
    return out;
}

function extractPath(svg) {
    const m = svg.match(/<path[^>]*d="([^"]+)"/i);
    return m ? m[1] : null;
}

function extractViewBox(svg) {
    const m = svg.match(/viewBox\s*=\s*"([^"]+)"/i);
    return m ? m[1] : "0 0 24 24";
}

console.log("▶ Updating Custom Brand icons…");

rmrf(TMP_DIR);
execSync(`git clone ${REPO_URL} "${TMP_DIR}"`, { stdio: "inherit" });

const map = {};
const files = walkSvgs(ICONS_DIR);

for (const file of files) {
    const svg = fs.readFileSync(file, "utf8");
    const name = path.basename(file, ".svg");
    const pathData = extractPath(svg);
    if (!pathData) {
        console.warn(`⚠️  Skipping icon without path: ${name}`);
        continue;
    }
    map[name] = {
        path: pathData,
        viewBox: extractViewBox(svg),
    };
}

fs.mkdirSync(path.dirname(TARGET_JSON), { recursive: true });
fs.writeFileSync(TARGET_JSON, JSON.stringify(map));

console.log("✔ Done.");
console.log(`  icons        : ${Object.keys(map).length}`);
console.log(`  json map     : ${TARGET_JSON}`);
