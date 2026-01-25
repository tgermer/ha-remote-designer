import { FEATURES } from "../app/featureFlags";

// Lazy-load all SVGs from src/hue/svgs/*.svg as raw strings
const modules = import.meta.glob("./svgs/*.svg", { query: "?raw", import: "default" });

function filenameFromPath(path: string) {
    const parts = path.split("/");
    const file = parts[parts.length - 1] ?? "";
    return file.replace(/\.svg$/i, "");
}

let hueSvgByName: Record<string, string> | null = null;
let loadPromise: Promise<void> | null = null;
const listeners = new Set<() => void>();

function notifyListeners() {
    for (const cb of listeners) cb();
}

export function subscribeHueIcons(cb: () => void) {
    listeners.add(cb);
    return () => listeners.delete(cb);
}

export function getHueIconsLoadedSnapshot() {
    return hueSvgByName !== null;
}

export async function preloadHueIcons() {
    if (!isHueEnabled()) return;
    if (hueSvgByName) return;
    if (!loadPromise) {
        loadPromise = (async () => {
            const entries = await Promise.all(
                Object.entries(modules).map(async ([path, loader]) => {
                    const mod = await (loader as () => Promise<unknown>)();
                    return [filenameFromPath(path), mod as string] as const;
                })
            );
            hueSvgByName = Object.fromEntries(entries);
            loadPromise = null;
            notifyListeners();
        })();
    }
    return loadPromise;
}

export function isHueEnabled() {
    return FEATURES.HUE_ICONS;
}

export function isHueIcon(icon: string) {
    return icon.startsWith("hue:");
}

export function hueName(icon: string) {
    return icon.startsWith("hue:") ? icon.slice(4) : icon;
}

export function hasHueIcon(icon: string) {
    if (!isHueEnabled()) return false;
    const name = hueName(icon);
    return !!hueSvgByName?.[name];
}

export function getHueSvg(icon: string): string | null {
    if (!isHueEnabled()) return null;
    const name = hueName(icon);
    return hueSvgByName?.[name] ?? null;
}

export function listHueIcons(): string[] {
    if (!isHueEnabled()) return [];
    if (!hueSvgByName) return [];
    return Object.keys(hueSvgByName)
        .sort()
        .map((n) => `hue:${n}`);
}
