import { compressToEncodedURIComponent, decompressFromEncodedURIComponent } from "lz-string";

export function saveToHash<T>(state: T) {
    const json = JSON.stringify(state);
    const packed = compressToEncodedURIComponent(json);
    window.location.hash = packed;
}

export function loadFromHash<T>(): T | null {
    const hash = window.location.hash.replace(/^#/, "").trim();
    if (!hash) return null;

    try {
        const json = decompressFromEncodedURIComponent(hash);
        if (!json) return null;
        return JSON.parse(json) as T;
    } catch {
        return null;
    }
}
