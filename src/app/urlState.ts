import { compressToEncodedURIComponent, decompressFromEncodedURIComponent } from "lz-string";

function readHashParts() {
    const raw = window.location.hash.replace(/^#/, "").trim();
    if (!raw) {
        return { packedState: "" };
    }
    if (raw.startsWith("/")) {
        // Legacy format from hash-based routing: #/configurator#<state>
        const splitIndex = raw.indexOf("#");
        if (splitIndex < 0) {
            return { packedState: "" };
        }
        return { packedState: raw.slice(splitIndex + 1).trim() };
    }
    return { packedState: raw };
}

export function saveToHash<T>(state: T) {
    const json = JSON.stringify(state);
    const packed = compressToEncodedURIComponent(json);
    const nextUrl = `${window.location.pathname}${window.location.search}#${packed}`;
    window.history.replaceState(null, "", nextUrl);
}

export function loadFromHash<T>(): T | null {
    const { packedState } = readHashParts();
    if (!packedState) return null;

    try {
        const json = decompressFromEncodedURIComponent(packedState);
        if (!json) return null;
        return JSON.parse(json) as T;
    } catch {
        return null;
    }
}
