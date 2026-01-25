import { useMemo, useState, useEffect, useRef, useSyncExternalStore } from "react";
import { createPortal } from "react-dom";
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
import { StickerTemplateSection } from "./components/controls/StickerTemplateSection";
import { OptionsSection } from "./components/controls/OptionsSection";
import { ShareExportSection } from "./components/controls/ShareExportSection";
import { ButtonsSection } from "./components/controls/ButtonsSection";
import { PreviewPane } from "./components/PreviewPane";
import { HelpSection } from "./components/HelpSection";
import { HiddenExportRenderers } from "./components/HiddenExportRenderers";
import { UiIcon } from "./components/UiIcon";

import { loadFromHash, saveToHash } from "./app/urlState";
import { serializeSvg, downloadTextFile } from "./app/exportSvg";
import { svgTextToPngBlobMm, downloadBlob } from "./app/exportPng";
import { downloadPdfFromSvg, downloadPdfFromSvgs } from "./app/exportPdf";
import { readSavedDesigns, writeSavedDesigns, newId, nameExistsForRemote, withTimestamp, normalizeName, encodeSavedDesignsExport, parseSavedDesignsImport, type SavedDesign } from "./app/savedDesigns";
import { A4_SIZE_MM, LETTER_SIZE_MM, getStickerSheetLayout } from "./app/stickerSheet";

import { FEATURES } from "./app/featureFlags";
import { getHueIconsLoadedSnapshot, preloadHueIcons, subscribeHueIcons } from "./hue/hueIcons";
import { getFullMdiLoadedSnapshot, isMdiInHomeSet, preloadFullMdi, subscribeFullMdi } from "./app/mdi";

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

function getDateStamp() {
    const d = new Date();
    const pad = (n: number) => String(n).padStart(2, "0");
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
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
        labelWidthMm: 40,
        labelHeightMm: 30,
        labelCornerMm: 2,
        labelCount: 6,
        sheetSize: "A4",
        sheetMarginXMm: 8,
        sheetMarginYMm: 8,
        sheetGapMm: 3,
    },
};

/* ------------------------------- helpers -------------------------------- */

function normalizeState(input: DesignState): DesignState {
    const fallbackRemoteId = REMOTES[0]?.id ?? initial.remoteId;
    const nextRemoteId = REMOTES.some((r) => r.id === input.remoteId) ? input.remoteId : fallbackRemoteId;
    const mergedOptions = {
        ...initial.options,
        ...(input.options ?? {}),
    };

    const clampNumber = (value: unknown, fallback: number, min?: number, max?: number) => {
        const n = typeof value === "number" ? value : Number(value);
        if (!Number.isFinite(n)) return fallback;
        if (typeof min === "number" && n < min) return min;
        if (typeof max === "number" && n > max) return max;
        return n;
    };

    return {
        ...initial,
        ...input,
        remoteId: nextRemoteId,
        tapsEnabled: Array.isArray(input.tapsEnabled) && input.tapsEnabled.length ? input.tapsEnabled : initial.tapsEnabled,
        buttonConfigs: input.buttonConfigs ?? {},
        options: {
            ...mergedOptions,
            fixedIconMm: clampNumber(mergedOptions.fixedIconMm, initial.options.fixedIconMm, 1),
            labelOutlineStrokeMm: clampNumber(mergedOptions.labelOutlineStrokeMm, initial.options.labelOutlineStrokeMm, 0),
            labelWidthMm: clampNumber(mergedOptions.labelWidthMm, initial.options.labelWidthMm, 1),
            labelHeightMm: clampNumber(mergedOptions.labelHeightMm, initial.options.labelHeightMm, 1),
            labelCornerMm: clampNumber(mergedOptions.labelCornerMm, initial.options.labelCornerMm, 0),
            labelCount: Math.max(1, Math.floor(clampNumber(mergedOptions.labelCount, initial.options.labelCount, 1))),
            sheetSize: mergedOptions.sheetSize === "Letter" ? "Letter" : "A4",
            sheetMarginXMm: clampNumber(mergedOptions.sheetMarginXMm, initial.options.sheetMarginXMm, 0),
            sheetMarginYMm: clampNumber(mergedOptions.sheetMarginYMm, initial.options.sheetMarginYMm, 0),
            sheetGapMm: clampNumber(mergedOptions.sheetGapMm, initial.options.sheetGapMm, 0),
            tapMarkerFill: mergedOptions.tapMarkerFill === "filled" ? "filled" : "outline",
        },
    };
}

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

