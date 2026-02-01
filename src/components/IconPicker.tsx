import { useEffect, useMemo, useRef, useState, useSyncExternalStore } from "react";
import { getMdiPath, getFullMdiLoadedSnapshot, isMdiInHomeSet, listFullMdiIcons, listHomeMdiIcons, preloadFullMdi, subscribeFullMdi } from "../app/mdi";
import { UiIcon } from "./UiIcon";
import { FEATURES } from "../app/featureFlags";
import { getHueIconsLoadedSnapshot, hasHueIcon, listHueIcons, preloadHueIcons, subscribeHueIcons } from "../hue/hueIcons";
import { getPhuIconsLoadedSnapshot, hasPhuIcon, listPhuIcons, preloadPhuIcons, subscribePhuIcons } from "../phu/phuIcons";
import { isSupportedHaIcon, renderHaIconAtMm } from "../render/renderHaIcon";

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

    if (t.startsWith("phu:")) {
        if (!FEATURES.PHU_ICONS || !hasPhuIcon(t)) return <div className="iconpicker__previewFallback">?</div>;
        return (
            <svg width={22} height={22} viewBox="0 0 24 24" aria-label={t}>
                {renderHaIconAtMm({ icon: t, cx: 12, cy: 12, iconMm: 24 })}
            </svg>
        );
    }

    return <div className="iconpicker__previewFallback">?</div>;
}

