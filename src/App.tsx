import { useMemo, useState, useEffect, useRef } from "react";
import "./App.css";

import type { DesignState, TapType } from "./app/types";
import { REMOTES } from "./app/remotes";
import { RemoteSvg } from "./render/RemoteSvg";
import { ButtonLabelSvg } from "./render/buttonLabelSvg";
import { IconPicker } from "./components/IconPicker";
import { SiteHeader } from "./components/SiteHeader";
import { SiteFooter } from "./components/SiteFooter";

import { loadFromHash, saveToHash } from "./app/urlState";
import { serializeSvg, downloadTextFile } from "./app/exportSvg";
import { svgTextToPngBlobMm, downloadBlob } from "./app/exportPng";

import { FEATURES } from "./app/featureFlags";

import JSZip from "jszip";

// Load remote images from src/assets (png/svg/jpg/webp). Filenames must match the remote id.
const remoteImageModules = import.meta.glob("./assets/**/*.{png,svg,jpg,jpeg,webp}", {
    eager: true,
    query: "?url",
    import: "default",
});

function getRemoteImageUrl(remoteId: string): string | undefined {
    const id = String(remoteId);
    for (const [path, url] of Object.entries(remoteImageModules)) {
        const file = path.split("/").pop() ?? "";
        const base = file.replace(/\.(png|svg|jpe?g|webp)$/i, "");
        if (base === id) return url as string;
    }
    return undefined;
}

/* ----------------------------- initial state ----------------------------- */

const initial: DesignState = {
    remoteId: "hue_dimmer_v1",
    tapsEnabled: ["single", "double", "long"],
    buttonConfigs: {
        on: { icons: { single: "mdi:lightbulb-on-outline" } },
        up: { icons: { single: "mdi:brightness-5" } },
        down: { icons: { single: "mdi:brightness-4" } },
        off: { icons: { single: "mdi:lightbulb-off-outline" } },
    },
    options: {
        showTapMarkersAlways: true,
        showTapDividers: true,
        showRemoteOutline: true,
        showButtonOutlines: true,
        showGuides: false,
        showScaleBar: true,
        autoIconSizing: true,
        fixedIconMm: 8,
        tapMarkerFill: "outline",
    },
};

/* ------------------------------- helpers -------------------------------- */

function tapLabel(t: TapType) {
    if (t === "single") return "Tap";
    if (t === "double") return "Double Tap";
    return "Long Press";
}

function nextFrame() {
    return new Promise<void>((resolve) => requestAnimationFrame(() => resolve()));
}

/* --------------------------------- App ---------------------------------- */

