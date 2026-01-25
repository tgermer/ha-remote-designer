import { MDI_HOME_AUTOMATION_DEFAULT } from "./mdiHomeSet";
import { MDI_HOME_PATHS } from "./mdiHomePaths";

function kebabToPascal(s: string) {
    return s
        .split("-")
        .filter(Boolean)
        .map((p) => p.charAt(0).toUpperCase() + p.slice(1))
        .join("");
}

let fullMdi: Record<string, string> | null = null;
let loadPromise: Promise<void> | null = null;
const listeners = new Set<() => void>();

function notifyListeners() {
    for (const cb of listeners) cb();
}

export function subscribeFullMdi(cb: () => void) {
    listeners.add(cb);
    return () => listeners.delete(cb);
}

export function getFullMdiLoadedSnapshot() {
    return fullMdi !== null;
}

export async function preloadFullMdi() {
    if (fullMdi) return;
    if (!loadPromise) {
        loadPromise = (async () => {
            const mod = await import("@mdi/js");
            fullMdi = mod as unknown as Record<string, string>;
            loadPromise = null;
            notifyListeners();
        })();
    }
    return loadPromise;
}

export function isMdiInHomeSet(haIcon: string) {
    return !!MDI_HOME_PATHS[haIcon];
}

export function listHomeMdiIcons() {
    return MDI_HOME_AUTOMATION_DEFAULT;
}

export function listFullMdiIcons() {
    if (!fullMdi) return [];
    return Object.keys(fullMdi)
        .filter((k) => k.startsWith("mdi"))
        .map(
            (k) =>
                "mdi:" +
                k
                    .replace(/^mdi/, "")
                    .replace(/([A-Z])/g, "-$1")
                    .toLowerCase()
                    .replace(/^-/, "")
        );
}

export function getMdiPath(haIcon: string): string | null {
    const direct = MDI_HOME_PATHS[haIcon];
    if (direct) return direct;

    if (!fullMdi) return null;
    const raw = haIcon.startsWith("mdi:") ? haIcon.slice(4) : haIcon;
    const key = `mdi${kebabToPascal(raw)}`;
    return fullMdi[key] ?? null;
}
