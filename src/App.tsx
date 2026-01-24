import { useMemo, useState, useEffect, useRef } from "react";
import "./App.css";

import { type DesignState, type TapType } from "./app/types";
import { REMOTES, type RemoteExample, type RemoteTemplate } from "./app/remotes";
import { SiteHeader } from "./components/SiteHeader";
import { SiteFooter } from "./components/SiteFooter";
import { TopNav } from "./components/TopNav";
import { GalleryView } from "./components/GalleryView";
import { EditorLayout } from "./components/layout/EditorLayout";
import { GalleryLayout } from "./components/layout/GalleryLayout";
import { ControlsLayout } from "./components/layout/ControlsLayout";
import { RemoteSection } from "./components/controls/RemoteSection";
import { SavedDesignsSection } from "./components/controls/SavedDesignsSection";
import { OptionsSection } from "./components/controls/OptionsSection";
import { ShareExportSection } from "./components/controls/ShareExportSection";
import { ButtonsSection } from "./components/controls/ButtonsSection";
import { PreviewPane } from "./components/PreviewPane";
import { HelpSection } from "./components/HelpSection";
import { HiddenExportRenderers } from "./components/HiddenExportRenderers";

import { loadFromHash, saveToHash } from "./app/urlState";
import { serializeSvg, downloadTextFile } from "./app/exportSvg";
import { svgTextToPngBlobMm, downloadBlob } from "./app/exportPng";
import { readSavedDesigns, writeSavedDesigns, newId, nameExistsForRemote, withTimestamp, normalizeName, type SavedDesign } from "./app/savedDesigns";

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

function getUrlView(): "editor" | "gallery" {
    const sp = new URLSearchParams(window.location.search);
    return sp.get("view") === "gallery" ? "gallery" : "editor";
}

function setUrlView(view: "editor" | "gallery") {
    const url = new URL(window.location.href);
    if (view === "gallery") url.searchParams.set("view", "gallery");
    else url.searchParams.delete("view");

    // Use pushState so browser back/forward works.
    window.history.pushState(null, "", url.toString());
}

function getViewHref(view: "editor" | "gallery") {
    const url = new URL(window.location.href);
    if (view === "gallery") url.searchParams.set("view", "gallery");
    else url.searchParams.delete("view");
    return url.toString();
}

function buildStateFromExample(params: { remoteId: RemoteTemplate["id"]; example: RemoteExample }): DesignState {
    const { remoteId, example } = params;

    // Start from app defaults for consistent behaviour
    const base: DesignState = {
        ...initial,
        remoteId,
        tapsEnabled: Array.isArray(example?.tapsEnabled) && example.tapsEnabled.length ? example.tapsEnabled : ["single"],
        buttonConfigs: {},
        options: { ...initial.options },
    };

    // Apply example icons (+ strike)
    if (example?.buttonIcons) {
        for (const [buttonId, iconsByTap] of Object.entries(example.buttonIcons) as [string, RemoteExample["buttonIcons"][string]][]) {
            const id = String(buttonId);
            base.buttonConfigs[id] = {
                icons: { ...iconsByTap },
                strike: { ...(example?.buttonStrike?.[id] ?? {}) },
            };
        }
    }

    // Apply strikes even for buttons that have no icons in the example
    if (example?.buttonStrike) {
        for (const [buttonId, strikeByTap] of Object.entries(example.buttonStrike) as [string, NonNullable<RemoteExample["buttonStrike"]>[string]][]) {
            const id = String(buttonId);
            const prev = base.buttonConfigs[id] ?? { icons: {} };
            base.buttonConfigs[id] = {
                ...prev,
                strike: { ...(prev.strike ?? {}), ...strikeByTap },
            };
        }
    }

    // Apply example-specific options (if any)
    if (example?.options) {
        base.options = { ...base.options, ...example.options };
    }

    // Sensible defaults ONLY if the example did not specify them
    if (example?.options?.showTapMarkersAlways === undefined) {
        base.options.showTapMarkersAlways = true;
    }
    if (example?.options?.showTapDividers === undefined) {
        base.options.showTapDividers = (base.tapsEnabled?.length ?? 0) > 1;
    }

    return base;
}

/* --------------------------------- App ---------------------------------- */

