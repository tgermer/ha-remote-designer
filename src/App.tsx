import { type CSSProperties, useMemo, useState, useEffect, useRef, useSyncExternalStore, useCallback } from "react";
import { createPortal } from "react-dom";
import "./App.css";

import { type DesignState, type TapType } from "./app/types";
import { REMOTES, isUserExample, type CutoutElement, type RemoteTemplate } from "./app/remotes";
import { SiteHeader } from "./components/SiteHeader";
import { SiteFooter } from "./components/SiteFooter";
import { TopNav } from "./components/TopNav";
import { GalleryView } from "./components/GalleryView";
import { HomePage } from "./components/HomePage";
import { HelpPage } from "./components/HelpPage";
import { CommunityRemotePage } from "./components/CommunityRemotePage";
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
import { LegalPage } from "./components/LegalPage";
import { ConfiguratorIntro } from "./components/ConfiguratorIntro";
import { UiIcon } from "./components/UiIcon";
import { Button } from "./components/ui/Button";

import { loadFromHash, saveToHash } from "./app/urlState";
import { serializeSvg, downloadTextFile } from "./app/exportSvg";
import { svgTextToPngBlobMm, downloadBlob } from "./app/exportPng";
import { downloadPdfFromSvg, downloadPdfFromSvgs } from "./app/exportPdf";
import { readSavedDesigns, writeSavedDesigns, newId, nameExistsForRemote, withTimestamp, normalizeName, encodeSavedDesignsExport, parseSavedDesignsImport, type SavedDesign } from "./app/savedDesigns";
import { A4_SIZE_MM, LETTER_SIZE_MM, getStickerSheetLayout } from "./app/stickerSheet";

import { FEATURES } from "./app/featureFlags";
import { getHueIconsLoadedSnapshot, preloadHueIcons, subscribeHueIcons } from "./hue/hueIcons";
import { getFullMdiLoadedSnapshot, preloadFullMdi, subscribeFullMdi } from "./app/mdi";
import {
    initial,
    normalizeState,
    buildStateFromExample,
    tapLabel,
    stateUsesHueIcons,
    remotesUseHueIcons,
    stateUsesFullMdi,
    remotesUseFullMdi,
    type NormalizableState,
} from "./app/stateUtils";
import {
    createCommunityDraft,
    buildCommunityTemplate,
    buildCommunityPayload,
} from "./app/communityUtils";
import type { CommunityButtonDraft, CommunityDraft, CommunityDraftEntry } from "./app/communityUtils";

import JSZip from "jszip";
import { init as plausibleInit, track as plausibleTrack } from "@plausible-analytics/tracker";

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

function getNowTimestamp() {
    return Date.now();
}

function getRandomId() {
    if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
        return crypto.randomUUID();
    }
    return `id_${Date.now()}_${Math.random().toString(16).slice(2)}`;
}

function createCommunityRemoteId() {
    if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
        return `community_${crypto.randomUUID()}`;
    }
    return `community_${getRandomId()}`;
}

function getIconSetName(icon: string) {
    const idx = icon.indexOf(":");
    if (idx > 0) return icon.slice(0, idx);
    return "custom";
}

function getIconName(icon: string) {
    const idx = icon.indexOf(":");
    if (idx > 0) return icon.slice(idx + 1);
    return icon;
}

const LEGAL_CONTACT = {
    projectName: "Remote Label Designer for Home Automation",
    name: "Tristan Germer",
    addressLines: ["Petrarcatraße 32", "80933 München", "Deutschland"],
    email: "nachspeise.haltegurt.1e@icloud.com",
    updatedAt: "25. Januar 2026",
};

const SHARE_MAIL_SUBJECT = "Shared remote configuration";
const SHARE_MAIL_BODY_TEMPLATE = `Hi Tristan,

I created a configuration with the Remote Label Designer.
Remote: {remoteName} ({remoteId})

Here is the share link:
{url}

Gallery consent: {galleryConsent}
Saved ID: {savedId}

Paste into remoteExamples.ts under REMOTE_EXAMPLES["{remoteId}"]:
{config}

Thanks and best regards`;
const COMMUNITY_REMOTE_SUBJECT = "Community remote model submission";
const COMMUNITY_REMOTE_BODY_TEMPLATE = `Hi Tristan,

I created a community remote model using the builder.

Remote name: {remoteName}
Size (mm): {width} x {height}
Corner radius (mm): {corner}
Manufacturer URL: {manufacturer}
Image URL: {image}

Notes:
{notes}

JSON payload:
{json}

Thanks and best regards`;
const APP_VERSION = import.meta.env.VITE_APP_VERSION || "dev";
const SEND_PROMPT_COUNT_KEY = "ha-remote-designer:send-prompt-count:v1";
const PLAUSIBLE_DOMAIN = "ha-remote-designer.netlify.app";
const COMMUNITY_PREVIEW_ID = "community_preview";
const COMMUNITY_DRAFTS_KEY = "ha-remote-designer:saved-community-drafts:v1";

/* ------------------------------- helpers -------------------------------- */

function nextFrame() {
    return new Promise<void>((resolve) => requestAnimationFrame(() => resolve()));
}

type ViewKind = "home" | "configure" | "gallery" | "help" | "community";

function getUrlView(): ViewKind {
    const sp = new URLSearchParams(window.location.search);
    const viewParam = sp.get("view");
    if (viewParam === "configure" || viewParam === "gallery" || viewParam === "help" || viewParam === "community") return viewParam;
    if (viewParam === "editor") return "configure";
    if (viewParam === "home") return "home";
    if (window.location.hash && window.location.hash.length > 1) return "configure";
    return "home";
}

type LegalPageKind = "impressum" | "datenschutz";
type LegalPageState = LegalPageKind | null;

function getUrlLegalPage(): LegalPageState {
    const sp = new URLSearchParams(window.location.search);
    const page = sp.get("page");
    if (page === "impressum" || page === "datenschutz") return page;
    return null;
}

function setUrlView(view: ViewKind) {
    const url = new URL(window.location.href);
    if (view === "home") url.searchParams.delete("view");
    else url.searchParams.set("view", view);

    // Use pushState so browser back/forward works.
    window.history.pushState(null, "", url.toString());
}

function getViewHref(view: ViewKind) {
    const url = new URL(window.location.href);
    if (view === "home") url.searchParams.delete("view");
    else url.searchParams.set("view", view);
    return url.toString();
}

