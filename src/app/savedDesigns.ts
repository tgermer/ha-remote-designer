import type { DesignState } from "./types";

export type SavedDesign = {
    id: string;
    name: string;
    state: DesignState;
    createdAt: number;
    updatedAt: number;
};

const SAVED_KEY = "ha-remote-designer:saved-designs:v1";
const EXPORT_APP = "ha-remote-labeler";
const EXPORT_VERSION = 1;

export type SavedDesignsExport = {
    app: typeof EXPORT_APP;
    version: typeof EXPORT_VERSION;
    exportedAt: number;
    items: SavedDesign[];
};

export type SavedDesignsImportResult = {
    items: SavedDesign[];
    invalidCount: number;
    error?: string;
};

function isRecord(value: unknown): value is Record<string, unknown> {
    return typeof value === "object" && value !== null;
}

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

export function encodeSavedDesignsExport(items: SavedDesign[]): SavedDesignsExport {
    return {
        app: EXPORT_APP,
        version: EXPORT_VERSION,
        exportedAt: Date.now(),
        items,
    };
}

export function parseSavedDesignsImport(raw: string): SavedDesignsImportResult {
    const trimmed = raw.trim();
    if (!trimmed) {
        return { items: [], invalidCount: 0, error: "File is empty." };
    }

    let parsed: unknown;
    try {
        parsed = JSON.parse(trimmed);
    } catch {
        return { items: [], invalidCount: 0, error: "File is not valid JSON." };
    }

    if (isRecord(parsed) && typeof parsed.version === "number" && parsed.version !== EXPORT_VERSION) {
        return { items: [], invalidCount: 0, error: `Unsupported export version (${parsed.version}).` };
    }

    const itemsRaw = Array.isArray(parsed)
        ? parsed
        : isRecord(parsed) && Array.isArray(parsed.items)
          ? parsed.items
          : null;

    if (!itemsRaw) {
        return { items: [], invalidCount: 0, error: "No saved remotes found in file." };
    }

    const now = Date.now();
    const items: SavedDesign[] = [];
    let invalidCount = 0;

    for (const rawItem of itemsRaw) {
        if (!isRecord(rawItem)) {
            invalidCount += 1;
            continue;
        }

        const name = typeof rawItem.name === "string" ? rawItem.name.trim() : "";
        const state = isRecord(rawItem.state) ? (rawItem.state as DesignState) : null;
        if (!name || !state) {
            invalidCount += 1;
            continue;
        }

        const id = typeof rawItem.id === "string" && rawItem.id ? rawItem.id : newId();
        const createdAt = typeof rawItem.createdAt === "number" ? rawItem.createdAt : now;
        const updatedAt = typeof rawItem.updatedAt === "number" ? rawItem.updatedAt : createdAt;

        items.push({
            id,
            name,
            state,
            createdAt,
            updatedAt,
        });
    }

    return { items, invalidCount };
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
