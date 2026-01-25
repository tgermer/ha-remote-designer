import { FEATURES } from "../app/featureFlags";

// Hue icon map is built at update time into a single JSON file
const hueIconsUrl = new URL("./hue-icons.json", import.meta.url).href;

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
            const resp = await fetch(hueIconsUrl);
            if (!resp.ok) throw new Error(`Failed to load hue icons: ${resp.status}`);
            const data = (await resp.json()) as Record<string, string>;
            hueSvgByName = data;
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