function getPlausiblePageLabel(view: ViewKind, legalPage: LegalPageState) {
    if (legalPage === "impressum") return "legal:impressum";
    if (legalPage === "datenschutz") return "legal:datenschutz";
    return view;
}

function setUrlLegalPage(page: LegalPageState) {
    const url = new URL(window.location.href);
    if (page) url.searchParams.set("page", page);
    else url.searchParams.delete("page");
    window.history.pushState(null, "", url.toString());
}

function getLegalHref(page: LegalPageKind) {
    const url = new URL(window.location.href);
    url.searchParams.set("page", page);
    return url.toString();
}

function getAppHref() {
    const url = new URL(window.location.href);
    url.searchParams.delete("page");
    return url.toString();
}

function readCommunityDrafts(): CommunityDraftEntry[] {
    try {
        const raw = window.localStorage.getItem(COMMUNITY_DRAFTS_KEY);
        if (!raw) return [];
        const parsed = JSON.parse(raw) as CommunityDraftEntry[];
        if (!Array.isArray(parsed)) return [];
        return parsed.filter((entry) => entry && typeof entry.id === "string");
    } catch {
        return [];
    }
}

function writeCommunityDrafts(drafts: CommunityDraftEntry[]) {
    try {
        window.localStorage.setItem(COMMUNITY_DRAFTS_KEY, JSON.stringify(drafts));
    } catch {
        // ignore storage errors
    }
}

/* --------------------------------- App ---------------------------------- */