function stateUsesHueIcons(state: DesignState) {
    for (const cfg of Object.values(state.buttonConfigs)) {
        const icons = cfg?.icons ?? {};
        for (const icon of Object.values(icons)) {
            if (typeof icon === "string" && icon.startsWith("hue:")) return true;
        }
    }
    return false;
}

function remotesUseHueIcons() {
    for (const remote of REMOTES) {
        const examples = remote.examples ?? [];
        for (const ex of examples) {
            for (const iconsByTap of Object.values(ex.buttonIcons)) {
                for (const icon of Object.values(iconsByTap)) {
                    if (typeof icon === "string" && icon.startsWith("hue:")) return true;
                }
            }
        }
    }
    return false;
}

function stateUsesFullMdi(state: DesignState) {
    for (const cfg of Object.values(state.buttonConfigs)) {
        const icons = cfg?.icons ?? {};
        for (const icon of Object.values(icons)) {
            if (typeof icon === "string" && icon.startsWith("mdi:") && !isMdiInHomeSet(icon)) return true;
        }
    }
    return false;
}

function remotesUseFullMdi() {
    for (const remote of REMOTES) {
        const examples = remote.examples ?? [];
        for (const ex of examples) {
            for (const iconsByTap of Object.values(ex.buttonIcons)) {
                for (const icon of Object.values(iconsByTap)) {
                    if (typeof icon === "string" && icon.startsWith("mdi:") && !isMdiInHomeSet(icon)) return true;
                }
            }
        }
    }
    return false;
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
        return normalizeState(loadFromHash<DesignState>() ?? initial);
    });
    const [stickerPageIndex, setStickerPageIndex] = useState(0);

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

    const [importExportStatus, setImportExportStatus] = useState<{ type: "success" | "error"; message: string } | null>(null);

    useEffect(() => {
        if (!importExportStatus) return;
        const t = window.setTimeout(() => setImportExportStatus(null), 10000);
        return () => window.clearTimeout(t);
    }, [importExportStatus]);

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

        setState(normalizeState(found.state));

        setActiveSavedId(found.id);
        setLoadedSnapshot(normalizeState(found.state));
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

    const exportAllSavedDesigns = () => {
        const items = readSavedDesigns();
        if (!items.length) return;

        const payload = encodeSavedDesignsExport(items);
        const filename = `ha-remote-designer-saved-remotes-${getDateStamp()}.json`;
        downloadTextFile(filename, JSON.stringify(payload, null, 2), "application/json");
        setImportExportStatus({ type: "success", message: `Exported ${items.length} saved remotes.` });
    };

    const exportSelectedDesign = () => {
        if (!selectedSavedId) return;
        const items = readSavedDesigns();
        const found = items.find((d) => d.id === selectedSavedId);
        if (!found) {
            setImportExportStatus({ type: "error", message: "Selected remote no longer exists." });
            return;
        }

        const payload = encodeSavedDesignsExport([found]);
        const base = `${sanitizeFilenameBase(found.name)}-${found.state.remoteId || "remote"}`;
        const filename = `${base}-${getDateStamp()}.json`;
        downloadTextFile(filename, JSON.stringify(payload, null, 2), "application/json");
        setImportExportStatus({ type: "success", message: "Exported selected remote." });
    };

    const importSavedDesignsFromFile = async (file: File) => {
        setImportExportStatus(null);
        let text = "";
        try {
            text = await file.text();
        } catch {
            setImportExportStatus({ type: "error", message: "Failed to read the file." });
            return;
        }

        const parsed = parseSavedDesignsImport(text);
        if (parsed.error) {
            setImportExportStatus({ type: "error", message: parsed.error });
            return;
        }

        if (!parsed.items.length) {
            setImportExportStatus({ type: "error", message: "No valid remotes found in the file." });
            return;
        }

        const now = Date.now();
        const existing = readSavedDesigns();
        const next = [...existing];
        const usedIds = new Set(existing.map((d) => d.id));

        for (const item of parsed.items) {
            let nextItem = item;
            if (usedIds.has(nextItem.id)) {
                nextItem = { ...nextItem, id: newId() };
            }
            usedIds.add(nextItem.id);

            const remoteId = typeof nextItem.state?.remoteId === "string" ? nextItem.state.remoteId : "";
            if (remoteId && nameExistsForRemote(next, remoteId, nextItem.name)) {
                nextItem = { ...nextItem, name: withTimestamp(nextItem.name), updatedAt: now };
            }

            next.push(nextItem);
        }

        writeSavedDesigns(next);
        refreshSavedDesigns();

        const invalidNote = parsed.invalidCount ? ` (${parsed.invalidCount} skipped)` : "";
        setImportExportStatus({ type: "success", message: `Imported ${parsed.items.length} remotes${invalidNote}.` });
    };

    /* persist state in URL */
    useEffect(() => {
        // Do not persist editor state into the hash while the gallery is shown.
        if (isGallery) return;
        const t = window.setTimeout(() => saveToHash(state), 150);
        return () => window.clearTimeout(t);
    }, [state, isGallery]);

    const o = state.options;
    const baseTemplate = useMemo(() => REMOTES.find((r) => r.id === state.remoteId) ?? REMOTES[0], [state.remoteId]);
    const isStickerSheet = baseTemplate.isStickerSheet === true;
    const sheetSizeMm = o.sheetSize === "Letter" ? LETTER_SIZE_MM : A4_SIZE_MM;

    const stickerLayout = useMemo(() => {
        if (!isStickerSheet) return null;
        return getStickerSheetLayout({
            labelWidthMm: o.labelWidthMm,
            labelHeightMm: o.labelHeightMm,
            count: o.labelCount,
            sheetWidthMm: sheetSizeMm.width,
            sheetHeightMm: sheetSizeMm.height,
            marginXMm: o.sheetMarginXMm,
            marginYMm: o.sheetMarginYMm,
            gapMm: o.sheetGapMm,
        });
    }, [isStickerSheet, o.labelWidthMm, o.labelHeightMm, o.labelCount, o.sheetMarginXMm, o.sheetMarginYMm, o.sheetGapMm, sheetSizeMm.width, sheetSizeMm.height]);

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

    const hueIconsLoaded = useSyncExternalStore(subscribeHueIcons, getHueIconsLoadedSnapshot);
    const galleryUsesHueIcons = useMemo(() => remotesUseHueIcons(), []);
    const shouldPreloadHueIcons = useMemo(() => (isGallery ? galleryUsesHueIcons : stateUsesHueIcons(state)), [isGallery, galleryUsesHueIcons, state]);

    useEffect(() => {
        if (!shouldPreloadHueIcons || hueIconsLoaded) return;
        void preloadHueIcons();
    }, [shouldPreloadHueIcons, hueIconsLoaded]);

    const fullMdiLoaded = useSyncExternalStore(subscribeFullMdi, getFullMdiLoadedSnapshot);
    const galleryUsesFullMdi = useMemo(() => remotesUseFullMdi(), []);
    const shouldPreloadFullMdi = useMemo(() => (isGallery ? galleryUsesFullMdi : stateUsesFullMdi(state)), [isGallery, galleryUsesFullMdi, state]);
    const overlayRoot = typeof document !== "undefined" ? document.getElementById("overlay-root") : null;
    const [previewOpen, setPreviewOpen] = useState(false);
    const [previewHeightVh, setPreviewHeightVh] = useState(32);
    const previewHeightRef = useRef(32);
    const dragStateRef = useRef<{ startY: number; startHeight: number } | null>(null);

    useEffect(() => {
        if (!shouldPreloadFullMdi || fullMdiLoaded) return;
        void preloadFullMdi();
    }, [shouldPreloadFullMdi, fullMdiLoaded]);

    const stickerPages = stickerLayout?.pages ?? 0;
    const stickerPageIndexSafe = isStickerSheet ? Math.min(stickerPageIndex, Math.max(0, stickerPages - 1)) : 0;

    const template = useMemo(() => {
        const base = baseTemplate;
        if (!isStickerSheet) return base;

        const layout =
            stickerLayout ??
            getStickerSheetLayout({
                labelWidthMm: o.labelWidthMm,
                labelHeightMm: o.labelHeightMm,
                count: o.labelCount,
                sheetWidthMm: sheetSizeMm.width,
                sheetHeightMm: sheetSizeMm.height,
                marginXMm: o.sheetMarginXMm,
                marginYMm: o.sheetMarginYMm,
                gapMm: o.sheetGapMm,
            });
        const pageIndex = Math.max(0, stickerPageIndexSafe);
        const offset = pageIndex * layout.maxCount;
        const remaining = Math.max(0, o.labelCount - offset);
        const count = Math.min(layout.maxCount, remaining);
        const positions = layout.positions.slice(0, count);

        const buttons = positions.map((pos, index) => ({
            id: `label_${offset + index + 1}`,
            xMm: pos.xMm,
            yMm: pos.yMm,
            wMm: o.labelWidthMm,
            hMm: o.labelHeightMm,
            rMm: o.labelCornerMm,
        }));

        return {
            ...base,
            widthMm: layout.sheetWidthMm,
            heightMm: layout.sheetHeightMm,
            cornerMm: 0,
            buttons,
        };
    }, [baseTemplate, isStickerSheet, stickerLayout, o.labelWidthMm, o.labelHeightMm, o.labelCornerMm, o.labelCount, o.sheetMarginXMm, o.sheetMarginYMm, o.sheetGapMm, sheetSizeMm.width, sheetSizeMm.height, stickerPageIndexSafe]);

    const buttonIds = isStickerSheet ? Array.from({ length: Math.max(0, o.labelCount) }, (_, i) => `label_${i + 1}`) : template.buttons.map((b) => b.id);
    const labelWidthMm = o.labelWidthMm;
    const labelHeightMm = o.labelHeightMm;

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
                size: { widthMm: labelWidthMm, heightMm: labelHeightMm, dpi },
            });

            folder.file(`${id}.png`, png);
        }

        setExportButtonId(null);
        downloadBlob(`${exportBase}-labels.zip`, await zip.generateAsync({ type: "blob" }));
        setIsZipping(false);
    };

    const exportButton = exportButtonId ? (isStickerSheet ? { id: exportButtonId, xMm: 0, yMm: 0, wMm: o.labelWidthMm, hMm: o.labelHeightMm, rMm: o.labelCornerMm } : (template.buttons.find((b) => b.id === exportButtonId) ?? null)) : null;

    const exportA4Pdf = async () => {
        if (!isStickerSheet) {
            const svg = exportRemoteHostRef.current?.querySelector("svg");
            if (!svg) return;
            const svgText = serializeSvg(svg).replace(/^<\?xml[^>]*>\s*/i, "");
            await downloadPdfFromSvg({
                filename: `${exportBase}-a4`,
                svgText,
                widthMm: sheetSizeMm.width,
                heightMm: sheetSizeMm.height,
            });
            return;
        }

        const layout = stickerLayout;
        if (!layout || layout.maxCount <= 0) return;
        const totalPages = Math.max(1, layout.pages);
        const svgTexts: string[] = [];

        const prevPage = stickerPageIndexSafe;
        for (let page = 0; page < totalPages; page += 1) {
            setStickerPageIndex(page);
            await nextFrame();
            await nextFrame();
            const svg = exportRemoteHostRef.current?.querySelector("svg");
            if (!svg) continue;
            svgTexts.push(serializeSvg(svg).replace(/^<\?xml[^>]*>\s*/i, ""));
        }
        setStickerPageIndex(prevPage);

        if (!svgTexts.length) return;
        await downloadPdfFromSvgs({
            filename: `${exportBase}-${o.sheetSize.toLowerCase()}`,
            svgTexts,
            widthMm: sheetSizeMm.width,
            heightMm: sheetSizeMm.height,
        });
    };

    const exportAllPagesSvgZip = async () => {
        if (!isStickerSheet) return;
        const layout = stickerLayout;
        if (!layout || layout.maxCount <= 0 || layout.pages <= 1) return;

        const totalPages = Math.max(1, layout.pages);
        const zip = new JSZip();
        const folder = zip.folder(exportBase) ?? zip;

        const prevPage = stickerPageIndex;
        for (let page = 0; page < totalPages; page += 1) {
            setStickerPageIndex(page);
            await nextFrame();
            await nextFrame();
            const svg = exportRemoteHostRef.current?.querySelector("svg");
            if (!svg) continue;
            const svgText = serializeSvg(svg);
            folder.file(`page-${page + 1}.svg`, svgText);
        }
        setStickerPageIndex(prevPage);

        downloadBlob(`${exportBase}-all-pages.svg.zip`, await zip.generateAsync({ type: "blob" }));
    };

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

    useEffect(() => {
        previewHeightRef.current = previewHeightVh;
    }, [previewHeightVh]);

    useEffect(() => {
        const handleMove = (event: PointerEvent) => {
            if (!dragStateRef.current) return;
            const deltaPx = event.clientY - dragStateRef.current.startY;
            const deltaVh = (deltaPx / window.innerHeight) * 100;
            const next = Math.min(70, Math.max(24, dragStateRef.current.startHeight - deltaVh));
            setPreviewHeightVh(next);
        };
        const handleUp = () => {
            if (!dragStateRef.current) return;
            dragStateRef.current = null;
            const snapPoints = [30, 45, 60];
            const current = previewHeightRef.current;
            const snapped = snapPoints.reduce((best, point) => (Math.abs(point - current) < Math.abs(best - current) ? point : best), snapPoints[0]);
            setPreviewHeightVh(snapped);
        };

        window.addEventListener("pointermove", handleMove);
        window.addEventListener("pointerup", handleUp);
        window.addEventListener("pointercancel", handleUp);
        return () => {
            window.removeEventListener("pointermove", handleMove);
            window.removeEventListener("pointerup", handleUp);
            window.removeEventListener("pointercancel", handleUp);
        };
    }, []);

    return (
        <>
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
                            requestAnimationFrame(() => {
                                window.scrollTo({ top: 0, behavior: "smooth" });
                            });
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
                                        onExportAll={exportAllSavedDesigns}
                                        onImportFile={(file) => {
                                            void importSavedDesignsFromFile(file);
                                        }}
                                        importExportStatus={importExportStatus}
                                        remoteNameById={remoteNameById}
                                    />
                                </>
                            }
                            right={
                                <>
                                    {isStickerSheet && stickerLayout ? <StickerTemplateSection options={o} layout={stickerLayout} onUpdateOptions={updateOptions} /> : null}

                                    <OptionsSection options={o} onUpdateOptions={updateOptions} remoteOutlineLabel={isStickerSheet ? "Show paper outline" : "Show remote outline"} />

                                    <ShareExportSection shareStatus={shareStatus} onCopyShareLink={copyShareLink} shareUrl={shareUrl} isAdmin={isAdmin} onExportRemoteSvg={exportRemoteSvg} onExportZip={exportZip} isZipping={isZipping} dpi={dpi} onChangeDpi={setDpi} showA4Pdf={isStickerSheet} onExportA4Pdf={exportA4Pdf} showSvgAllPages={isStickerSheet && stickerPages > 1} onExportAllPagesSvgZip={exportAllPagesSvgZip} onExportRemoteJson={exportSelectedDesign} />
                                </>
                            }
                            full={<ButtonsSection buttonIds={buttonIds} state={state} tapLabel={tapLabel} onSetIcon={setIcon} onToggleStrike={toggleStrike} />}
                        />
                    }
                    preview={
                        <PreviewPane
                            template={template}
                            state={previewState}
                            showWatermark={showWatermark}
                            watermarkText={watermarkText}
                            watermarkOpacity={watermarkOpacity}
                            isStickerSheet={isStickerSheet}
                            pageIndex={stickerPageIndexSafe}
                            pages={stickerPages}
                            onChangePage={setStickerPageIndex}
                            className="preview--desktop"
                        />
                    }
                    help={<HelpSection />}
                />
            )}

            <HiddenExportRenderers exportRemoteHostRef={exportRemoteHostRef} exportButtonHostRef={exportButtonHostRef} template={template} state={state} exportButton={exportButton} labelWidthMm={labelWidthMm} labelHeightMm={labelHeightMm} showScaleBar={isStickerSheet ? false : o.showScaleBar} showWatermark={showWatermark} watermarkText={watermarkText} watermarkOpacity={watermarkOpacity} />

            <SiteFooter />
        </main>
            {!isGallery && overlayRoot
                ? createPortal(
                      <div
                          className={`previewOverlay ${previewOpen ? "previewOverlay--open" : "previewOverlay--closed"}`}
                          style={{ ["--preview-height" as string]: `${previewHeightVh}vh` }}
                      >
                          {previewOpen ? (
                              <div className="previewOverlay__sheet" role="dialog" aria-label="Preview">
                                  <div
                                      className="previewOverlay__header"
                                      onPointerDown={(event) => {
                                          dragStateRef.current = { startY: event.clientY, startHeight: previewHeightVh };
                                      }}
                                  >
                                      <div className="previewOverlay__handle" aria-hidden="true" />
                                      <button type="button" className="previewOverlay__close" aria-label="Close preview" onClick={() => setPreviewOpen(false)}>
                                          <UiIcon name="mdi:close-circle-outline" className="icon" />
                                      </button>
                                  </div>
                                  <PreviewPane
                                      template={template}
                                      state={previewState}
                                      showWatermark={showWatermark}
                                      watermarkText={watermarkText}
                                      watermarkOpacity={watermarkOpacity}
                                      isStickerSheet={isStickerSheet}
                                      pageIndex={stickerPageIndexSafe}
                                      pages={stickerPages}
                                      onChangePage={setStickerPageIndex}
                                      className="preview--overlay"
                                  />
                              </div>
                          ) : (
                              <button type="button" className="previewOverlay__bar" onClick={() => setPreviewOpen(true)}>
                                  Preview
                              </button>
                          )}
                      </div>,
                      overlayRoot,
                  )
                : null}
        </>
    );
}
