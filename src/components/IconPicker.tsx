import { useMemo, useState } from "react";
import { getMdiPath } from "../app/mdi";
import { FEATURES } from "../app/featureFlags";
import { hasHueIcon, listHueIcons } from "../hue/hueIcons";
import { isSupportedHaIcon, renderHaIconAtMm } from "../render/renderHaIcon";

const QUICK_MDI = ["mdi:lightbulb-on-outline", "mdi:lightbulb-off-outline", "mdi:brightness-5", "mdi:brightness-4", "mdi:weather-night", "mdi:palette-outline", "mdi:roller-shade"];

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

export function IconPicker({ value, onChange, placeholder }: { value: string | undefined; onChange: (next: string | undefined) => void; placeholder?: string }) {
    const [text, setText] = useState(value ?? "");
    const [showHueBrowser, setShowHueBrowser] = useState(false);
    const [hueQuery, setHueQuery] = useState("");

    const effectivePlaceholder = placeholder ?? (FEATURES.HUE_ICONS ? "mdi:... or hue:..." : "mdi:...");

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
        <div className="iconpicker">
            <div className="iconpicker__row">
                <input className="iconpicker__input" value={text} onChange={(e) => setText(e.target.value)} placeholder={effectivePlaceholder} aria-invalid={!valid} />

                {FEATURES.HUE_ICONS && (
                    <button type="button" className="iconpicker__btn" onClick={() => setShowHueBrowser((s) => !s)} title="Browse Hue Icons">
                        Hue
                    </button>
                )}

                <button type="button" className="iconpicker__btn" onClick={() => onChange(undefined)} disabled={!value}>
                    Delete
                </button>
            </div>

            <div className="iconpicker__row iconpicker__row--secondary">
                <div className="iconpicker__preview">{text.trim() ? <IconPreview icon={text.trim()} /> : null}</div>

                <button type="button" className="iconpicker__btn" onClick={() => onChange(text.trim() ? text.trim() : undefined)} disabled={!valid}>
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

            <section className="iconpicker__panel" aria-label="MDI icon browser">
                <header className="iconpicker__panelHeader">
                    <div className="iconpicker__panelTitle">
                        <strong>MDI Icons</strong>
                        <span className="iconpicker__panelCount">({mdiSuggestions.length})</span>
                    </div>
                </header>

                <div className="iconpicker__grid" role="list">
                    {mdiSuggestions.map((icon) => (
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
            </section>

            {FEATURES.HUE_ICONS && showHueBrowser && (
                <section className="iconpicker__panel" aria-label="Hue icon browser">
                    <header className="iconpicker__panelHeader">
                        <div className="iconpicker__panelTitle">
                            <strong>Hue Icons</strong>
                            <span className="iconpicker__panelCount">({allHueIcons.length})</span>
                        </div>
                        <button type="button" className="iconpicker__btn" onClick={() => setShowHueBrowser(false)} aria-label="Close Hue browser">
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
            )}
        </div>
    );
}
