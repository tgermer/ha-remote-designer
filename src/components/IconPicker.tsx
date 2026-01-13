import { useEffect, useMemo, useState } from "react";
import { getMdiPath } from "../app/mdi";
import { FEATURES } from "../app/featureFlags";
import { hasHueIcon, listHueIcons } from "../hue/hueIcons";
import { isSupportedHaIcon, renderHaIconAtMm } from "../render/renderHaIcon";
import * as MDIJS from "@mdi/js";

// Curated default suggestions (Home Automation-ish). User can still search ALL icons.
const MDI_HOME_AUTOMATION_DEFAULT: string[] = ["mdi:home-assistant", "mdi:home", "mdi:lightbulb", "mdi:lightbulb-outline", "mdi:lightbulb-on-outline", "mdi:lightbulb-off-outline", "mdi:lamp", "mdi:ceiling-light", "mdi:ceiling-fan", "mdi:fan", "mdi:fan-off", "mdi:power", "mdi:power-plug", "mdi:power-socket-eu", "mdi:switch", "mdi:toggle-switch", "mdi:door", "mdi:door-open", "mdi:window-open", "mdi:lock", "mdi:lock-open-variant-outline", "mdi:thermometer", "mdi:thermostat", "mdi:radiator", "mdi:hvac", "mdi:air-conditioner", "mdi:weather-night", "mdi:motion-sensor", "mdi:motion-sensor-off", "mdi:cctv", "mdi:camera", "mdi:alarm-light", "mdi:alarm", "mdi:water", "mdi:water-pump", "mdi:curtains", "mdi:roller-shade", "mdi:blinds", "mdi:garage", "mdi:garage-open"];

function IconPreview({ icon }: { icon: string }) {
    const t = icon.trim();
    if (!t) return null;

    if (t.startsWith("mdi:")) {
        const d = getMdiPath(t);
        if (!d) return <div className="iconpicker__previewFallback">?</div>;
        return (
            <svg width={22} height={22} viewBox="0 0 24 24" aria-label={t}>
                <path d={d} />
            </svg>
        );
    }

    if (t.startsWith("hue:")) {
        if (!FEATURES.HUE_ICONS || !hasHueIcon(t)) return <div className="iconpicker__previewFallback">?</div>;
        return (
            <svg width={22} height={22} viewBox="0 0 24 24" aria-label={t}>
                {renderHaIconAtMm({ icon: t, cx: 12, cy: 12, iconMm: 24 })}
            </svg>
        );
    }

    return <div className="iconpicker__previewFallback">?</div>;
}