export function IconPicker({ value, onChange, placeholder }: { value: string | undefined; onChange: (next: string | undefined) => void; placeholder?: string }) {
    const [draft, setDraft] = useState(value ?? "");
    const [isEditing, setIsEditing] = useState(false);
    const draftRef = useRef(draft);

    // Which browser panel is open: 'mdi' | 'hue' | null
    const [browser, setBrowser] = useState<"mdi" | "hue" | "phu" | null>(null);

    // MDI / Hue / Custom Brand search queries
    const [mdiQuery, setMdiQuery] = useState("");
    const [hueQuery, setHueQuery] = useState("");
    const [phuQuery, setPhuQuery] = useState("");

    // Keep all browsers closed on initial page load. Only auto-open after user interaction.
    const [hasInteracted, setHasInteracted] = useState(false);

    // Unique instance id for focus tracking and global focus event handler
    const [instanceId] = useState(() => `ip_${Math.random().toString(36).slice(2)}`);

    const openBrowserExclusive = (next: "mdi" | "hue" | "phu") => {
        window.dispatchEvent(new CustomEvent("iconpicker:focus", { detail: instanceId }));
        setBrowser(next);
    };

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

    const placeholderParts = ["mdi:..."];
    if (FEATURES.HUE_ICONS) placeholderParts.push("hue:...");
    if (FEATURES.PHU_ICONS) placeholderParts.push("phu:...");
    const effectivePlaceholder = placeholder ?? placeholderParts.join(" or ");

    const fullMdiLoaded = useSyncExternalStore(subscribeFullMdi, getFullMdiLoadedSnapshot);
    const [mdiRequested, setMdiRequested] = useState(false);
    const allMdiIcons = useMemo(() => (fullMdiLoaded ? listFullMdiIcons() : listHomeMdiIcons()), [fullMdiLoaded]);

    // Auto-open panel based on early prefix while typing (m/mdi... or h/hue...)
    const maybeAutoOpenBrowser = (nextText: string) => {
        if (!hasInteracted) return;
        const t = nextText.trim().toLowerCase();

        // Early open on single-letter prefixes
        if (t === "h" && FEATURES.HUE_ICONS) {
            if (!hueIconsLoaded) {
                setHueRequested(true);
                void preloadHueIcons();
            }
            openBrowserExclusive("hue");
            return;
        }
        if (t === "m") {
            openBrowserExclusive("mdi");
            return;
        }

        // Open when user starts typing the family name (before the colon)
        if (FEATURES.PHU_ICONS && (t.startsWith("phu") || t.startsWith("phu:"))) {
            if (!phuIconsLoaded) {
                setPhuRequested(true);
                void preloadPhuIcons();
            }
            openBrowserExclusive("phu");
            return;
        }
        if ((t.startsWith("hue") || t.startsWith("hue:")) && FEATURES.HUE_ICONS) {
            if (!hueIconsLoaded) {
                setHueRequested(true);
                void preloadHueIcons();
            }
            openBrowserExclusive("hue");
            return;
        }
        if (t.startsWith("mdi") || t.startsWith("mdi:")) {
            openBrowserExclusive("mdi");
            return;
        }

        // Keep existing behavior for full prefixes
        if (t.startsWith("hue:") && FEATURES.HUE_ICONS) {
            if (!hueIconsLoaded) {
                setHueRequested(true);
                void preloadHueIcons();
            }
            openBrowserExclusive("hue");
            return;
        }
        if (t.startsWith("mdi:")) {
            openBrowserExclusive("mdi");
            return;
        }
    };

    const mdiFiltered = useMemo(() => {
        const q = mdiQuery.trim().toLowerCase();
        if (!q) {
            // Default: curated Home Automation list, but only those that exist in @mdi/js.
            const set = new Set(allMdiIcons);
            return listHomeMdiIcons().filter((x) => set.has(x));
        }
        // Search all icons (contains match)
        return allMdiIcons.filter((x) => x.includes(q));
    }, [mdiQuery, allMdiIcons]);

    const hueIconsLoaded = useSyncExternalStore(subscribeHueIcons, getHueIconsLoadedSnapshot);
    const [hueRequested, setHueRequested] = useState(false);
    const allHueIcons = FEATURES.HUE_ICONS && hueIconsLoaded ? listHueIcons() : [];

    const phuIconsLoaded = useSyncExternalStore(subscribePhuIcons, getPhuIconsLoadedSnapshot);
    const [phuRequested, setPhuRequested] = useState(false);
    const allPhuIcons = FEATURES.PHU_ICONS && phuIconsLoaded ? listPhuIcons() : [];

    const hueFiltered = (() => {
        if (!FEATURES.HUE_ICONS) return [];
        const q = hueQuery.trim().toLowerCase();
        if (!q) return allHueIcons;
        return allHueIcons.filter((x) => x.toLowerCase().includes(q));
    })();

    const phuFiltered = (() => {
        if (!FEATURES.PHU_ICONS) return [];
        const q = phuQuery.trim().toLowerCase();
        if (!q) return allPhuIcons;
        return allPhuIcons.filter((x) => x.toLowerCase().includes(q));
    })();

    const valid = (() => {
        const t = (isEditing ? draft : (value ?? "")).trim();
        if (!t) return true;
        if (t.startsWith("mdi:") && !fullMdiLoaded && !isMdiInHomeSet(t)) return true;
        if (t.startsWith("hue:") && FEATURES.HUE_ICONS && !hueIconsLoaded) return true;
        if (t.startsWith("phu:") && FEATURES.PHU_ICONS && !phuIconsLoaded) return true;
        return isSupportedHaIcon(t);
    })();

    const currentText = isEditing ? draft : (value ?? "");

    const mdiRequestedByValue = (() => {
        const t = (value ?? "").trim();
        return t.startsWith("mdi:") && !fullMdiLoaded && !isMdiInHomeSet(t);
    })();
    const hueRequestedByValue = (() => {
        const t = (value ?? "").trim();
        return t.startsWith("hue:") && FEATURES.HUE_ICONS && !hueIconsLoaded;
    })();
    const phuRequestedByValue = (() => {
        const t = (value ?? "").trim();
        return t.startsWith("phu:") && FEATURES.PHU_ICONS && !phuIconsLoaded;
    })();

    const mdiLoading = (mdiRequested || mdiRequestedByValue) && !fullMdiLoaded;
    const hueLoading = (hueRequested || hueRequestedByValue) && !hueIconsLoaded;
    const phuLoading = (phuRequested || phuRequestedByValue) && !phuIconsLoaded;

    useEffect(() => {
        draftRef.current = draft;
    }, [draft]);

    const applyCurrent = (nextText?: string) => {
        const trimmed = (nextText ?? currentText).trim();
        onChange(trimmed ? trimmed : undefined);
        setIsEditing(false);
    };

    useEffect(() => {
        const t = (value ?? "").trim();
        if (t.startsWith("mdi:") && !fullMdiLoaded && !isMdiInHomeSet(t)) {
            void preloadFullMdi();
        }
        if (t.startsWith("hue:") && FEATURES.HUE_ICONS && !hueIconsLoaded) {
            void preloadHueIcons();
        }
        if (t.startsWith("phu:") && FEATURES.PHU_ICONS && !phuIconsLoaded) {
            void preloadPhuIcons();
        }
    }, [value, fullMdiLoaded, hueIconsLoaded, phuIconsLoaded]);

    return (
        <div className="iconpicker">
            <div className="iconpicker__row">
                <input
                    className="iconpicker__input"
                    value={currentText}
                    onChange={(e) => {
                        setHasInteracted(true);
                        setIsEditing(true);
                        const next = e.target.value;
                        setDraft(next);
                        maybeAutoOpenBrowser(e.target.value);
                        if (next.trim().startsWith("mdi:") && !fullMdiLoaded && !isMdiInHomeSet(next.trim())) {
                            setMdiRequested(true);
                            void preloadFullMdi();
                        }
                        if (next.trim().startsWith("phu:") && FEATURES.PHU_ICONS && !phuIconsLoaded) {
                            setPhuRequested(true);
                            void preloadPhuIcons();
                        }
                    }}
                    onFocus={() => {
                        setHasInteracted(true);
                        setIsEditing(true);
                        setDraft(value ?? "");
                        window.dispatchEvent(new CustomEvent("iconpicker:focus", { detail: instanceId }));

                        const t = (value ?? "").trim().toLowerCase();
                        // If user has already started with a hint, open the matching browser.
                        if (FEATURES.PHU_ICONS && t.startsWith("phu")) {
                            if (!phuIconsLoaded) {
                                setPhuRequested(true);
                                void preloadPhuIcons();
                            }
                            openBrowserExclusive("phu");
                        } else if ((t === "h" || t.startsWith("hue")) && FEATURES.HUE_ICONS) {
                            if (!hueIconsLoaded) {
                                setHueRequested(true);
                                void preloadHueIcons();
                            }
                            openBrowserExclusive("hue");
                        } else if (t === "m" || t.startsWith("mdi")) openBrowserExclusive("mdi");
                    }}
                    onBlur={() => {
                        setIsEditing(false);
                    }}
                    placeholder={effectivePlaceholder}
                    aria-invalid={!valid}
                />

                <button
                    type="button"
                    className={`iconpicker__btn ${browser === "mdi" ? "iconpicker__btn--active" : ""}`}
                    onClick={() => {
                        setHasInteracted(true);
                        if (!fullMdiLoaded) {
                            setMdiRequested(true);
                            void preloadFullMdi();
                        }
                        setBrowser((b) => {
                            if (b === "mdi") return null;
                            window.dispatchEvent(new CustomEvent("iconpicker:focus", { detail: instanceId }));
                            return "mdi";
                        });
                    }}
                    title="Browse MDI icons"
                >
                    MDI
                </button>

                {FEATURES.PHU_ICONS && (
                    <button
                        type="button"
                        className={`iconpicker__btn ${browser === "phu" ? "iconpicker__btn--active" : ""}`}
                        onClick={() => {
                            setHasInteracted(true);
                            if (!phuIconsLoaded) {
                                setPhuRequested(true);
                                void preloadPhuIcons();
                            }
                            setBrowser((b) => {
                                if (b === "phu") return null;
                                window.dispatchEvent(new CustomEvent("iconpicker:focus", { detail: instanceId }));
                                return "phu";
                            });
                        }}
                        title="Browse Custom Brand icons"
                    >
                        PHU
                    </button>
                )}

                {FEATURES.HUE_ICONS && (
                    <button
                        type="button"
                        className={`iconpicker__btn ${browser === "hue" ? "iconpicker__btn--active" : ""}`}
                        onClick={() => {
                            setHasInteracted(true);
                            if (!hueIconsLoaded) {
                                setHueRequested(true);
                                void preloadHueIcons();
                            }
                            setBrowser((b) => {
                                if (b === "hue") return null;
                                window.dispatchEvent(new CustomEvent("iconpicker:focus", { detail: instanceId }));
                                return "hue";
                            });
                        }}
                        title="Browse Hue icons"
                    >
                        Hue
                    </button>
                )}

                <button
                    type="button"
                    className="iconpicker__btn btn btn--danger"
                    onClick={() => {
                        setHasInteracted(true);
                        setIsEditing(true);
                        setDraft("");
                        setBrowser(null);
                        setMdiQuery("");
                        setHueQuery("");
                        onChange(undefined);
                        setIsEditing(false);
                    }}
                    disabled={!value && !currentText.trim()}
                    aria-label="Delete icon"
                    title="Delete icon"
                >
                    <UiIcon name="mdi:delete-outline" className="icon" />
                </button>
            </div>

            <div className="iconpicker__row iconpicker__row--secondary">
                <div className="iconpicker__preview">{currentText.trim() ? <IconPreview icon={currentText.trim()} /> : null}</div>

                <button
                    type="button"
                    className="iconpicker__btn"
                    onMouseDown={(e) => {
                        e.preventDefault();
                        applyCurrent(draftRef.current);
                    }}
                    onClick={() => applyCurrent()}
                    disabled={!valid}
                >
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
                        {FEATURES.PHU_ICONS ? (
                            <>
                                {" "}
                                or <code>phu:</code>
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
                            {mdiLoading && <span className="iconpicker__panelLoading">Loading…</span>}
                            <span className="iconpicker__panelCount">
                                ({mdiFiltered.length}
                                {mdiQuery.trim() ? " / all" : " / home automation"})
                            </span>
                        </div>
                        <button type="button" className="iconpicker__btn" onClick={() => setBrowser(null)} aria-label="Close MDI browser">
                            <UiIcon name="mdi:close-circle-outline" className="icon" />
                            Close
                        </button>
                    </header>

                    <input
                        className="iconpicker__search"
                        value={mdiQuery}
                        onChange={(e) => {
                            const next = e.target.value;
                            setMdiQuery(next);
                            if (next.trim() && !fullMdiLoaded) {
                                setMdiRequested(true);
                                void preloadFullMdi();
                            }
                        }}
                        placeholder='Search MDI (try "light", "thermo", "curtain"...)'
                        disabled={mdiLoading}
                    />

                    <div className="iconpicker__grid" role="list" aria-busy={mdiLoading}>
                        {mdiLoading ? (
                            <div className="iconpicker__hint">Loading full MDI catalog…</div>
                        ) : (
                            mdiFiltered.slice(0, 300).map((icon) => (
                                <button
                                    key={icon}
                                    type="button"
                                    className="iconpicker__tile"
                                    onClick={() => {
                                        setDraft(icon);
                                        setIsEditing(false);
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
                            ))
                        )}
                    </div>

                    {mdiFiltered.length > 300 && !mdiLoading && <div className="iconpicker__hint">More than 300 results — refine your search.</div>}

                    {mdiLoading && (
                        <div className="iconpicker__loadingOverlay" role="status" aria-live="polite">
                            <div className="iconpicker__spinner" aria-hidden="true" />
                            <div className="iconpicker__loadingText">Loading MDI icons…</div>
                        </div>
                    )}
                </section>
            ) : null}

            {/* Hue browser (existing panel) */}
            {FEATURES.HUE_ICONS && browser === "hue" ? (
                <section className="iconpicker__panel" aria-label="Hue icon browser">
                    <header className="iconpicker__panelHeader">
                        <div className="iconpicker__panelTitle">
                            <strong>Hue Icons</strong>
                            {hueLoading && <span className="iconpicker__panelLoading">Loading…</span>}
                            <span className="iconpicker__panelCount">({allHueIcons.length})</span>
                        </div>
                        <button type="button" className="iconpicker__btn" onClick={() => setBrowser(null)} aria-label="Close Hue browser">
                            <UiIcon name="mdi:close-circle-outline" className="icon" />
                            Close
                        </button>
                    </header>

                    <input className="iconpicker__search" value={hueQuery} onChange={(e) => setHueQuery(e.target.value)} placeholder='Search e.g. "bulb", "spot", "ceiling"...' disabled={hueLoading} />

                    <div className="iconpicker__grid" role="list" aria-busy={hueLoading}>
                        {hueLoading ? (
                            <div className="iconpicker__hint">Loading Hue icons…</div>
                        ) : (
                            hueFiltered.slice(0, 300).map((icon) => (
                                <button
                                    key={icon}
                                    type="button"
                                    className="iconpicker__tile"
                                    onClick={() => {
                                        setDraft(icon);
                                        setIsEditing(false);
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
                            ))
                        )}
                    </div>

                    {hueFiltered.length > 300 && !hueLoading && <div className="iconpicker__hint">More than 300 results — refine your search.</div>}

                    {hueFiltered.length === 0 && !hueLoading && (
                        <div className="iconpicker__hint">
                            No results. (Are SVGs present in <code>src/hue/svgs</code>?)
                        </div>
                    )}

                    {hueLoading && (
                        <div className="iconpicker__loadingOverlay" role="status" aria-live="polite">
                            <div className="iconpicker__spinner" aria-hidden="true" />
                            <div className="iconpicker__loadingText">Loading Hue icons…</div>
                        </div>
                    )}
                </section>
            ) : null}

            {/* Custom Brand browser */}
            {FEATURES.PHU_ICONS && browser === "phu" ? (
                <section className="iconpicker__panel" aria-label="Custom Brand icon browser">
                    <header className="iconpicker__panelHeader">
                        <div className="iconpicker__panelTitle">
                            <strong>Custom Brand Icons</strong>
                            {phuLoading && <span className="iconpicker__panelLoading">Loading…</span>}
                            <span className="iconpicker__panelCount">({allPhuIcons.length})</span>
                        </div>
                        <button type="button" className="iconpicker__btn" onClick={() => setBrowser(null)} aria-label="Close Custom Brand browser">
                            <UiIcon name="mdi:close-circle-outline" className="icon" />
                            Close
                        </button>
                    </header>

                    <input className="iconpicker__search" value={phuQuery} onChange={(e) => setPhuQuery(e.target.value)} placeholder='Search e.g. "tv", "play", "wall"...' disabled={phuLoading} />

                    <div className="iconpicker__grid" role="list" aria-busy={phuLoading}>
                        {phuLoading ? (
                            <div className="iconpicker__hint">Loading Custom Brand icons…</div>
                        ) : (
                            phuFiltered.slice(0, 300).map((icon) => (
                                <button
                                    key={icon}
                                    type="button"
                                    className="iconpicker__tile"
                                    onClick={() => {
                                        setDraft(icon);
                                        setIsEditing(false);
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
                            ))
                        )}
                    </div>

                    {phuFiltered.length > 300 && !phuLoading && <div className="iconpicker__hint">More than 300 results — refine your search.</div>}

                    {phuFiltered.length === 0 && !phuLoading && (
                        <div className="iconpicker__hint">
                            No results. (Is <code>src/phu/phu-icons.json</code> populated?)
                        </div>
                    )}

                    {phuLoading && (
                        <div className="iconpicker__loadingOverlay" role="status" aria-live="polite">
                            <div className="iconpicker__spinner" aria-hidden="true" />
                            <div className="iconpicker__loadingText">Loading Custom Brand icons…</div>
                        </div>
                    )}
                </section>
            ) : null}
        </div>
    );
}