export default function App() {
    useEffect(() => {
        document.title = "Remote Label Designer for Home Automation";
    }, []);

    const [state, setState] = useState<DesignState>(() => loadFromHash<DesignState>() ?? initial);

    /* persist state in URL */
    useEffect(() => {
        const t = window.setTimeout(() => saveToHash(state), 150);
        return () => window.clearTimeout(t);
    }, [state]);

    const template = useMemo(() => REMOTES.find((r) => r.id === state.remoteId) ?? REMOTES[0], [state.remoteId]);

    const examples = template.examples ?? [];
    const [selectedExampleId, setSelectedExampleId] = useState<string>(template.defaultExampleId ?? examples[0]?.id ?? "");

    // When switching remotes, reset example selection to the default for that remote.
    useEffect(() => {
        setSelectedExampleId(template.defaultExampleId ?? template.examples?.[0]?.id ?? "");
    }, [template.id]);

    const selectedExample = examples.find((e) => e.id === selectedExampleId);

    const [previewExampleOn, setPreviewExampleOn] = useState(false);

    const previewState: DesignState = useMemo(() => {
        if (!previewExampleOn || !selectedExample) return state;

        // clone current state
        const next: DesignState = {
            ...state,
            buttonConfigs: { ...state.buttonConfigs },
            options: { ...state.options },
            tapsEnabled: selectedExample.tapsEnabled,
        };

        // overlay example icons onto current config
        for (const [buttonId, iconsByTap] of Object.entries(selectedExample.buttonIcons)) {
            const existing = next.buttonConfigs[buttonId]?.icons ?? {};
            next.buttonConfigs[buttonId] = { icons: { ...existing, ...iconsByTap } };
        }

        // preview-friendly defaults
        next.options.showTapMarkersAlways = true;
        next.options.showTapDividers = selectedExample.tapsEnabled.length > 1;

        return next;
    }, [previewExampleOn, selectedExample, state]);

    const remoteImageUrl = getRemoteImageUrl(state.remoteId);

    // Admin gate for export controls
    const adminCode = new URLSearchParams(window.location.search).get("admin");
    const isAdmin = adminCode === import.meta.env.VITE_ADMIN_SECRET;

    const getShareUrl = () => {
        const url = new URL(window.location.href);
        url.searchParams.delete("admin"); // never leak admin param
        return url.toString();
    };

    const showWatermark = FEATURES.WATERMARK;
    const watermarkText = "PREVIEW PREVIEW PREVIEW";
    const watermarkOpacity = 0.2;

    /* ensure button configs exist when switching remotes */
    useEffect(() => {
        setState((s) => {
            const next = { ...s, buttonConfigs: { ...s.buttonConfigs } };
            for (const b of template.buttons) {
                if (!next.buttonConfigs[b.id]) next.buttonConfigs[b.id] = { icons: {} };
            }
            return next;
        });
    }, [template.id]);

    const buttonIds = template.buttons.map((b) => b.id);
    const o = state.options;

    const setIcon = (buttonId: string, tap: TapType, icon?: string) => {
        setState((s) => {
            const prev = s.buttonConfigs[buttonId]?.icons ?? {};
            const nextIcons = { ...prev } as any;
            if (icon) nextIcons[tap] = icon;
            else delete nextIcons[tap];
            return {
                ...s,
                buttonConfigs: {
                    ...s.buttonConfigs,
                    [buttonId]: { icons: nextIcons },
                },
            };
        });
    };

    /* ------------------------------ share link ----------------------------- */

    const [shareStatus, setShareStatus] = useState<"idle" | "copied" | "failed">("idle");

    const copyShareLink = async () => {
        try {
            // Ensure the URL hash contains the latest state before copying.
            saveToHash(state);

            // Read the updated URL (including the fresh hash).
            const url = getShareUrl();

            await navigator.clipboard.writeText(url);
            setShareStatus("copied");
            window.setTimeout(() => setShareStatus("idle"), 2000);
        } catch {
            setShareStatus("failed");
        }
    };

    /* ------------------------------ rest ----------------------------------- */

    const resetToDefaults = () => {
        // Remove the hash so it truly feels like “start from scratch”.
        window.history.replaceState(null, "", window.location.pathname + window.location.search);

        // Reset UI state
        setShareStatus("idle");
        setExportButtonId(null);
        setIsZipping(false);
        setDpi(203);

        // Reset the actual design state
        setState(initial);
    };

    /* ------------------------------ exporting ------------------------------ */

    const exportRemoteHostRef = useRef<HTMLDivElement | null>(null);
    const exportButtonHostRef = useRef<HTMLDivElement | null>(null);

    const exportRemoteSvg = () => {
        const svg = exportRemoteHostRef.current?.querySelector("svg");
        if (!svg) return;
        downloadTextFile(`${state.remoteId}-remote.svg`, serializeSvg(svg), "image/svg+xml");
    };

    const [dpi, setDpi] = useState(203);
    const [exportButtonId, setExportButtonId] = useState<string | null>(null);
    const [isZipping, setIsZipping] = useState(false);

    const exportZip = async () => {
        if (isZipping) return;
        setIsZipping(true);

        const zip = new JSZip();
        const folder = zip.folder(state.remoteId) ?? zip;

        for (const id of buttonIds) {
            setExportButtonId(id);
            await nextFrame();
            await nextFrame();

            const svg = exportButtonHostRef.current?.querySelector("svg");
            if (!svg) continue;

            const png = await svgTextToPngBlobMm({
                svgText: serializeSvg(svg),
                size: { widthMm: 40, heightMm: 30, dpi },
            });

            folder.file(`${id}.png`, png);
        }

        setExportButtonId(null);
        downloadBlob(`${state.remoteId}-labels.zip`, await zip.generateAsync({ type: "blob" }));
        setIsZipping(false);
    };

    const exportButton = exportButtonId ? template.buttons.find((b) => b.id === exportButtonId) : null;

    /* -------------------------------- render -------------------------------- */

    return (
        <main className="app">
            <SiteHeader isAdmin={isAdmin} />
            <section className="controls">
                {/* Remote */}
                <fieldset>
                    <legend>Remote</legend>
                    <div className="modelRow">
                        <label className="modelRow__label">
                            Model
                            <select value={state.remoteId} onChange={(e) => setState((s) => ({ ...s, remoteId: e.target.value as any }))}>
                                {REMOTES.map((r) => (
                                    <option key={r.id} value={r.id}>
                                        {r.name}
                                    </option>
                                ))}
                            </select>
                        </label>
                        <div className="modelRow__thumb" aria-label="Selected remote preview">
                            {remoteImageUrl ? <img src={remoteImageUrl} alt={`${state.remoteId} preview`} /> : <span className="modelRow__thumbFallback">No image</span>}
                        </div>
                    </div>
                </fieldset>

                {/* Examples (per remote) */}
                {examples.length ? (
                    <fieldset>
                        <legend>Examples</legend>

                        <label className="modelRow__label">
                            Choose an example for this remote
                            <select value={selectedExampleId} onChange={(e) => setSelectedExampleId(e.target.value)}>
                                {examples.map((ex) => (
                                    <option key={ex.id} value={ex.id}>
                                        {ex.name}
                                    </option>
                                ))}
                            </select>
                        </label>

                        {selectedExample?.description ? <p>{selectedExample.description}</p> : null}

                        <div className="row">
                            <div className="row">
                                <button type="button" disabled={!selectedExample} onClick={() => setPreviewExampleOn((v) => !v)}>
                                    {previewExampleOn ? "Stop preview" : "Preview"}
                                </button>

                                <button
                                    type="button"
                                    disabled={!selectedExample}
                                    onClick={() => {
                                        if (!selectedExample) return;

                                        setState((s) => {
                                            const next = { ...s, buttonConfigs: { ...s.buttonConfigs } };

                                            next.tapsEnabled = selectedExample.tapsEnabled;

                                            for (const [buttonId, iconsByTap] of Object.entries(selectedExample.buttonIcons)) {
                                                const existing = next.buttonConfigs[buttonId]?.icons ?? {};
                                                next.buttonConfigs[buttonId] = { icons: { ...existing, ...iconsByTap } };
                                            }

                                            next.options = {
                                                ...next.options,
                                                showTapMarkersAlways: true,
                                                showTapDividers: selectedExample.tapsEnabled.length > 1,
                                            };

                                            return next;
                                        });

                                        // optional: once applied, stop preview
                                        setPreviewExampleOn(false);
                                    }}
                                >
                                    Apply
                                </button>
                            </div>
                        </div>
                    </fieldset>
                ) : null}

                {/* Options */}
                <fieldset>
                    <legend>Options</legend>
                    <div className="options">
                        <label className="option">
                            <input
                                type="checkbox"
                                checked={o.showTapMarkersAlways}
                                onChange={(e) =>
                                    setState((s) => ({
                                        ...s,
                                        options: { ...s.options, showTapMarkersAlways: e.target.checked },
                                    }))
                                }
                            />
                            Show tap markers for single icon
                        </label>

                        <label className="option">
                            <input
                                type="checkbox"
                                checked={o.showTapDividers}
                                onChange={(e) =>
                                    setState((s) => ({
                                        ...s,
                                        options: { ...s.options, showTapDividers: e.target.checked },
                                    }))
                                }
                            />
                            Show dividers for multi icons
                        </label>

                        <label className="option">
                            Tap marker style
                            <select
                                value={o.tapMarkerFill}
                                onChange={(e) =>
                                    setState((s) => ({
                                        ...s,
                                        options: { ...s.options, tapMarkerFill: e.target.value as any },
                                    }))
                                }
                            >
                                <option value="outline">Outline</option>
                                <option value="filled">Filled</option>
                            </select>
                        </label>

                        <label className="option">
                            <input
                                type="checkbox"
                                checked={o.showRemoteOutline}
                                onChange={(e) =>
                                    setState((s) => ({
                                        ...s,
                                        options: { ...s.options, showRemoteOutline: e.target.checked },
                                    }))
                                }
                            />
                            Show remote outline
                        </label>

                        <label className="option">
                            <input
                                type="checkbox"
                                checked={o.showButtonOutlines}
                                onChange={(e) =>
                                    setState((s) => ({
                                        ...s,
                                        options: { ...s.options, showButtonOutlines: e.target.checked },
                                    }))
                                }
                            />
                            Show button outlines
                        </label>

                        <label className="option">
                            <input
                                type="checkbox"
                                checked={o.autoIconSizing}
                                onChange={(e) =>
                                    setState((s) => ({
                                        ...s,
                                        options: { ...s.options, autoIconSizing: e.target.checked },
                                    }))
                                }
                            />
                            Auto icon sizing
                        </label>

                        {!o.autoIconSizing && (
                            <label className="option">
                                Fixed icon size (mm)
                                <input
                                    type="number"
                                    min={4}
                                    max={14}
                                    step={0.5}
                                    value={o.fixedIconMm}
                                    onChange={(e) =>
                                        setState((s) => ({
                                            ...s,
                                            options: { ...s.options, fixedIconMm: Number(e.target.value) },
                                        }))
                                    }
                                />
                            </label>
                        )}

                        <label className="option">
                            <input
                                type="checkbox"
                                checked={o.showScaleBar}
                                onChange={(e) =>
                                    setState((s) => ({
                                        ...s,
                                        options: { ...s.options, showScaleBar: e.target.checked },
                                    }))
                                }
                            />
                            Show 1 cm scale bar (print check)
                        </label>
                    </div>
                </fieldset>

                <fieldset>
                    <legend>Share</legend>

                    <p className="share">
                        <button type="button" onClick={copyShareLink}>
                            Copy share link
                        </button>
                        {shareStatus === "copied" && (
                            <span className="share__status" role="status">
                                Copied!
                            </span>
                        )}
                    </p>

                    {shareStatus === "failed" && (
                        <div className="share__fallback">
                            <p className="share__hint">Clipboard access was blocked. Copy the URL manually:</p>
                            <input className="share__input" type="text" readOnly value={getShareUrl()} onFocus={(e) => e.currentTarget.select()} />
                        </div>
                    )}

                    <p>
                        <button type="button" onClick={resetToDefaults}>
                            Start from scratch
                        </button>
                    </p>
                </fieldset>

                <fieldset>
                    <legend>Export</legend>

                    <p>
                        <button onClick={exportRemoteSvg}>Export as SVG</button>
                    </p>
                </fieldset>

                {/* Export (admin only) */}
                {isAdmin ? (
                    <fieldset>
                        <legend>Admin Export</legend>

                        <p>
                            <button onClick={exportRemoteSvg}>Export as SVG</button>
                        </p>

                        <div className="exportRow">
                            <button onClick={exportZip} disabled={isZipping}>
                                {isZipping ? "Creating ZIP…" : "Export Button PNGs"}
                            </button>

                            <label className="exportRow__label">
                                DPI
                                <select value={dpi} onChange={(e) => setDpi(Number(e.target.value))}>
                                    <option value={203}>203</option>
                                    <option value={300}>300</option>
                                </select>
                            </label>
                        </div>
                    </fieldset>
                ) : null}

                {/* Buttons */}
                <section>
                    <h2>Buttons</h2>
                    {buttonIds.map((id) => (
                        <section key={id} className="button-config">
                            <h3>{id.toUpperCase()} Button</h3>
                            {(["single", "double", "long"] as TapType[]).map((tap) => (
                                <div key={tap}>
                                    <h4>{tapLabel(tap)}</h4>
                                    <IconPicker value={state.buttonConfigs[id]?.icons?.[tap]} onChange={(v) => setIcon(id, tap, v)} />
                                </div>
                            ))}
                        </section>
                    ))}
                </section>
            </section>

            {/* Preview */}
            <aside className="preview">
                <RemoteSvg template={template} state={previewState} showWatermark={showWatermark} watermarkText={watermarkText} watermarkOpacity={watermarkOpacity} overrides={{ showScaleBar: false }} />
            </aside>

            {/* Help */}
            <section className="help" aria-label="Icon help">
                <details className="help__details">
                    <summary>Icon help & sources</summary>
                    <div className="help__content">
                        <p>
                            This app supports all Material Design Icons (MDI). Browse and search icons here:{" "}
                            <a href="https://pictogrammers.com/library/mdi/" target="_blank" rel="noopener noreferrer">
                                pictogrammers.com/library/mdi
                            </a>
                            .
                        </p>

                        <p>
                            Hue icon previews are sourced from the <code>hass-hue-icons</code> project:{" "}
                            <a href="https://github.com/arallsopp/hass-hue-icons" target="_blank" rel="noopener noreferrer">
                                github.com/arallsopp/hass-hue-icons
                            </a>
                            .
                        </p>

                        <p className="help__note">
                            Tip: Copy the icon name from the MDI library (e.g. <code>mdi:lightbulb</code>) and paste it into the picker.
                        </p>
                    </div>
                </details>
            </section>

            {/* Hidden export renderers */}
            <div ref={exportRemoteHostRef} className="hidden">
                <RemoteSvg
                    template={template}
                    state={state}
                    showWatermark={showWatermark}
                    watermarkText={watermarkText}
                    watermarkOpacity={watermarkOpacity}
                    overrides={{
                        showRemoteOutline: false,
                        showGuides: false,
                        showButtonOutlines: true,
                        showScaleBar: o.showScaleBar,
                    }}
                    exportMode={{ squareButtons: false }}
                />
            </div>

            <div ref={exportButtonHostRef} className="hidden">
                {exportButton && <ButtonLabelSvg state={state} button={exportButton} labelWidthMm={40} labelHeightMm={30} showWatermark={showWatermark} watermarkText={watermarkText} watermarkOpacity={watermarkOpacity} />}
            </div>

            <SiteFooter />
        </main>
    );
}