function exportKeysToHaNames(): string[] {
    // Convert @mdi/js export keys like "mdiLightbulbOutline" -> "mdi:lightbulb-outline"
    return Object.keys(MDIJS)
        .filter((k) => k.startsWith("mdi") && typeof (MDIJS as any)[k] === "string")
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

export function IconPicker({ value, onChange, placeholder }: { value: string | undefined; onChange: (next: string | undefined) => void; placeholder?: string }) {
    const [text, setText] = useState(value ?? "");

    // Which browser panel is open: 'mdi' | 'hue' | null
    const [browser, setBrowser] = useState<"mdi" | "hue" | null>(null);

    // MDI / Hue search queries
    const [mdiQuery, setMdiQuery] = useState("");
    const [hueQuery, setHueQuery] = useState("");

    // Unique instance id for focus tracking and global focus event handler
    const [instanceId] = useState(() => `ip_${Math.random().toString(36).slice(2)}`);

    useEffect(() => {
        const handler = (e: Event) => {
            const otherId = (e as CustomEvent<string>).detail;
            if (otherId && otherId !== instanceId) {
                // Close this picker's panels when another picker gains focus.
                setBrowser(null);
            }
        };
        window.addEventListener("iconpicker:focus", handler as EventListener);
        return () => window.removeEventListener("iconpicker:focus", handler as EventListener);
    }, [instanceId]);

    useEffect(() => {
        setText(value ?? "");
        // If external value is cleared, also close panels for a clean feel.
        if (!value) setBrowser(null);
    }, [value]);

    const effectivePlaceholder = placeholder ?? (FEATURES.HUE_ICONS ? "mdi:... or hue:..." : "mdi:...");

    const valid = useMemo(() => {
        const t = text.trim();
        if (!t) return true;
        return isSupportedHaIcon(t);
    }, [text]);

    // Build full MDI list once
    const allMdiIcons = useMemo(() => exportKeysToHaNames(), []);

    // Auto-open panel based on early prefix while typing (m/mdi... or h/hue...)
    useEffect(() => {
        const t = text.trim().toLowerCase();

        // Early open on single-letter prefixes
        if (t === "h" && FEATURES.HUE_ICONS) {
            setBrowser("hue");
            return;
        }
        if (t === "m") {
            setBrowser("mdi");
            return;
        }

        // Open when user starts typing the family name (before the colon)
        if ((t.startsWith("hue") || t.startsWith("hue:")) && FEATURES.HUE_ICONS) {
            setBrowser("hue");
            return;
        }
        if (t.startsWith("mdi") || t.startsWith("mdi:")) {
            setBrowser("mdi");
            return;
        }

        // Keep existing behavior for full prefixes
        if (t.startsWith("hue:") && FEATURES.HUE_ICONS) {
            setBrowser("hue");
            return;
        }
        if (t.startsWith("mdi:")) {
            setBrowser("mdi");
            return;
        }
    }, [text]);

    const mdiFiltered = useMemo(() => {
        const q = mdiQuery.trim().toLowerCase();
        if (!q) {
            // Default: curated Home Automation list, but only those that exist in @mdi/js.
            const set = new Set(allMdiIcons);
            return MDI_HOME_AUTOMATION_DEFAULT.filter((x) => set.has(x));
        }
        // Search all icons (contains match)
        return allMdiIcons.filter((x) => x.includes(q));
    }, [mdiQuery, allMdiIcons]);

    const allHueIcons = useMemo(() => (FEATURES.HUE_ICONS ? listHueIcons() : []), []);

    const hueFiltered = useMemo(() => {
        if (!FEATURES.HUE_ICONS) return [];
        const q = hueQuery.trim().toLowerCase();
        if (!q) return allHueIcons;
        return allHueIcons.filter((x) => x.toLowerCase().includes(q));
    }, [hueQuery, allHueIcons]);

    const applyCurrent = () => onChange(text.trim() ? text.trim() : undefined);

    return (
        <div className="iconpicker">
            <div className="iconpicker__row">
                <input
                    className="iconpicker__input"
                    value={text}
                    onChange={(e) => setText(e.target.value)}
                    onFocus={() => {
                        window.dispatchEvent(new CustomEvent("iconpicker:focus", { detail: instanceId }));

                        const t = text.trim().toLowerCase();
                        // If user has already started with a hint, open the matching browser.
                        if ((t === "h" || t.startsWith("hue")) && FEATURES.HUE_ICONS) setBrowser("hue");
                        else if (t === "m" || t.startsWith("mdi")) setBrowser("mdi");
                    }}
                    placeholder={effectivePlaceholder}
                    aria-invalid={!valid}
                />

                <button type="button" className={`iconpicker__btn ${browser === "mdi" ? "iconpicker__btn--active" : ""}`} onClick={() => setBrowser((b) => (b === "mdi" ? null : "mdi"))} title="Browse MDI icons">
                    MDI
                </button>

                {FEATURES.HUE_ICONS && (
                    <button type="button" className={`iconpicker__btn ${browser === "hue" ? "iconpicker__btn--active" : ""}`} onClick={() => setBrowser((b) => (b === "hue" ? null : "hue"))} title="Browse Hue icons">
                        Hue
                    </button>
                )}

                <button
                    type="button"
                    className="iconpicker__btn"
                    onClick={() => {
                        setText("");
                        setBrowser(null);
                        setMdiQuery("");
                        setHueQuery("");
                        onChange(undefined);
                    }}
                    disabled={!value && !text.trim()}
                >
                    Delete
                </button>
            </div>

            <div className="iconpicker__row iconpicker__row--secondary">
                <div className="iconpicker__preview">{text.trim() ? <IconPreview icon={text.trim()} /> : null}</div>

                <button type="button" className="iconpicker__btn" onClick={applyCurrent} disabled={!valid}>
                    Apply
                </button>

                {!valid && (
                    <div className="iconpicker__error">
                        Unknown icon. Supported: <code>mdi:</code>
                        {FEATURES.HUE_ICONS ? (
                            <>
                                {" "}
                                or <code>hue:</code>
                            </>
                        ) : null}
                    </div>
                )}
            </div>

            {/* MDI browser (panel + search + grid) */}
            {browser === "mdi" ? (
                <section className="iconpicker__panel" aria-label="MDI icon browser">
                    <header className="iconpicker__panelHeader">
                        <div className="iconpicker__panelTitle">
                            <strong>MDI Icons</strong>
                            <span className="iconpicker__panelCount">
                                ({mdiFiltered.length}
                                {mdiQuery.trim() ? " / all" : " / home automation"})
                            </span>
                        </div>
                        <button type="button" className="iconpicker__btn" onClick={() => setBrowser(null)} aria-label="Close MDI browser">
                            Close
                        </button>
                    </header>

                    <input className="iconpicker__search" value={mdiQuery} onChange={(e) => setMdiQuery(e.target.value)} placeholder='Search MDI (try "light", "thermo", "curtain"...)' />

                    <div className="iconpicker__grid" role="list">
                        {mdiFiltered.slice(0, 300).map((icon) => (
                            <button
                                key={icon}
                                type="button"
                                className="iconpicker__tile"
                                onClick={() => {
                                    setText(icon);
                                    onChange(icon);
                                }}
                                title={icon}
                                role="listitem"
                            >
                                <span className="iconpicker__tileIcon">
                                    <IconPreview icon={icon} />
                                </span>
                                <span className="iconpicker__tileText">{icon}</span>
                            </button>
                        ))}
                    </div>

                    {mdiFiltered.length > 300 && <div className="iconpicker__hint">More than 300 results — refine your search.</div>}
                </section>
            ) : null}

            {/* Hue browser (existing panel) */}
            {FEATURES.HUE_ICONS && browser === "hue" ? (
                <section className="iconpicker__panel" aria-label="Hue icon browser">
                    <header className="iconpicker__panelHeader">
                        <div className="iconpicker__panelTitle">
                            <strong>Hue Icons</strong>
                            <span className="iconpicker__panelCount">({allHueIcons.length})</span>
                        </div>
                        <button type="button" className="iconpicker__btn" onClick={() => setBrowser(null)} aria-label="Close Hue browser">
                            Close
                        </button>
                    </header>

                    <input className="iconpicker__search" value={hueQuery} onChange={(e) => setHueQuery(e.target.value)} placeholder='Search e.g. "bulb", "spot", "ceiling"...' />

                    <div className="iconpicker__grid" role="list">
                        {hueFiltered.slice(0, 300).map((icon) => (
                            <button
                                key={icon}
                                type="button"
                                className="iconpicker__tile"
                                onClick={() => {
                                    setText(icon);
                                    onChange(icon);
                                }}
                                title={icon}
                                role="listitem"
                            >
                                <span className="iconpicker__tileIcon">
                                    <IconPreview icon={icon} />
                                </span>
                                <span className="iconpicker__tileText">{icon}</span>
                            </button>
                        ))}
                    </div>

                    {hueFiltered.length > 300 && <div className="iconpicker__hint">More than 300 results — refine your search.</div>}

                    {hueFiltered.length === 0 && (
                        <div className="iconpicker__hint">
                            No results. (Are SVGs present in <code>src/hue/svgs</code>?)
                        </div>
                    )}
                </section>
            ) : null}
        </div>
    );
}
