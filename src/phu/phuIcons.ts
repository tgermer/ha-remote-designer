import { FEATURES } from "../app/featureFlags";

const phuIconsUrl = new URL("./phu-icons.json", import.meta.url).href;

type PhuIconDef = {
    path: string;
    viewBox: string;
};

let phuIconsByName: Record<string, PhuIconDef> | null = null;
let loadPromise: Promise<void> | null = null;
const listeners = new Set<() => void>();

function notifyListeners() {
    for (const cb of listeners) cb();
}

export function subscribePhuIcons(cb: () => void) {
    listeners.add(cb);
    return () => listeners.delete(cb);
}

export function getPhuIconsLoadedSnapshot() {
    return phuIconsByName !== null;
}

export async function preloadPhuIcons() {
    if (!isPhuEnabled()) return;
    if (phuIconsByName) return;
    if (!loadPromise) {
        loadPromise = (async () => {
            const resp = await fetch(phuIconsUrl);
            if (!resp.ok) throw new Error(`Failed to load Custom Brand icons: ${resp.status}`);
            const data = (await resp.json()) as Record<string, PhuIconDef>;
            phuIconsByName = data;
            loadPromise = null;
            notifyListeners();
        })();
    }
    return loadPromise;
}

export function isPhuEnabled() {
    return FEATURES.PHU_ICONS;
}

export function isPhuIcon(icon: string) {
    return icon.startsWith("phu:");
}

export function phuName(icon: string) {
    return icon.startsWith("phu:") ? icon.slice(4) : icon;
}

export function hasPhuIcon(icon: string) {
    if (!isPhuEnabled()) return false;
    const name = phuName(icon);
    return !!phuIconsByName?.[name];
}

export function getPhuIcon(icon: string) {
    if (!isPhuEnabled()) return null;
    const name = phuName(icon);
    return phuIconsByName?.[name] ?? null;
}

export function listPhuIcons() {
    if (!isPhuEnabled()) return [];
    if (!phuIconsByName) return [];
    return Object.keys(phuIconsByName).sort().map((name) => `phu:${name}`);
}
