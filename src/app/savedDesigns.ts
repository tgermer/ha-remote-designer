import type { DesignState } from "./types";

export type SavedDesign = {
    id: string;
    name: string;
    state: DesignState;
    createdAt: number;
    updatedAt: number;
};

const SAVED_KEY = "ha-remote-designer:saved-designs:v1";

function safeParseSavedDesigns(raw: string | null): SavedDesign[] {
    if (!raw) return [];
    try {
        const parsed = JSON.parse(raw);
        return Array.isArray(parsed) ? (parsed as SavedDesign[]) : [];
    } catch {
        return [];
    }
}

export function readSavedDesigns(): SavedDesign[] {
    return safeParseSavedDesigns(window.localStorage.getItem(SAVED_KEY));
}

export function writeSavedDesigns(items: SavedDesign[]) {
    window.localStorage.setItem(SAVED_KEY, JSON.stringify(items));
}

export function newId(): string {
    // crypto.randomUUID is supported in modern browsers, fallback for older ones.
    const uuid = typeof crypto !== "undefined" && typeof crypto.randomUUID === "function" ? crypto.randomUUID() : null;

    return uuid ?? `id_${Date.now()}_${Math.random().toString(16).slice(2)}`;
}

export function normalizeName(name: string) {
    return name.trim().toLowerCase();
}

export function nameExistsForRemote(items: SavedDesign[], remoteId: string, name: string, ignoreId?: string) {
    const n = normalizeName(name);
    return items.some((d) => d.state.remoteId === remoteId && normalizeName(d.name) === n && d.id !== ignoreId);
}

export function withTimestamp(name: string) {
    const d = new Date();
    const pad = (n: number) => String(n).padStart(2, "0");
    return `${name} (${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())})`;
}
