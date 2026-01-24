#!/usr/bin/env node
// Ausführen mit: node scripts/update-hue-icons.mjs
import fs from "node:fs";
import path from "node:path";
import os from "node:os";
import { execSync } from "node:child_process";

const REPO_URL = "https://github.com/arallsopp/hass-hue-icons.git";
const TMP_DIR = path.join(os.tmpdir(), "hass-hue-icons");
const TARGET_DIR = path.join(process.cwd(), "src/hue/svgs");

function rmrf(p) {
    fs.rmSync(p, { recursive: true, force: true });
}

function mkdirp(p) {
    fs.mkdirSync(p, { recursive: true });
}

function walkSvgs(dir) {
    const out = [];
    if (!fs.existsSync(dir)) return out;

    const stack = [dir];
    while (stack.length) {
        const d = stack.pop();
        for (const ent of fs.readdirSync(d, { withFileTypes: true })) {
            const full = path.join(d, ent.name);
            if (ent.isDirectory()) stack.push(full);
            else if (ent.isFile() && ent.name.toLowerCase().endsWith(".svg")) out.push(full);
        }
    }
    return out;
}

console.log("▶ Updating Hue icons…");

// fresh clone
rmrf(TMP_DIR);
execSync(`git clone ${REPO_URL} "${TMP_DIR}"`, { stdio: "inherit" });

// rebuild target completely
rmrf(TARGET_DIR);
mkdirp(TARGET_DIR);

const sources = [path.join(TMP_DIR, "docs/svgs"), path.join(TMP_DIR, "docs/custom_svgs")];

const seen = new Map(); // basename -> first full path
let dupCount = 0;
let copied = 0;

for (const src of sources) {
    const files = walkSvgs(src);
    for (const f of files) {
        const base = path.basename(f);

        if (seen.has(base)) {
            dupCount++;
            console.warn(`⚠️  DUPLICATE: ${base}`);
            console.warn(`    first: ${seen.get(base)}`);
            console.warn(`    next : ${f}`);
        } else {
            seen.set(base, f);
        }

        fs.copyFileSync(f, path.join(TARGET_DIR, base));
        copied++;
    }
}

const finalCount = fs.existsSync(TARGET_DIR) ? fs.readdirSync(TARGET_DIR).length : 0;

console.log("✔ Done.");
console.log(`  copied files : ${copied}`);
console.log(`  duplicates   : ${dupCount} (last one wins in flat target folder)`);
console.log(`  final svgs   : ${finalCount} in ${TARGET_DIR}`);
console.log("\nℹ️  Restart Vite after updating icons:\n   npm run dev");