export default function App() {
    useEffect(() => {
        document.title = "Remote Label Designer for Home Automation";
    }, []);

    const [view, setView] = useState<"editor" | "gallery">(() => getUrlView());
    const isGallery = view === "gallery";

    useEffect(() => {
        const onPopState = () => setView(getUrlView());
        window.addEventListener("popstate", onPopState);
        return () => window.removeEventListener("popstate", onPopState);
    }, []);

    const goTo = (next: "editor" | "gallery") => {
        setUrlView(next);
        setView(next);
    };

    const [state, setState] = useState<DesignState>(() => {
        // In gallery view we do not try to parse the hash as state.
        if (getUrlView() === "gallery") return initial;
        return loadFromHash<DesignState>() ?? initial;
    });

    /* ----------------------------- Saved designs UI state ----------------------------- */
    const initialSavedDesigns = useMemo(() => readSavedDesigns().sort((a, b) => b.updatedAt - a.updatedAt), []);
    const [savedDesigns, setSavedDesigns] = useState<SavedDesign[]>(initialSavedDesigns);

    // Name input for saving (also used for rename)
    const [saveName, setSaveName] = useState<string>("");
    const [saveNameError, setSaveNameError] = useState<string>("");

    // Dropdown selection
    const [selectedSavedId, setSelectedSavedId] = useState<string>(() => initialSavedDesigns[0]?.id ?? "");

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

    // Dirty check: any change to state or the name compared to the loaded design
    const stateSig = useMemo(() => JSON.stringify(state), [state]);
    const loadedSig = useMemo(() => (loadedSnapshot ? JSON.stringify(loadedSnapshot) : ""), [loadedSnapshot]);
    const hasUnsavedChanges = activeSavedId !== null && (stateSig !== loadedSig || saveName.trim() !== loadedName.trim());

    const loadSelectedDesign = () => {
        const items = readSavedDesigns();
        const found = items.find((d) => d.id === selectedSavedId);
        if (!found) return;

        setState(found.state);

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
        // Do not persist editor state into the hash while the gallery is shown.
        if (isGallery) return;
        const t = window.setTimeout(() => saveToHash(state), 150);
        return () => window.clearTimeout(t);
    }, [state, isGallery]);

    const template = useMemo(() => REMOTES.find((r) => r.id === state.remoteId) ?? REMOTES[0], [state.remoteId]);

    const remoteNameById = useMemo(() => {
        return new Map(REMOTES.map((r) => [r.id, r.name] as const));
    }, []);

    const previewState: DesignState = state;

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
            const nextIcons: Partial<Record<TapType, string>> = { ...prevIcons };

            // Preserve strike map, but clear strike for this tap when icon is removed
            const prevStrike = prevCfg.strike ?? {};
            const nextStrike: Partial<Record<TapType, boolean>> = { ...prevStrike };

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

    const toggleStrike = (buttonId: string, tap: TapType, checked: boolean) => {
        setState((s) => {
            const prev = s.buttonConfigs[buttonId] ?? { icons: {} };
            const prevStrike = prev.strike ?? {};
            return {
                ...s,
                buttonConfigs: {
                    ...s.buttonConfigs,
                    [buttonId]: {
                        ...prev,
                        strike: { ...prevStrike, [tap]: checked },
                    },
                },
            };
        });
    };

    /* ------------------------------ share link ----------------------------- */

    const [shareStatus, setShareStatus] = useState<"idle" | "copied" | "failed">("idle");

    const shareUrl = getShareUrl();

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

    const resetCurrentRemote = () => {
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

    const handleRemoteChange = (nextRemoteId: DesignState["remoteId"]) => {
        // Clear mappings when switching remotes (prevents accidental carry-over)
        setState((s) => ({
            ...s,
            remoteId: nextRemoteId,
            tapsEnabled: ["single"],
            buttonConfigs: {},
        }));

        // Clear saved-design editing context (Name field etc.)
        setSaveName("");
        setSaveNameError("");
        setActiveSavedId(null);
        setLoadedSnapshot(null);
        setLoadedName("");
        setSelectedSavedId("");
    };

    const handleSaveNameChange = (value: string) => {
        setSaveName(value);
        if (saveNameError) setSaveNameError("");
    };

    const handleSaveNameBlur = () => {
        const n = saveName.trim();
        if (!n) return;

        // If the typed name matches an existing saved design for this remote model,
        // select it in the dropdown (but do not clear selection when empty).
        const match = savedDesigns.find((d) => d.state.remoteId === state.remoteId && normalizeName(d.name) === normalizeName(n));
        if (match) setSelectedSavedId(match.id);
    };

    const updateOptions = (patch: Partial<DesignState["options"]>) => {
        setState((s) => ({
            ...s,
            options: { ...s.options, ...patch },
        }));
    };

    /* -------------------------------- render -------------------------------- */

    // Removed effect: Keep the dropdown selection in sync with the name field
    // (handled only onBlur of the name field now)

    return (
        <main className="app">
            <SiteHeader isAdmin={isAdmin} />

            <TopNav
                view={view}
                editorHref={getViewHref("editor")}
                galleryHref={getViewHref("gallery")}
                onGoEditor={(event) => {
                    event.preventDefault();
                    goTo("editor");
                }}
                onGoGallery={(event) => {
                    event.preventDefault();
                    goTo("gallery");
                }}
            />

            {isGallery ? (
                <GalleryLayout>
                    <GalleryView
                        remotes={REMOTES}
                        buildStateFromExample={buildStateFromExample}
                        showWatermark={showWatermark}
                        watermarkText={watermarkText}
                        watermarkOpacity={watermarkOpacity}
                        onOpenExample={({ state: nextState }) => {
                            setState(nextState);
                            goTo("editor");
                        }}
                    />
                </GalleryLayout>
            ) : (
                <EditorLayout
                    controls={
                        <ControlsLayout
                            left={
                                <>
                                    <RemoteSection remotes={REMOTES} remoteId={state.remoteId} remoteImageUrl={remoteImageUrl} onChangeRemote={handleRemoteChange} onResetRemote={resetCurrentRemote} />

                                    <SavedDesignsSection
                                        saveName={saveName}
                                        saveNameError={saveNameError}
                                        onChangeSaveName={handleSaveNameChange}
                                        onBlurSaveName={handleSaveNameBlur}
                                        activeSavedId={activeSavedId}
                                        hasUnsavedChanges={hasUnsavedChanges}
                                        onSaveActive={saveActiveDesign}
                                        onSaveAsNew={saveAsNewDesign}
                                        savedDesigns={savedDesigns}
                                        selectedSavedId={selectedSavedId}
                                        onSelectSavedId={setSelectedSavedId}
                                        onRefreshSavedDesigns={refreshSavedDesigns}
                                        onLoadSelected={loadSelectedDesign}
                                        onDeleteSelected={deleteSelectedDesign}
                                        remoteNameById={remoteNameById}
                                    />
                                </>
                            }
                            right={
                                <>
                                    <OptionsSection options={o} onUpdateOptions={updateOptions} />

                                    <ShareExportSection
                                        shareStatus={shareStatus}
                                        onCopyShareLink={copyShareLink}
                                        shareUrl={shareUrl}
                                        isAdmin={isAdmin}
                                        onExportRemoteSvg={exportRemoteSvg}
                                        onExportZip={exportZip}
                                        isZipping={isZipping}
                                        dpi={dpi}
                                        onChangeDpi={setDpi}
                                    />
                                </>
                            }
                            full={<ButtonsSection buttonIds={buttonIds} state={state} tapLabel={tapLabel} onSetIcon={setIcon} onToggleStrike={toggleStrike} />}
                        />
                    }
                    preview={<PreviewPane template={template} state={previewState} showWatermark={showWatermark} watermarkText={watermarkText} watermarkOpacity={watermarkOpacity} />}
                    help={<HelpSection />}
                />
            )}

            <HiddenExportRenderers
                exportRemoteHostRef={exportRemoteHostRef}
                exportButtonHostRef={exportButtonHostRef}
                template={template}
                state={state}
                exportButton={exportButton}
                showScaleBar={o.showScaleBar}
                showWatermark={showWatermark}
                watermarkText={watermarkText}
                watermarkOpacity={watermarkOpacity}
            />

            <SiteFooter />
        </main>
    );
}
