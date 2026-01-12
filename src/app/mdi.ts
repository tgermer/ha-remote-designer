import * as MDI from "@mdi/js";

function kebabToPascal(s: string) {
    return s
        .split("-")
        .filter(Boolean)
        .map((p) => p.charAt(0).toUpperCase() + p.slice(1))
        .join("");
}

export function getMdiPath(haIcon: string): string | null {
    const raw = haIcon.startsWith("mdi:") ? haIcon.slice(4) : haIcon;
    const key = `mdi${kebabToPascal(raw)}`;
    const dict = MDI as Record<string, string>;
    return dict[key] ?? null;
}