export default function App() {
    const [view, setView] = useState<ViewKind>(() => getUrlView());
    const isGallery = view === "gallery";
    const isHome = view === "home";
    const isHelp = view === "help";
    const isConfigure = view === "configure";
    const isCommunity = view === "community";
    const [legalPage, setLegalPage] = useState<LegalPageState>(() => getUrlLegalPage());
    const isLegal = legalPage !== null;
    const initialCommunityState = useMemo(() => {
        const drafts = readCommunityDrafts().sort((a, b) => b.updatedAt - a.updatedAt);
        const nextId = drafts[0]?.id ?? "";
        const nextDraft = drafts[0]
            ? createCommunityDraft({ ...drafts[0].draft, id: drafts[0].id })
            : createCommunityDraft();
        return { drafts, selectedId: nextId, draft: nextDraft };
    }, []);
    const [communityDraft, setCommunityDraft] = useState<CommunityDraft>(initialCommunityState.draft);
    const [communityDrafts, setCommunityDrafts] = useState<CommunityDraftEntry[]>(initialCommunityState.drafts);
    const [communitySelectedId, setCommunitySelectedId] = useState<string>(initialCommunityState.selectedId);
    const [communityCopyStatus, setCommunityCopyStatus] = useState<"idle" | "copied" | "failed">("idle");
    const plausibleInitializedRef = useRef(false);
    const trackEvent = (name: string, props?: Record<string, string | number | boolean | null | undefined>) => {
        if (!import.meta.env.PROD) return;
        if (!plausibleInitializedRef.current) return;
        if (props && Object.keys(props).length > 0) {
            const safeProps: Record<string, string> = {};
            for (const [key, value] of Object.entries(props)) {
                if (value === null || typeof value === "undefined") continue;
                safeProps[key] = String(value);
            }
            plausibleTrack(name, { props: safeProps });
            return;
        }
        plausibleTrack(name, {});
    };

    useEffect(() => {
        if (legalPage === "impressum") {
            document.title = "Impressum – Remote Designer";
            return;
        }
        if (legalPage === "datenschutz") {
            document.title = "Datenschutzerklärung – Remote Designer";
            return;
        }
        if (view === "home") {
            document.title = "Home – Remote Designer";
            return;
        }
        if (view === "configure") {
            document.title = "Configurator – Remote Designer";
            return;
        }
        if (view === "gallery") {
            document.title = "Gallery – Remote Designer";
            return;
        }
        if (view === "help") {
            document.title = "Help – Remote Designer";
            return;
        }
        if (view === "community") {
            document.title = "Community Remote – Remote Designer";
            return;
        }
        document.title = "Remote Label Designer for Home Automation";
    }, [legalPage, view]);

    useEffect(() => {
        if (!import.meta.env.PROD) return;
        if (plausibleInitializedRef.current) return;
        plausibleInit({
            domain: PLAUSIBLE_DOMAIN,
            autoCapturePageviews: false,
        });
        plausibleInitializedRef.current = true;
    }, []);

    useEffect(() => {
        if (!import.meta.env.PROD) return;
        if (!plausibleInitializedRef.current) return;
        plausibleTrack("pageview", {
            url: window.location.href,
            props: {
                page: getPlausiblePageLabel(view, legalPage),
            },
        });
    }, [view, legalPage]);

    useEffect(() => {
        const onPopState = () => {
            setView(getUrlView());
            setLegalPage(getUrlLegalPage());
        };
        window.addEventListener("popstate", onPopState);
        return () => window.removeEventListener("popstate", onPopState);
    }, []);

    const communityRemotes = useMemo(() => {
        return communityDrafts.map((entry) => {
            const draft = entry.draft;
            return {
                id: entry.id,
                name: draft.name.trim() || "Community Draft",
                description: "Community submission (draft)",
                isDraft: true,
                isCommunity: true,
                widthMm: draft.widthMm,
                heightMm: draft.heightMm,
                cornerMm: draft.cornerMm,
                buttons: draft.buttons,
                previewElements: [],
                cutoutElements: draft.cutouts,
                links: [...(draft.manufacturerUrl ? [{ label: "Manufacturer", url: draft.manufacturerUrl }] : []), ...(draft.imageUrl ? [{ label: "Image", url: draft.imageUrl }] : [])],
            } as RemoteTemplate;
        });
    }, [communityDrafts]);

    const communityTemplate = useMemo<RemoteTemplate>(() => {
        const template = buildCommunityTemplate(communityDraft);
        template.notes = communityDraft.notes.trim() || null;
        template.tags = communityDraft.tags;
        template.manufacturerUrl = communityDraft.manufacturerUrl || null;
        template.imageUrl = communityDraft.imageUrl || null;
        template.appVersion = APP_VERSION;
        return template;
    }, [communityDraft]);


    const remotes = useMemo(() => {
        const list = [...REMOTES, ...communityRemotes];
        const previewRemote = communityTemplate;
        if (previewRemote) {
            const existingIndex = list.findIndex((remote) => remote.id === previewRemote.id);
            if (existingIndex >= 0) list.splice(existingIndex, 1);
            list.push(previewRemote);
        }
        return list;
    }, [communityRemotes, communityTemplate]);
    const normalize = useCallback((input: NormalizableState) => normalizeState(input, remotes), [remotes]);

    useEffect(() => {
        if (communityCopyStatus === "idle") return;
        const t = window.setTimeout(() => setCommunityCopyStatus("idle"), 4000);
        return () => window.clearTimeout(t);
    }, [communityCopyStatus]);

    const [state, setState] = useState<DesignState>(() => {
        // In gallery view we do not try to parse the hash as state.
        if (getUrlView() !== "configure") return initial;
        return normalizeState(loadFromHash<DesignState>() ?? initial, remotes);
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
    const [showSavedStatus, setShowSavedStatus] = useState(false);
    const savedStatusTimerRef = useRef<number | null>(null);

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

    const triggerSavedStatus = () => {
        if (savedStatusTimerRef.current) {
            window.clearTimeout(savedStatusTimerRef.current);
        }
        setShowSavedStatus(true);
        savedStatusTimerRef.current = window.setTimeout(() => {
            setShowSavedStatus(false);
            savedStatusTimerRef.current = null;
        }, 10000);
    };

    const goTo = (next: ViewKind) => {
        if (next === "gallery") {
            refreshSavedDesigns();
        }
        setUrlView(next);
        setView(next);
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

        setState(normalize(found.state));

        setActiveSavedId(found.id);
        setLoadedSnapshot(normalize(found.state));
        setLoadedName(found.name);
        setSaveName(found.name);
        setSaveNameError("");
    };

    const openSavedDesign = (design: SavedDesign) => {
        setState(normalize(design.state));
        setActiveSavedId(design.id);
        setLoadedSnapshot(normalize(design.state));
        setLoadedName(design.name);
        setSaveName(design.name);
        setSaveNameError("");
        setSelectedSavedId(design.id);
        setShowSavedStatus(false);
    };

    const saveAsNewDesign = () => {
        const name = saveName.trim();
        if (!name) return;

        const now = getNowTimestamp();
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
        triggerSavedStatus();
        maybePromptSendConfig(created.id);
    };

    const saveActiveDesign = () => {
        if (!activeSavedId) return;
        const name = saveName.trim();
        if (!name) return;

        const now = getNowTimestamp();
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
        triggerSavedStatus();
        maybePromptSendConfig(activeSavedId);
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
        trackEvent("export_saved_designs", { count: items.length });
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
        trackEvent("export_saved_design", { remote_id: found.state.remoteId || "remote" });
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
        trackEvent("import_saved_designs", { count: parsed.items.length, skipped: parsed.invalidCount });
    };

    /* persist state in URL */
    useEffect(() => {
        // Do not persist editor state into the hash unless the configurator is shown.
        if (!isConfigure) return;
        const t = window.setTimeout(() => saveToHash(state), 150);
        return () => window.clearTimeout(t);
    }, [state, isConfigure]);

    const o = state.options;
    const baseTemplate = useMemo(() => remotes.find((r) => r.id === state.remoteId) ?? remotes[0], [state.remoteId, remotes]);
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
        return new Map(remotes.map((r) => [r.id, r.name] as const));
    }, [remotes]);

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

    const buildShareMailto = (params: { url: string; configCode: string; galleryConsent: string; remoteName: string; remoteId: string; savedId: string }) => {
        const body = SHARE_MAIL_BODY_TEMPLATE.replace("{url}", params.url).replace("{config}", params.configCode).replace("{galleryConsent}", params.galleryConsent).replace("{remoteName}", params.remoteName).replace("{remoteId}", params.remoteId).replace("{savedId}", params.savedId);
        return `mailto:${LEGAL_CONTACT.email}?subject=${encodeURIComponent(SHARE_MAIL_SUBJECT)}&body=${encodeURIComponent(body)}`;
    };

    const communityPayload = useMemo(() => buildCommunityPayload(communityDraft, communityTemplate, APP_VERSION), [communityDraft, communityTemplate]);
    const communityDraftSig = useMemo(() => JSON.stringify(communityDraft), [communityDraft]);
    const communitySavedSig = useMemo(() => {
        if (!communitySelectedId) return "";
        const entry = communityDrafts.find((draftEntry) => draftEntry.id === communitySelectedId);
        if (!entry) return "";
        return JSON.stringify(entry.draft);
    }, [communityDrafts, communitySelectedId]);
    const communityHasUnsavedChanges = communityDraftSig !== communitySavedSig;

    const communityJson = useMemo(() => JSON.stringify(communityPayload, null, 2), [communityPayload]);
    const communityPreviewState = useMemo(
        () =>
            normalizeState(
                {
                    ...initial,
                    remoteId: COMMUNITY_PREVIEW_ID,
                },
                [communityTemplate],
            ),
        [communityTemplate],
    );
    const buildCommunityMailto = () => {
        const body = COMMUNITY_REMOTE_BODY_TEMPLATE.replace("{remoteName}", communityTemplate.name)
            .replace("{width}", String(communityTemplate.widthMm))
            .replace("{height}", String(communityTemplate.heightMm))
            .replace("{corner}", String(communityTemplate.cornerMm))
            .replace("{manufacturer}", communityDraft.manufacturerUrl || "-")
            .replace("{image}", communityDraft.imageUrl || "-")
            .replace("{notes}", communityDraft.notes.trim() || "-")
            .replace("{json}", communityJson);
        return `mailto:${LEGAL_CONTACT.email}?subject=${encodeURIComponent(COMMUNITY_REMOTE_SUBJECT)}&body=${encodeURIComponent(body)}`;
    };

    const showWatermark = FEATURES.WATERMARK;
    const watermarkText = "PREVIEW PREVIEW PREVIEW";
    const watermarkOpacity = 0.2;

    const hueIconsLoaded = useSyncExternalStore(subscribeHueIcons, getHueIconsLoadedSnapshot);
    const galleryUsesHueIcons = useMemo(() => remotesUseHueIcons(remotes) || savedDesigns.some((d) => stateUsesHueIcons(d.state)), [savedDesigns, remotes]);
    const shouldPreloadHueIcons = useMemo(() => {
        if (!isGallery && !isConfigure) return false;
        return isGallery ? galleryUsesHueIcons : stateUsesHueIcons(state);
    }, [isGallery, isConfigure, galleryUsesHueIcons, state]);

    useEffect(() => {
        if (!shouldPreloadHueIcons || hueIconsLoaded) return;
        if (!isGallery) {
            void preloadHueIcons();
            return;
        }
        const idle = typeof window !== "undefined" ? (window as Window & { requestIdleCallback?: (cb: () => void, opts?: { timeout: number }) => number }).requestIdleCallback : undefined;
        if (idle) {
            const handle = idle(() => void preloadHueIcons(), { timeout: 2500 });
            return () => {
                if (typeof window !== "undefined" && (window as Window & { cancelIdleCallback?: (id: number) => void }).cancelIdleCallback) {
                    (window as Window & { cancelIdleCallback?: (id: number) => void }).cancelIdleCallback!(handle);
                }
            };
        }
        const t = window.setTimeout(() => void preloadHueIcons(), 1500);
        return () => window.clearTimeout(t);
    }, [shouldPreloadHueIcons, hueIconsLoaded, isGallery]);

    const fullMdiLoaded = useSyncExternalStore(subscribeFullMdi, getFullMdiLoadedSnapshot);
    const galleryUsesFullMdi = useMemo(() => remotesUseFullMdi(remotes) || savedDesigns.some((d) => stateUsesFullMdi(d.state)), [savedDesigns, remotes]);
    const shouldPreloadFullMdi = useMemo(() => {
        if (!isGallery && !isConfigure) return false;
        return isGallery ? galleryUsesFullMdi : stateUsesFullMdi(state);
    }, [isGallery, isConfigure, galleryUsesFullMdi, state]);
    const overlayRoot = typeof document !== "undefined" ? document.getElementById("overlay-root") : null;
    const [previewOpen, setPreviewOpen] = useState(false);
    const [previewHeightVh, setPreviewHeightVh] = useState(32);
    const previewHeightRef = useRef(32);
    const dragStateRef = useRef<{ startY: number; startHeight: number } | null>(null);
    const [highlightedButtonId, setHighlightedButtonId] = useState<string | null>(null);

    useEffect(() => {
        if (!shouldPreloadFullMdi || fullMdiLoaded) return;
        if (!isGallery) {
            void preloadFullMdi();
            return;
        }
        const idle = typeof window !== "undefined" ? (window as Window & { requestIdleCallback?: (cb: () => void, opts?: { timeout: number }) => number }).requestIdleCallback : undefined;
        if (idle) {
            const handle = idle(() => void preloadFullMdi(), { timeout: 2500 });
            return () => {
                if (typeof window !== "undefined" && (window as Window & { cancelIdleCallback?: (id: number) => void }).cancelIdleCallback) {
                    (window as Window & { cancelIdleCallback?: (id: number) => void }).cancelIdleCallback!(handle);
                }
            };
        }
        const t = window.setTimeout(() => void preloadFullMdi(), 1500);
        return () => window.clearTimeout(t);
    }, [shouldPreloadFullMdi, fullMdiLoaded, isGallery]);

    const iconLoadStatus = useMemo(() => {
        const parts: string[] = [];
        if (shouldPreloadFullMdi && !fullMdiLoaded) parts.push("MDI");
        if (shouldPreloadHueIcons && !hueIconsLoaded) parts.push("Hue");
        if (!parts.length) return null;
        return `Loading icon libraries: ${parts.join(" + ")}…`;
    }, [shouldPreloadFullMdi, fullMdiLoaded, shouldPreloadHueIcons, hueIconsLoaded]);

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
        if (icon) {
            trackEvent("icon_selected", {
                remote_id: state.remoteId,
                icon_set: getIconSetName(icon),
                icon_name: getIconName(icon),
                tap,
            });
        }
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
            const prevIconColors = prevCfg.iconColors ?? {};
            const nextIconColors: Partial<Record<TapType, string>> = { ...prevIconColors };

            if (icon) {
                nextIcons[tap] = icon;
            } else {
                delete nextIcons[tap];
                delete nextStrike[tap]; // if the icon is removed, remove its strike flag too
                delete nextIconColors[tap];
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
                        iconColors: nextIconColors,
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

    const setIconColor = (buttonId: string, tap: TapType, color?: string) => {
        setState((s) => {
            const prev = s.buttonConfigs[buttonId] ?? { icons: {} };
            const prevColors = prev.iconColors ?? {};
            const nextColors: Partial<Record<TapType, string>> = { ...prevColors };

            if (color) {
                nextColors[tap] = color;
            } else {
                delete nextColors[tap];
            }

            return {
                ...s,
                buttonConfigs: {
                    ...s.buttonConfigs,
                    [buttonId]: {
                        ...prev,
                        iconColors: nextColors,
                    },
                },
            };
        });
    };

    const setButtonFill = (buttonId: string, color?: string) => {
        setState((s) => {
            const prev = s.buttonConfigs[buttonId] ?? { icons: {} };
            const nextFill = color || undefined;

            return {
                ...s,
                buttonConfigs: {
                    ...s.buttonConfigs,
                    [buttonId]: {
                        ...prev,
                        buttonFill: nextFill,
                    },
                },
            };
        });
    };

    /* ------------------------------ share link ----------------------------- */

    const [shareStatus, setShareStatus] = useState<"idle" | "copied" | "failed">("idle");
    const [sendConfigOpen, setSendConfigOpen] = useState(false);
    const [sendConfigUrl, setSendConfigUrl] = useState("");
    const [galleryConsent, setGalleryConsent] = useState<"yes" | "no" | null>(null);
    const [showConsentError, setShowConsentError] = useState(false);

    useEffect(() => {
        if (typeof document === "undefined") return;
        if (!sendConfigOpen) return;
        const { body } = document;
        const prevOverflow = body.style.overflow;
        const prevPosition = body.style.position;
        const prevTop = body.style.top;
        const prevWidth = body.style.width;
        const scrollY = window.scrollY;
        body.style.overflow = "hidden";
        body.style.position = "fixed";
        body.style.top = `-${scrollY}px`;
        body.style.width = "100%";
        return () => {
            body.style.overflow = prevOverflow;
            body.style.position = prevPosition;
            body.style.top = prevTop;
            body.style.width = prevWidth;
            window.scrollTo(0, scrollY);
        };
    }, [sendConfigOpen]);

    const incrementSendPromptCount = (savedId: string) => {
        if (typeof window === "undefined") return 0;
        try {
            const raw = window.localStorage.getItem(SEND_PROMPT_COUNT_KEY);
            const map = raw ? (JSON.parse(raw) as Record<string, number>) : {};
            const current = typeof map[savedId] === "number" ? map[savedId] : 0;
            const next = current + 1;
            map[savedId] = next;
            window.localStorage.setItem(SEND_PROMPT_COUNT_KEY, JSON.stringify(map));
            return next;
        } catch {
            return 0;
        }
    };

    const shouldPromptForSend = (count: number) => count >= 2 && (count - 2) % 3 === 0;

    const buildConfigCode = (params: { allowGallery: boolean }) => {
        const exampleId = getRandomId();
        const consentId = `consent_${exampleId}`;
        const options = baseTemplate.isStickerSheet
            ? state.options
            : {
                  ...state.options,
                  labelWidthMm: undefined,
                  labelHeightMm: undefined,
                  labelCornerMm: undefined,
                  labelCount: undefined,
                  sheetSize: undefined,
                  sheetMarginXMm: undefined,
                  sheetMarginYMm: undefined,
                  sheetGapMm: undefined,
              };
        const payload = {
            meta: {
                id: exampleId,
                userExample: true,
                allowGallery: params.allowGallery,
                savedName: saveName.trim() || null,
                savedId: activeSavedId,
                exportedAt: new Date().toISOString(),
                consentId,
                appVersion: APP_VERSION,
                stateSig,
            },
            state: {
                ...state,
                options,
            },
        };
        return JSON.stringify(payload, null, 4);
    };

    const openSendConfigPrompt = () => {
        saveToHash(state);
        const url = getShareUrl();
        setSendConfigUrl(url);
        setGalleryConsent(null);
        setShowConsentError(false);
        setSendConfigOpen(true);
    };

    const updateCommunityDraft = (patch: Partial<CommunityDraft>) => {
        setCommunityDraft((prev) => ({ ...prev, ...patch }));
    };

    const updateCommunityButton = (index: number, patch: Partial<CommunityButtonDraft>) => {
        setCommunityDraft((prev) => {
            const buttons = prev.buttons.map((button, i) => (i === index ? { ...button, ...patch } : button));
            return { ...prev, buttons };
        });
    };

    const addCommunityButton = () => {
        setCommunityDraft((prev) => {
            const nextIndex = prev.buttons.length + 1;
            return {
                ...prev,
                buttons: [...prev.buttons, { id: `button_${nextIndex}`, xMm: 0, yMm: 0, wMm: 12, hMm: 12, rMm: 0 }],
            };
        });
    };

    const removeCommunityButton = (index: number) => {
        setCommunityDraft((prev) => ({ ...prev, buttons: prev.buttons.filter((_, i) => i !== index) }));
    };

    const updateCommunityCutout = (index: number, next: CutoutElement) => {
        setCommunityDraft((prev) => {
            const cutouts = prev.cutouts.map((cutout, i) => (i === index ? next : cutout));
            return { ...prev, cutouts };
        });
    };

    const addCommunityCutoutRect = () => {
        setCommunityDraft((prev) => ({
            ...prev,
            cutouts: [...prev.cutouts, { kind: "rect", xMm: 4, yMm: 4, wMm: 10, hMm: 10, rMm: 0, stroke: "#6f6f6f", strokeWidthMm: 0.2 }],
        }));
    };

    const addCommunityCutoutCircle = () => {
        setCommunityDraft((prev) => ({
            ...prev,
            cutouts: [...prev.cutouts, { kind: "circle", cxMm: 10, cyMm: 10, rMm: 3, stroke: "#6f6f6f", strokeWidthMm: 0.2 }],
        }));
    };

    const removeCommunityCutout = (index: number) => {
        setCommunityDraft((prev) => ({ ...prev, cutouts: prev.cutouts.filter((_, i) => i !== index) }));
    };

    const launchCommunityConfigurator = () => {
        const nextTemplate = communityTemplate;
        setState(normalizeState({ ...initial, remoteId: COMMUNITY_PREVIEW_ID }, [...REMOTES, ...communityRemotes, nextTemplate]));
        setSaveName("");
        setSaveNameError("");
        setActiveSavedId(null);
        setLoadedSnapshot(null);
        setLoadedName("");
        setSelectedSavedId("");
        goTo("configure");
        requestAnimationFrame(() => window.scrollTo({ top: 0, behavior: "smooth" }));
    };

    const copyCommunityJson = async () => {
        try {
            await navigator.clipboard.writeText(communityJson);
            setCommunityCopyStatus("copied");
        } catch (error) {
            console.warn("Copy community JSON failed", error);
            setCommunityCopyStatus("failed");
        }
    };

    const downloadCommunityJson = () => {
        const nameBase = sanitizeFilenameBase(communityTemplate.name);
        downloadTextFile(`community-remote-${nameBase}.json`, communityJson, "application/json");
    };

    const sendCommunityToDeveloper = () => {
        window.location.href = buildCommunityMailto();
    };

    const saveCommunityDraft = () => {
        setCommunityDrafts((prev) => {
            const now = Date.now();
            const name = communityDraft.name.trim() || "Community Draft";
            let nextDrafts = [...prev];
            if (communitySelectedId) {
                nextDrafts = nextDrafts.map((entry) => (entry.id === communitySelectedId ? { ...entry, name, draft: createCommunityDraft({ ...communityDraft, id: communitySelectedId }), updatedAt: now } : entry));
            } else {
                const id = createCommunityRemoteId();
                nextDrafts = [{ id, name, draft: createCommunityDraft({ ...communityDraft, id }), updatedAt: now }, ...nextDrafts];
                setCommunitySelectedId(id);
            }
            writeCommunityDrafts(nextDrafts);
            return nextDrafts;
        });
    };

    const loadCommunityDraft = (id: string) => {
        if (!id) {
            setCommunitySelectedId("");
            return;
        }
        const entry = communityDrafts.find((draft) => draft.id === id);
        if (!entry) return;
        setCommunityDraft(createCommunityDraft({ ...entry.draft, id: entry.id }));
        setCommunitySelectedId(entry.id);
    };

    const deleteCommunityDraft = () => {
        if (!communitySelectedId) return;
        setCommunityDrafts((prev) => {
            const nextDrafts = prev.filter((entry) => entry.id !== communitySelectedId);
            writeCommunityDrafts(nextDrafts);
            return nextDrafts;
        });
        setCommunitySelectedId("");
    };

    const newCommunityDraft = () => {
        setCommunityDraft(createCommunityDraft());
        setCommunitySelectedId("");
    };

    const maybePromptSendConfig = (savedId: string | null) => {
        if (!savedId) return;
        const count = incrementSendPromptCount(savedId);
        if (shouldPromptForSend(count)) {
            openSendConfigPrompt();
        }
    };

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
            trackEvent("share_link_copied", { remote_id: state.remoteId });
        } catch {
            setShareStatus("failed");
        }
    };

    /* ------------------------- copy remote example ------------------------- */

    const [remoteExampleStatus, setRemoteExampleStatus] = useState<"idle" | "copied" | "failed">("idle");

    const buildRemoteExampleSnippet = () => {
        saveToHash(state);
        const exampleId = getRandomId();
        const consentId = `consent_${exampleId}`;
        const options = baseTemplate.isStickerSheet
            ? state.options
            : {
                  ...state.options,
                  labelWidthMm: undefined,
                  labelHeightMm: undefined,
                  labelCornerMm: undefined,
                  labelCount: undefined,
                  sheetSize: undefined,
                  sheetMarginXMm: undefined,
                  sheetMarginYMm: undefined,
                  sheetGapMm: undefined,
              };
        const payload = {
            meta: {
                id: exampleId,
                userExample: true,
                allowGallery: true,
                savedName: saveName.trim() || null,
                savedId: activeSavedId,
                exportedAt: new Date().toISOString(),
                consentId,
                appVersion: APP_VERSION,
                stateSig,
            },
            state: {
                ...state,
                options,
            },
        };
        return `${JSON.stringify(payload, null, 4)},`;
    };

    const copyRemoteExampleSnippet = async () => {
        try {
            const snippet = buildRemoteExampleSnippet();
            await navigator.clipboard.writeText(snippet);
            setRemoteExampleStatus("copied");
            window.setTimeout(() => setRemoteExampleStatus("idle"), 2000);
        } catch {
            setRemoteExampleStatus("failed");
            window.setTimeout(() => setRemoteExampleStatus("idle"), 2000);
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
        trackEvent("export", { type: "remote_svg", remote_id: state.remoteId });
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
        trackEvent("export", { type: "labels_zip", remote_id: state.remoteId });
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
            trackEvent("export", { type: "remote_pdf", remote_id: state.remoteId, sheet: "A4" });
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
        trackEvent("export", { type: "sticker_pdf", remote_id: state.remoteId, sheet: o.sheetSize });
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
        trackEvent("export", { type: "sticker_svg_zip", remote_id: state.remoteId, pages: layout.pages });
    };

    const handleRemoteChange = (nextRemoteId: DesignState["remoteId"]) => {
        trackEvent("remote_selected", { remote_id: nextRemoteId });
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

    const jumpToButtonConfig = (buttonId: string) => {
        const isMobile = window.matchMedia("(max-width: 900px)").matches;
        if (previewOpen && !isMobile) setPreviewOpen(false);
        setHighlightedButtonId(buttonId);
        window.setTimeout(() => setHighlightedButtonId(null), 2200);
        window.setTimeout(() => {
            const target = document.getElementById(`button-config-${buttonId}`);
            if (!target) return;
            target.scrollIntoView({ behavior: "smooth", block: "start" });
        }, 0);
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

    const legalKind = legalPage ?? "impressum";

    const problemRemote = useMemo(() => REMOTES.find((remote) => remote.id === "tuya_ts0044") ?? null, []);
    const problemFactoryState = useMemo(() => {
        if (!problemRemote) return null;
        const example = problemRemote.examples?.find((ex) => !isUserExample(ex) && ex.id === "factory");
        return example ? buildStateFromExample({ remoteId: problemRemote.id, example }) : null;
    }, [problemRemote]);
    const problemLayoutState = useMemo(() => {
        if (!problemRemote) return null;
        const example = problemRemote.examples?.find((ex) => !isUserExample(ex) && ex.id === "default");
        return example ? buildStateFromExample({ remoteId: problemRemote.id, example }) : null;
    }, [problemRemote]);

    const previewSpacingStyle = isConfigure
        ? ({
              "--app-preview-safe": "env(safe-area-inset-bottom)",
              "--app-preview-state": previewOpen ? `${previewHeightVh}vh` : "4rem",
              "--controls-preview-state": previewOpen ? `${previewHeightVh}vh` : "4rem",
          } as CSSProperties)
        : undefined;

    return (
        <>
            <main className="app" style={previewSpacingStyle}>
                <SiteHeader isAdmin={isAdmin} />

                {isLegal ? (
                    <LegalPage
                        kind={legalKind}
                        contact={LEGAL_CONTACT}
                        backHref={getAppHref()}
                        onBack={(event) => {
                            event.preventDefault();
                            setLegalPage(null);
                            setUrlLegalPage(null);
                        }}
                    />
                ) : (
                    <>
                        <TopNav
                            view={view}
                            homeHref={getViewHref("home")}
                            configureHref={getViewHref("configure")}
                            galleryHref={getViewHref("gallery")}
                            helpHref={getViewHref("help")}
                            communityHref={getViewHref("community")}
                            onGoHome={(event) => {
                                event.preventDefault();
                                goTo("home");
                            }}
                            onGoConfigure={(event) => {
                                event.preventDefault();
                                if (view === "community") {
                                    launchCommunityConfigurator();
                                    return;
                                }
                                goTo("configure");
                            }}
                            onGoGallery={(event) => {
                                event.preventDefault();
                                goTo("gallery");
                            }}
                            onGoHelp={(event) => {
                                event.preventDefault();
                                goTo("help");
                            }}
                            onGoCommunity={(event) => {
                                event.preventDefault();
                                goTo("community");
                            }}
                        />

                        {isHome ? (
                            <div className="pageWrap">
                                <HomePage
                                    configureHref={getViewHref("configure")}
                                    galleryHref={getViewHref("gallery")}
                                    onGoConfigure={(event) => {
                                        event.preventDefault();
                                        goTo("configure");
                                    }}
                                    onGoGallery={(event) => {
                                        event.preventDefault();
                                        goTo("gallery");
                                    }}
                                    problemRemote={problemRemote}
                                    problemFactoryState={problemFactoryState}
                                    problemLayoutState={problemLayoutState}
                                />
                            </div>
                        ) : null}

                        {isHelp ? (
                            <div className="pageWrap">
                                <HelpPage
                                    configureHref={getViewHref("configure")}
                                    galleryHref={getViewHref("gallery")}
                                    onGoConfigure={(event) => {
                                        event.preventDefault();
                                        goTo("configure");
                                    }}
                                    onGoGallery={(event) => {
                                        event.preventDefault();
                                        goTo("gallery");
                                    }}
                                />
                            </div>
                        ) : null}

                        {isCommunity ? (
                            <div className="pageWrap">
                                <CommunityRemotePage
                                    draft={communityDraft}
                                    template={communityTemplate}
                                    previewState={communityPreviewState}
                                    showWatermark={showWatermark}
                                    watermarkText={watermarkText}
                                    watermarkOpacity={watermarkOpacity}
                                    onChangeDraft={updateCommunityDraft}
                                    onUpdateButton={updateCommunityButton}
                                    onAddButton={addCommunityButton}
                                    onRemoveButton={removeCommunityButton}
                                    onUpdateCutout={updateCommunityCutout}
                                    onAddCutoutRect={addCommunityCutoutRect}
                                    onAddCutoutCircle={addCommunityCutoutCircle}
                                    onRemoveCutout={removeCommunityCutout}
                                    onUseInConfigurator={launchCommunityConfigurator}
                                    onCopyJson={copyCommunityJson}
                                    onDownloadJson={downloadCommunityJson}
                                    onSendToDeveloper={sendCommunityToDeveloper}
                                    copyStatus={communityCopyStatus}
                                    drafts={communityDrafts.map((entry) => ({ id: entry.id, name: entry.name, updatedAt: entry.updatedAt }))}
                                    selectedDraftId={communitySelectedId}
                                    hasUnsavedChanges={communityHasUnsavedChanges}
                                    onSelectDraft={loadCommunityDraft}
                                    onSaveDraft={saveCommunityDraft}
                                    onDeleteDraft={deleteCommunityDraft}
                                    onNewDraft={newCommunityDraft}
                                />
                            </div>
                        ) : null}

                        {isGallery ? (
                            <GalleryLayout>
                                <GalleryView
                                    remotes={remotes}
                                    savedDesigns={savedDesigns}
                                    buildStateFromExample={buildStateFromExample}
                                    showWatermark={showWatermark}
                                    watermarkText={watermarkText}
                                    watermarkOpacity={watermarkOpacity}
                                    iconLoadStatus={isGallery ? iconLoadStatus : null}
                                    onOpenPreview={({ state: nextState }) => {
                                        setState(normalize(nextState));
                                        goTo("configure");
                                        requestAnimationFrame(() => {
                                            window.scrollTo({ top: 0, behavior: "smooth" });
                                        });
                                    }}
                                    onOpenSaved={(design) => {
                                        openSavedDesign(design);
                                        goTo("configure");
                                        requestAnimationFrame(() => {
                                            window.scrollTo({ top: 0, behavior: "smooth" });
                                        });
                                    }}
                                />
                            </GalleryLayout>
                        ) : null}

                        {isConfigure ? (
                            <EditorLayout
                                title="Configurator"
                                subtitle="Set up your remote, test the layout, and export the final stickers."
                                intro={
                                    <ConfiguratorIntro
                                        helpHref={getViewHref("help")}
                                        onGoHelp={(event) => {
                                            event.preventDefault();
                                            goTo("help");
                                        }}
                                        onSendConfig={openSendConfigPrompt}
                                    />
                                }
                                controls={
                                    <ControlsLayout
                                        left={
                                            <>
                                                <RemoteSection remotes={remotes} remoteId={state.remoteId} remoteImageUrl={remoteImageUrl} onChangeRemote={handleRemoteChange} onResetRemote={resetCurrentRemote} />

                                                <SavedDesignsSection
                                                    saveName={saveName}
                                                    saveNameError={saveNameError}
                                                    onChangeSaveName={handleSaveNameChange}
                                                    onBlurSaveName={handleSaveNameBlur}
                                                    activeSavedId={activeSavedId}
                                                    hasUnsavedChanges={hasUnsavedChanges}
                                                    showSavedStatus={showSavedStatus}
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

                                                <ShareExportSection shareStatus={shareStatus} onCopyShareLink={copyShareLink} shareUrl={shareUrl} onSendConfig={openSendConfigPrompt} isAdmin={isAdmin} onExportRemoteSvg={exportRemoteSvg} onExportZip={exportZip} isZipping={isZipping} dpi={dpi} onChangeDpi={setDpi} showA4Pdf={isStickerSheet} onExportA4Pdf={exportA4Pdf} showSvgAllPages={isStickerSheet && stickerPages > 1} onExportAllPagesSvgZip={exportAllPagesSvgZip} onExportRemoteJson={exportSelectedDesign} onCopyRemoteExample={copyRemoteExampleSnippet} remoteExampleStatus={remoteExampleStatus} />
                                            </>
                                        }
                                        full={<ButtonsSection buttonIds={buttonIds} state={state} tapLabel={tapLabel} onSetIcon={setIcon} onToggleStrike={toggleStrike} onSetIconColor={setIconColor} onSetButtonFill={setButtonFill} highlightedButtonId={highlightedButtonId} />}
                                    />
                                }
                                preview={
                                    <div className="previewStack">
                                        {!isGallery && iconLoadStatus ? (
                                            <div className="previewStatus" role="status" aria-live="polite">
                                                <span className="statusSpinner" aria-hidden="true" />
                                                {iconLoadStatus}
                                            </div>
                                        ) : null}
                                        <PreviewPane template={template} state={previewState} showWatermark={showWatermark} watermarkText={watermarkText} watermarkOpacity={watermarkOpacity} isStickerSheet={isStickerSheet} pageIndex={stickerPageIndexSafe} pages={stickerPages} onChangePage={setStickerPageIndex} onSelectButton={jumpToButtonConfig} className="preview--desktop" showMissingIconPlaceholder={!!iconLoadStatus} />
                                        <a className="tipJar__imageLink" href="https://www.buymeacoffee.com/tgermer" target="_blank" rel="noopener noreferrer">
                                            <img className="tipJar__image" src="/buyMeACoffee.webp" alt="Buy Me A Coffee" />
                                        </a>
                                    </div>
                                }
                                help={<HelpSection />}
                            />
                        ) : null}

                        {isConfigure ? <HiddenExportRenderers exportRemoteHostRef={exportRemoteHostRef} exportButtonHostRef={exportButtonHostRef} template={template} state={state} exportButton={exportButton} labelWidthMm={labelWidthMm} labelHeightMm={labelHeightMm} showScaleBar={isStickerSheet ? false : o.showScaleBar} showWatermark={showWatermark} watermarkText={watermarkText} watermarkOpacity={watermarkOpacity} /> : null}
                    </>
                )}

                <SiteFooter
                    impressumHref={getLegalHref("impressum")}
                    datenschutzHref={getLegalHref("datenschutz")}
                    onOpenLegal={(page) => {
                        setLegalPage(page);
                        setUrlLegalPage(page);
                    }}
                />
            </main>
            {isConfigure && !isLegal && overlayRoot
                ? createPortal(
                      <div className={`previewOverlay ${previewOpen ? "previewOverlay--open" : "previewOverlay--closed"}`} style={{ ["--preview-height" as string]: `${previewHeightVh}vh` }}>
                          {previewOpen ? (
                              <div className="previewOverlay__sheet" role="dialog" aria-label="Preview">
                                  <div
                                      className="previewOverlay__header"
                                      onPointerDown={(event) => {
                                          dragStateRef.current = { startY: event.clientY, startHeight: previewHeightVh };
                                      }}
                                  >
                                      <div className="previewOverlay__handle" aria-hidden="true" />
                                        <Button type="button" className="previewOverlay__close" aria-label="Close preview" onClick={() => setPreviewOpen(false)}>
                                            <UiIcon name="mdi:close-circle-outline" className="icon" />
                                        </Button>
                                  </div>
                                  <PreviewPane template={template} state={previewState} showWatermark={showWatermark} watermarkText={watermarkText} watermarkOpacity={watermarkOpacity} isStickerSheet={isStickerSheet} pageIndex={stickerPageIndexSafe} pages={stickerPages} onChangePage={setStickerPageIndex} onSelectButton={jumpToButtonConfig} className="preview--overlay" showMissingIconPlaceholder={!!iconLoadStatus} />
                              </div>
                          ) : (
                              <Button type="button" className="previewOverlay__bar" onClick={() => setPreviewOpen(true)}>
                                  Preview
                              </Button>
                          )}
                      </div>,
                      overlayRoot,
                  )
                : null}
            {isConfigure && !isLegal && overlayRoot && sendConfigOpen
                ? createPortal(
                      <div
                          className="sharePromptOverlay"
                          role="presentation"
                          onClick={(event) => {
                              if (event.target === event.currentTarget) setSendConfigOpen(false);
                          }}
                      >
                          <div className="sharePrompt" role="dialog" aria-modal="true" aria-label="Share configuration">
                              <div className="sharePrompt__header">
                                  <h2>Share your configuration</h2>
                                  <Button type="button" className="sharePrompt__close" onClick={() => setSendConfigOpen(false)} aria-label="Close">
                                      <UiIcon name="mdi:close" className="icon" />
                                  </Button>
                              </div>
                              <div className="sharePrompt__body">
                                  <p>If you’d like, you can send your configuration to help improve this tool.</p>
                                  <p>Real-world setups help me understand how the tool is used and which remote models and layouts are most valuable to add.</p>
                                  <p>
                                      Your configuration is only reviewed by the developer and is not published by default. <strong>Thank you!</strong>
                                  </p>
                                  <hr className="sharePrompt__divider" />
                                  <div className="sharePrompt__section">
                                      <div className="sharePrompt__subtitle">Optional: allow use in the public gallery</div>
                                      <p>Would you like to allow this configuration (or parts of it) to be used as an anonymized example in the public gallery?</p>
                                      <ul>
                                          <li>No personal names or identifiable details will be shown</li>
                                          <li>Declining has no effect on using the tool</li>
                                          <li>You can withdraw your consent at any time</li>
                                      </ul>
                                      <div className={`sharePrompt__consent${showConsentError ? " sharePrompt__consent--error" : ""}`}>
                                          <div className="sharePrompt__consentRequired" aria-hidden="true">
                                              Required *
                                          </div>
                                          <label>
                                              <input
                                                  type="radio"
                                                  name="sharePromptConsent"
                                                  value="yes"
                                                  checked={galleryConsent === "yes"}
                                                  onChange={() => {
                                                      setGalleryConsent("yes");
                                                      setShowConsentError(false);
                                                  }}
                                              />
                                              Yes, you may use this configuration as an anonymized gallery example
                                          </label>
                                          <label>
                                              <input
                                                  type="radio"
                                                  name="sharePromptConsent"
                                                  value="no"
                                                  checked={galleryConsent === "no"}
                                                  onChange={() => {
                                                      setGalleryConsent("no");
                                                      setShowConsentError(false);
                                                  }}
                                              />
                                              No, keep this configuration private
                                          </label>
                                          {showConsentError ? <div className="sharePrompt__error">Please select one option.</div> : null}
                                      </div>
                                  </div>
                              </div>
                              <div className="sharePrompt__actions">
                                  <Button variant="danger" type="button" onClick={() => setSendConfigOpen(false)}>
                                      Not now
                                  </Button>
                                  <a
                                      className="btn"
                                      href={buildShareMailto({
                                          url: sendConfigUrl || shareUrl,
                                          configCode: buildConfigCode({ allowGallery: galleryConsent === "yes" }),
                                          galleryConsent: galleryConsent === "yes" ? "yes" : "no",
                                          remoteName: baseTemplate.name,
                                          remoteId: baseTemplate.id,
                                          savedId: activeSavedId ?? "n/a",
                                      })}
                                      onClick={(event) => {
                                          if (galleryConsent === null) {
                                              event.preventDefault();
                                              setShowConsentError(true);
                                              return;
                                          }
                                          setSendConfigOpen(false);
                                      }}
                                  >
                                      Open email
                                  </a>
                              </div>
                          </div>
                      </div>,
                      overlayRoot,
                  )
                : null}
        </>
    );
}
