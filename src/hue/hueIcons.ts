import { FEATURES } from "../app/featureFlags";

// Loads all SVGs from src/hue/svgs/*.svg as raw strings
const modules = import.meta.glob("./svgs/*.svg", { as: "raw", eager: true });

function filenameFromPath(path: string) {
    const parts = path.split("/");
    const file = parts[parts.length - 1] ?? "";
    return file.replace(/\.svg$/i, "");
}

const hueSvgByName: Record<string, string> = Object.fromEntries(Object.entries(modules).map(([path, svg]) => [filenameFromPath(path), svg as string]));

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
    return !!hueSvgByName[name];
}

export function getHueSvg(icon: string): string | null {
    if (!isHueEnabled()) return null;
    const name = hueName(icon);
    return hueSvgByName[name] ?? null;
}

export function listHueIcons(): string[] {
    if (!isHueEnabled()) return [];
    return Object.keys(hueSvgByName)
        .sort()
        .map((n) => `hue:${n}`);
}
