import { useMemo, useState, useEffect, useRef } from "react";
import "./App.css";

import { TAP_ORDER, type DesignState, type TapType } from "./app/types";
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

/* ----------------------------- Saved designs (localStorage) ----------------------------- */

type SavedDesign = {
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

function readSavedDesigns(): SavedDesign[] {
    return safeParseSavedDesigns(window.localStorage.getItem(SAVED_KEY));
}

function writeSavedDesigns(items: SavedDesign[]) {
    window.localStorage.setItem(SAVED_KEY, JSON.stringify(items));
}

function newId(): string {
    // crypto.randomUUID is supported in modern browsers, fallback for older ones.
    const uuid = typeof crypto !== "undefined" && typeof (crypto as any).randomUUID === "function" ? (crypto as any).randomUUID() : null;

    return uuid ?? `id_${Date.now()}_${Math.random().toString(16).slice(2)}`;
}

function normalizeName(name: string) {
    return name.trim().toLowerCase();
}

function nameExistsForRemote(items: SavedDesign[], remoteId: string, name: string, ignoreId?: string) {
    const n = normalizeName(name);
    return items.some((d) => d.state.remoteId === remoteId && normalizeName(d.name) === n && d.id !== ignoreId);
}

function withTimestamp(name: string) {
    const d = new Date();
    const pad = (n: number) => String(n).padStart(2, "0");
    return `${name} (${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())})`;
}

function sanitizeFilenameBase(input: string) {
    // Make filenames predictable and safe.
    // - normalize diacritics
    // - replace various unicode dashes with '-'
    // - whitespace -> '-'
    // - remove remaining non [a-zA-Z0-9._-]
    // - collapse repeated '-'
    const s = input
        .normalize("NFKD")
        .replace(/[\u2010-\u2015]/g, "-")
        .replace(/\s+/g, "-")
        .replace(/[\u0300-\u036f]/g, "")
        .replace(/[^a-zA-Z0-9._-]+/g, "-")
        .replace(/-+/g, "-")
        .replace(/^[-.]+|[-.]+$/g, "");

    return s || "untitled";
}

function getExportBaseName(params: { saveName: string; remoteId: string }) {
    const n = params.saveName.trim();
    if (!n) return params.remoteId;

    const safe = sanitizeFilenameBase(n);
    // Always include the model id for clarity
    return `${safe}-${params.remoteId}`;
}

/* ----------------------------- initial state ----------------------------- */

const initial: DesignState = {
    remoteId: "hue_dimmer_v1",
    tapsEnabled: ["single"],
    buttonConfigs: {},
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
        labelOutlineColor: "#ccc",
        labelOutlineStrokeMm: 0.1,
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

    /* ----------------------------- Saved designs UI state ----------------------------- */
    const [savedDesigns, setSavedDesigns] = useState<SavedDesign[]>([]);

    // Name input for saving (also used for rename)
    const [saveName, setSaveName] = useState<string>("");
    const [saveNameError, setSaveNameError] = useState<string>("");

    // Dropdown selection
    const [selectedSavedId, setSelectedSavedId] = useState<string>("");

    // The currently loaded design (document) we are editing
    const [activeSavedId, setActiveSavedId] = useState<string | null>(null);
    const [loadedSnapshot, setLoadedSnapshot] = useState<DesignState | null>(null);
    const [loadedName, setLoadedName] = useState<string>("");

    const refreshSavedDesigns = () => {
        const items = readSavedDesigns().sort((a, b) => b.updatedAt - a.updatedAt);
        setSavedDesigns(items);

        // Keep dropdown selection valid
        if (items.length && selectedSavedId && !items.some((x) => x.id === selectedSavedId)) {
            setSelectedSavedId(items[0].id);
        }
        if (!items.length) {
            setSelectedSavedId("");
        }

        // Keep active document valid
        if (activeSavedId && !items.some((x) => x.id === activeSavedId)) {
            setActiveSavedId(null);
            setLoadedSnapshot(null);
            setLoadedName("");
        }
    };

    const exportBase = useMemo(() => getExportBaseName({ saveName, remoteId: state.remoteId }), [saveName, state.remoteId]);

    // Load saved designs once on mount
    useEffect(() => {
        const items = readSavedDesigns().sort((a, b) => b.updatedAt - a.updatedAt);
        setSavedDesigns(items);
        if (items.length) setSelectedSavedId(items[0].id);
    }, []);

    // Dirty check: any change to state or the name compared to the loaded design
    const stateSig = useMemo(() => JSON.stringify(state), [state]);
    const loadedSig = useMemo(() => (loadedSnapshot ? JSON.stringify(loadedSnapshot) : ""), [loadedSnapshot]);
    const hasUnsavedChanges = activeSavedId !== null && (stateSig !== loadedSig || saveName.trim() !== loadedName.trim());

    const loadSelectedDesign = () => {
        const items = readSavedDesigns();
        const found = items.find((d) => d.id === selectedSavedId);
        if (!found) return;

        setState(found.state);
        setPreviewExampleOn(false);

        setActiveSavedId(found.id);
        setLoadedSnapshot(found.state);
        setLoadedName(found.name);
        setSaveName(found.name);
        setSaveNameError("");
    };

    const saveAsNewDesign = () => {
        const name = saveName.trim();
        if (!name) return;

        const now = Date.now();
        const existing = readSavedDesigns();

        // If the name already exists for this remote model, auto-append a timestamp.
        const finalName = nameExistsForRemote(existing, state.remoteId, name) ? withTimestamp(name) : name;
        setSaveNameError("");

        const created: SavedDesign = {
            id: newId(),
            name: finalName,
            state,
            createdAt: now,
            updatedAt: now,
        };

        writeSavedDesigns([created, ...existing]);

        // make it the active document
        setSelectedSavedId(created.id);
        setActiveSavedId(created.id);
        setLoadedSnapshot(state);
        setLoadedName(finalName);
        setSaveName(finalName);

        refreshSavedDesigns();
    };

    const saveActiveDesign = () => {
        if (!activeSavedId) return;
        const name = saveName.trim();
        if (!name) return;

        const now = Date.now();
        const existing = readSavedDesigns();
        const idx = existing.findIndex((d) => d.id === activeSavedId);
        if (idx < 0) return;

        // Block renaming to an existing name for the same remote model.
        if (nameExistsForRemote(existing, state.remoteId, name, activeSavedId)) {
            setSaveNameError("Name already exists for this remote model. Choose another name or use Save as.");
            return;
        }
        setSaveNameError("");

        const updated: SavedDesign = {
            ...existing[idx],
            name,
            state,
            updatedAt: now,
        };

        const next = [...existing];
        next[idx] = updated;
        writeSavedDesigns(next);

        setLoadedSnapshot(state);
        setLoadedName(name);
        setSelectedSavedId(activeSavedId);

        refreshSavedDesigns();
    };

    const deleteSelectedDesign = () => {
        if (!selectedSavedId) return;
        const next = readSavedDesigns().filter((d) => d.id !== selectedSavedId);
        writeSavedDesigns(next);

        // If we deleted the active document, clear it
        if (activeSavedId === selectedSavedId) {
            setActiveSavedId(null);
            setLoadedSnapshot(null);
            setLoadedName("");
        }

        refreshSavedDesigns();
    };

    /* persist state in URL */
    useEffect(() => {
        const t = window.setTimeout(() => saveToHash(state), 150);
        return () => window.clearTimeout(t);
    }, [state]);

    const template = useMemo(() => REMOTES.find((r) => r.id === state.remoteId) ?? REMOTES[0], [state.remoteId]);

    const remoteNameById = useMemo(() => {
        return new Map(REMOTES.map((r) => [r.id, r.name] as const));
    }, []);

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

        // Apply example-specific options first (e.g. hide single-tap marker for Aqara factory)
        if (selectedExample.options) {
            next.options = { ...next.options, ...selectedExample.options };
        }

        // Sensible defaults ONLY if the example did not specify them
        if (selectedExample.options?.showTapMarkersAlways === undefined) {
            next.options.showTapMarkersAlways = true;
        }
        if (selectedExample.options?.showTapDividers === undefined) {
            next.options.showTapDividers = selectedExample.tapsEnabled.length > 1;
        }

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
            // If user sets a double/long icon, auto-enable that tap mode globally
            let nextTapsEnabled = s.tapsEnabled;
            if (icon && !s.tapsEnabled.includes(tap)) {
                nextTapsEnabled = [...s.tapsEnabled, tap];
            }

            const prevCfg = s.buttonConfigs[buttonId] ?? { icons: {} };
            const prevIcons = prevCfg.icons ?? {};
            const nextIcons: any = { ...prevIcons };

            // Preserve strike map, but clear strike for this tap when icon is removed
            const prevStrike = prevCfg.strike ?? {};
            const nextStrike: any = { ...prevStrike };

            if (icon) {
                nextIcons[tap] = icon;
            } else {
                delete nextIcons[tap];
                delete nextStrike[tap]; // if the icon is removed, remove its strike flag too
            }

            return {
                ...s,
                tapsEnabled: nextTapsEnabled,
                buttonConfigs: {
                    ...s.buttonConfigs,
                    [buttonId]: {
                        ...prevCfg,
                        icons: nextIcons,
                        strike: nextStrike,
                    },
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

    const resetCurrentRemote = () => {
        setPreviewExampleOn(false);
        setSaveNameError("");

        setState((s) => ({
            ...s,
            // keep the currently selected model
            remoteId: s.remoteId,
            tapsEnabled: ["single"],
            buttonConfigs: {},
        }));
    };

    /* ------------------------------ exporting ------------------------------ */

    const exportRemoteHostRef = useRef<HTMLDivElement | null>(null);
    const exportButtonHostRef = useRef<HTMLDivElement | null>(null);

    const exportRemoteSvg = () => {
        const svg = exportRemoteHostRef.current?.querySelector("svg");
        if (!svg) return;
        downloadTextFile(`${exportBase}-remote.svg`, serializeSvg(svg), "image/svg+xml");
    };

    const [dpi, setDpi] = useState(203);
    const [exportButtonId, setExportButtonId] = useState<string | null>(null);
    const [isZipping, setIsZipping] = useState(false);

    const exportZip = async () => {
        if (isZipping) return;
        setIsZipping(true);

        const zip = new JSZip();
        const folder = zip.folder(exportBase) ?? zip;

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
        downloadBlob(`${exportBase}-labels.zip`, await zip.generateAsync({ type: "blob" }));
        setIsZipping(false);
    };

    const exportButton = exportButtonId ? template.buttons.find((b) => b.id === exportButtonId) : null;

    /* -------------------------------- render -------------------------------- */

    // Removed effect: Keep the dropdown selection in sync with the name field
    // (handled only onBlur of the name field now)

    return (
        <main className="app">
            <SiteHeader isAdmin={isAdmin} />
            <div className="workspace">
                <section className="controls">
                    {/* Remote */}
                    <fieldset>
                        <legend>Remote</legend>
                        <div className="modelRow">
                            <label className="modelRow__label">
                                Model
                                <select
                                    value={state.remoteId}
                                    onChange={(e) => {
                                        const nextRemoteId = e.target.value as any;

                                        // Clear mappings when switching remotes (prevents accidental carry-over)
                                        setState((s) => ({
                                            ...s,
                                            remoteId: nextRemoteId,
                                            tapsEnabled: ["single"],
                                            buttonConfigs: {},
                                        }));

                                        // Stop any example preview when switching remotes
                                        setPreviewExampleOn(false);

                                        // Clear saved-design editing context (Name field etc.)
                                        setSaveName("");
                                        setSaveNameError("");
                                        setActiveSavedId(null);
                                        setLoadedSnapshot(null);
                                        setLoadedName("");
                                        setSelectedSavedId("");
                                    }}
                                >
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
                        <div className="row">
                            <button type="button" onClick={resetCurrentRemote}>
                                Reset current remote
                            </button>
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

                                                // Start with current options
                                                let nextOptions = { ...next.options };

                                                // Merge example-specific options
                                                if (selectedExample.options) {
                                                    nextOptions = { ...nextOptions, ...selectedExample.options };
                                                }

                                                // Defaults only if not explicitly set by the example
                                                if (selectedExample.options?.showTapMarkersAlways === undefined) {
                                                    nextOptions.showTapMarkersAlways = true;
                                                }
                                                if (selectedExample.options?.showTapDividers === undefined) {
                                                    nextOptions.showTapDividers = selectedExample.tapsEnabled.length > 1;
                                                }

                                                next.options = nextOptions;

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

                    {/* Saved designs (localStorage) */}
                    <fieldset>
                        <legend>Saved remotes</legend>

                        <label className="modelRow__label">
                            Name
                            <input
                                type="text"
                                value={saveName}
                                onChange={(e) => {
                                    setSaveName(e.target.value);
                                    if (saveNameError) setSaveNameError("");
                                }}
                                onBlur={() => {
                                    const n = saveName.trim();
                                    if (!n) return;

                                    // If the typed name matches an existing saved design for this remote model,
                                    // select it in the dropdown (but do not clear selection when empty).
                                    const match = savedDesigns.find((d) => d.state.remoteId === state.remoteId && normalizeName(d.name) === normalizeName(n));
                                    if (match) setSelectedSavedId(match.id);
                                }}
                                placeholder="e.g. Living room dimmer"
                            />
                        </label>
                        {saveNameError ? <p style={{ margin: 0, fontSize: "0.85rem", color: "#b00020" }}>{saveNameError}</p> : null}

                        <p>
                            <div className="row">
                                <button type="button" onClick={saveActiveDesign} disabled={!activeSavedId || !hasUnsavedChanges || !saveName.trim() || !!saveNameError}>
                                    Save
                                </button>
                                <button type="button" onClick={saveAsNewDesign} disabled={!saveName.trim()}>
                                    Save as
                                </button>
                            </div>
                        </p>
                        {activeSavedId && <p style={{ margin: 0, fontSize: "0.85rem", opacity: 0.85 }}>{hasUnsavedChanges ? "Unsaved changes" : "All changes saved"}</p>}

                        <label className="modelRow__label" style={{ marginTop: "0.5rem" }}>
                            Your saved remotes
                            <select value={selectedSavedId} onChange={(e) => setSelectedSavedId(e.target.value)} onFocus={refreshSavedDesigns}>
                                <option value="">(none)</option>
                                {savedDesigns.map((d) => (
                                    <option key={d.id} value={d.id}>
                                        {d.name} — {remoteNameById.get(d.state.remoteId as any) ?? d.state.remoteId}
                                    </option>
                                ))}
                            </select>
                        </label>

                        <p>
                            <div className="row">
                                <button type="button" onClick={loadSelectedDesign} disabled={!selectedSavedId}>
                                    Load
                                </button>
                                <button type="button" onClick={deleteSelectedDesign} disabled={!selectedSavedId}>
                                    Delete
                                </button>
                            </div>
                        </p>

                        <p style={{ margin: 0, fontSize: "0.85rem", opacity: 0.85 }}>Saved in your browser (localStorage). It remains after reloads, but will be removed if you clear site data.</p>
                    </fieldset>

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
                                Label outline color
                                <input
                                    type="color"
                                    value={o.labelOutlineColor}
                                    onChange={(e) =>
                                        setState((s) => ({
                                            ...s,
                                            options: { ...s.options, labelOutlineColor: e.target.value },
                                        }))
                                    }
                                />
                            </label>

                            <label className="option">
                                Label outline stroke (mm)
                                <input
                                    type="number"
                                    min={0.05}
                                    max={2}
                                    step={0.05}
                                    value={o.labelOutlineStrokeMm}
                                    onChange={(e) =>
                                        setState((s) => ({
                                            ...s,
                                            options: { ...s.options, labelOutlineStrokeMm: Number(e.target.value) },
                                        }))
                                    }
                                />
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
                                {TAP_ORDER.map((tap) => (
                                    <div key={tap}>
                                        <h4>{tapLabel(tap)}</h4>
                                        <IconPicker value={state.buttonConfigs[id]?.icons?.[tap]} onChange={(v) => setIcon(id, tap, v)} />
                                        <p>
                                            {(() => {
                                                const iconName = state.buttonConfigs[id]?.icons?.[tap];
                                                if (!iconName) return null;

                                                // Hide strikethrough toggle if the icon already represents an "off" state
                                                if (typeof iconName === "string" && iconName.toLowerCase().includes("off")) return null;

                                                return (
                                                    <label className="option">
                                                        <input
                                                            type="checkbox"
                                                            checked={state.buttonConfigs[id]?.strike?.[tap] ?? false}
                                                            onChange={(e) => {
                                                                const checked = e.target.checked;
                                                                setState((s) => {
                                                                    const prev = s.buttonConfigs[id] ?? { icons: {} };
                                                                    const prevStrike = prev.strike ?? {};
                                                                    return {
                                                                        ...s,
                                                                        buttonConfigs: {
                                                                            ...s.buttonConfigs,
                                                                            [id]: {
                                                                                ...prev,
                                                                                strike: { ...prevStrike, [tap]: checked },
                                                                            },
                                                                        },
                                                                    };
                                                                });
                                                            }}
                                                        />
                                                        Strikethrough (manual “off”)
                                                    </label>
                                                );
                                            })()}
                                        </p>
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
            </div>

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
