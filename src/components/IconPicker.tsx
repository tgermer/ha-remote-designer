import React, { useMemo, useState } from "react";
import { getMdiPath } from "../app/mdi";
import { FEATURES } from "../app/featureFlags";
import { hasHueIcon, listHueIcons } from "../hue/hueIcons";
import { isSupportedHaIcon, renderHaIconAtMm } from "../render/renderHaIcon";

const QUICK_MDI = ["mdi:lightbulb-on-outline", "mdi:lightbulb-off-outline", "mdi:brightness-5", "mdi:brightness-4", "mdi:weather-night", "mdi:palette-outline", "mdi:scene"];

function IconPreview({ icon }: { icon: string }) {
    const t = icon.trim();
    if (!t) return null;

    if (t.startsWith("mdi:")) {
        const d = getMdiPath(t);
        if (!d) return <div style={{ fontSize: 12, opacity: 0.6 }}>?</div>;
        return (
            <svg width={22} height={22} viewBox="0 0 24 24" aria-label={t}>
                <path d={d} />
            </svg>
        );
    }

    if (t.startsWith("hue:")) {
        if (!FEATURES.HUE_ICONS || !hasHueIcon(t)) return <div style={{ fontSize: 12, opacity: 0.6 }}>?</div>;
        return (
            <svg width={22} height={22} viewBox="0 0 24 24" aria-label={t}>
                {renderHaIconAtMm({ icon: t, cx: 12, cy: 12, iconMm: 24 })}
            </svg>
        );
    }

    return <div style={{ fontSize: 12, opacity: 0.6 }}>?</div>;
}

export function IconPicker({ value, onChange, placeholder }: { value: string | undefined; onChange: (next: string | undefined) => void; placeholder?: string }) {
    const [text, setText] = useState(value ?? "");
    const [showHueBrowser, setShowHueBrowser] = useState(false);
    const [hueQuery, setHueQuery] = useState("");

    const effectivePlaceholder = placeholder ?? (FEATURES.HUE_ICONS ? "mdi:... oder hue:..." : "mdi:...");

    const valid = useMemo(() => {
        const t = text.trim();
        if (!t) return true;
        return isSupportedHaIcon(t);
    }, [text]);

    const mdiSuggestions = useMemo(() => {
        const q = text.trim().toLowerCase();
        if (!q) return QUICK_MDI;
        return QUICK_MDI.filter((x) => x.toLowerCase().includes(q));
    }, [text]);

    const allHueIcons = useMemo(() => (FEATURES.HUE_ICONS ? listHueIcons() : []), []);
    const hueFiltered = useMemo(() => {
        if (!FEATURES.HUE_ICONS) return [];
        const q = hueQuery.trim().toLowerCase();
        if (!q) return allHueIcons;
        return allHueIcons.filter((x) => x.toLowerCase().includes(q));
    }, [hueQuery, allHueIcons]);

    return (
        <div style={{ display: "grid", gap: 8 }}>
            <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                <input
                    value={text}
                    onChange={(e) => setText(e.target.value)}
                    placeholder={effectivePlaceholder}
                    style={{
                        padding: 8,
                        width: "100%",
                        border: `1px solid ${valid ? "#ccc" : "#d33"}`,
                        borderRadius: 8,
                    }}
                />

                {FEATURES.HUE_ICONS && (
                    <button type="button" onClick={() => setShowHueBrowser((s) => !s)} style={{ padding: "8px 10px" }} title="Hue Icon Browser">
                        Hue
                    </button>
                )}

                <button type="button" onClick={() => onChange(undefined)} disabled={!value} style={{ padding: "8px 10px" }}>
                    Löschen
                </button>
            </div>

            <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
                <div style={{ width: 26, height: 26, display: "grid", placeItems: "center" }}>{text.trim() ? <IconPreview icon={text.trim()} /> : null}</div>

                <button type="button" onClick={() => onChange(text.trim() ? text.trim() : undefined)} disabled={!valid} style={{ padding: "8px 10px" }}>
                    Übernehmen
                </button>

                {!valid && (
                    <div style={{ fontSize: 12, color: "#d33" }}>
                        Unbekanntes Icon. Unterstützt: <code>mdi:</code>
                        {FEATURES.HUE_ICONS ? (
                            <>
                                {" "}
                                oder <code>hue:</code>
                            </>
                        ) : null}
                    </div>
                )}
            </div>

            {/* MDI Quick Suggestions */}
            <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                {mdiSuggestions.map((s) => (
                    <button
                        key={s}
                        type="button"
                        onClick={() => {
                            setText(s);
                            onChange(s);
                        }}
                        style={{
                            display: "flex",
                            gap: 6,
                            alignItems: "center",
                            padding: "6px 8px",
                            border: "1px solid #ddd",
                            borderRadius: 999,
                            background: "white",
                        }}
                    >
                        <IconPreview icon={s} />
                        <span style={{ fontSize: 12 }}>{s}</span>
                    </button>
                ))}
            </div>

            {/* Hue Browser */}
            {FEATURES.HUE_ICONS && showHueBrowser && (
                <div style={{ border: "1px solid #ddd", borderRadius: 12, padding: 10, background: "white" }}>
                    <div style={{ display: "flex", gap: 8, alignItems: "center", marginBottom: 10 }}>
                        <strong style={{ fontSize: 13 }}>Hue Icons</strong>
                        <span style={{ fontSize: 12, opacity: 0.7 }}>({allHueIcons.length})</span>
                    </div>

                    <input
                        value={hueQuery}
                        onChange={(e) => setHueQuery(e.target.value)}
                        placeholder='Suche z.B. "bulb", "spot", "ceiling"...'
                        style={{
                            padding: 8,
                            width: "100%",
                            border: "1px solid #ccc",
                            borderRadius: 8,
                            marginBottom: 10,
                        }}
                    />

                    <div style={{ maxHeight: 220, overflow: "auto", display: "grid", gap: 6 }}>
                        {hueFiltered.slice(0, 300).map((icon) => (
                            <button
                                key={icon}
                                type="button"
                                onClick={() => {
                                    setText(icon);
                                    onChange(icon);
                                }}
                                style={{
                                    display: "flex",
                                    gap: 8,
                                    alignItems: "center",
                                    padding: "6px 8px",
                                    border: "1px solid #eee",
                                    borderRadius: 10,
                                    background: "white",
                                    textAlign: "left",
                                }}
                            >
                                <IconPreview icon={icon} />
                                <span style={{ fontSize: 12 }}>{icon}</span>
                            </button>
                        ))}
                        {hueFiltered.length > 300 && <div style={{ fontSize: 12, opacity: 0.7 }}>Mehr als 300 Treffer – Suchbegriff eingrenzen.</div>}
                        {hueFiltered.length === 0 && (
                            <div style={{ fontSize: 12, opacity: 0.7 }}>
                                Keine Treffer. (Sind SVGs in <code>src/hue/svgs</code> vorhanden?)
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}
