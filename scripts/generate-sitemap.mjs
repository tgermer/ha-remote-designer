import { readFileSync, writeFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, "..");
const appFile = path.join(rootDir, "src", "App.tsx");
const sitemapFile = path.join(rootDir, "public", "sitemap.xml");

const SITE_URL = (process.env.SITE_URL || "https://clearcontrol.de").replace(/\/+$/, "");

const VIEW_EXCLUDE = new Set(["ogImageLab"]);
const VIEW_DEFAULTS = {
    home: { changefreq: "weekly", priority: "1.0" },
    configure: { changefreq: "weekly", priority: "0.9" },
    gallery: { changefreq: "weekly", priority: "0.8" },
    help: { changefreq: "monthly", priority: "0.7" },
    community: { changefreq: "weekly", priority: "0.7" },
    story: { changefreq: "monthly", priority: "0.7" },
};

const LEGAL_DEFAULTS = {
    changefreq: "yearly",
    priority: "0.3",
};

function escapeXml(input) {
    return input
        .replaceAll("&", "&amp;")
        .replaceAll("<", "&lt;")
        .replaceAll(">", "&gt;")
        .replaceAll('"', "&quot;")
        .replaceAll("'", "&apos;");
}

function extractObjectBody(source, constName) {
    const pattern = new RegExp(`const\\s+${constName}\\s*:[^=]+?=\\s*\\{([\\s\\S]*?)\\n\\};`);
    const match = source.match(pattern);
    if (!match) {
        throw new Error(`Could not find object literal for ${constName} in src/App.tsx`);
    }
    return match[1];
}

function parseEntriesFromBody(body) {
    const entries = [];
    const linePattern = /^\s*([a-zA-Z0-9_]+)\s*:\s*"([^"]+)"\s*,?\s*$/gm;
    let match;
    while ((match = linePattern.exec(body)) !== null) {
        entries.push({ key: match[1], value: match[2] });
    }
    return entries;
}

function ensureLeadingSlash(input) {
    if (!input) return "/";
    return input.startsWith("/") ? input : `/${input}`;
}

function createUrlEntry(loc, changefreq, priority) {
    return `  <url>
    <loc>${escapeXml(loc)}</loc>
    <changefreq>${changefreq}</changefreq>
    <priority>${priority}</priority>
  </url>`;
}

function main() {
    const appSource = readFileSync(appFile, "utf8");
    const viewBody = extractObjectBody(appSource, "VIEW_PATHS");
    const legalBody = extractObjectBody(appSource, "LEGAL_PATHS");

    const urls = [];
    const seen = new Set();

    for (const entry of parseEntriesFromBody(viewBody)) {
        if (VIEW_EXCLUDE.has(entry.key)) continue;
        const routePath = ensureLeadingSlash(entry.value);
        const loc = `${SITE_URL}${routePath === "/" ? "" : routePath}`;
        if (seen.has(loc)) continue;
        seen.add(loc);
        const defaults = VIEW_DEFAULTS[entry.key] || { changefreq: "monthly", priority: "0.6" };
        urls.push(createUrlEntry(loc, defaults.changefreq, defaults.priority));
    }

    for (const entry of parseEntriesFromBody(legalBody)) {
        const routePath = ensureLeadingSlash(entry.value);
        const loc = `${SITE_URL}${routePath}`;
        if (seen.has(loc)) continue;
        seen.add(loc);
        urls.push(createUrlEntry(loc, LEGAL_DEFAULTS.changefreq, LEGAL_DEFAULTS.priority));
    }

    const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls.join("\n")}
</urlset>
`;

    writeFileSync(sitemapFile, xml, "utf8");
    console.log(`Generated sitemap with ${urls.length} URLs at ${path.relative(rootDir, sitemapFile)}`);
}

main();
