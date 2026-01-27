import { memo, useEffect, useMemo, useRef, useState } from "react";
import type { DesignState } from "../app/types";
import { isUserExample, type ExampleEntry, type RemoteTemplate } from "../app/remotes";
import type { SavedDesign } from "../app/savedDesigns";
import { A4_SIZE_MM, LETTER_SIZE_MM, getStickerSheetLayout } from "../app/stickerSheet";
import { RemoteSvg } from "../render/RemoteSvg";

type GalleryViewProps = {
    remotes: RemoteTemplate[];
    savedDesigns: SavedDesign[];
    buildStateFromExample: (params: { remoteId: RemoteTemplate["id"]; example: ExampleEntry }) => DesignState;
    onOpenPreview: (params: { state: DesignState }) => void;
    onOpenSaved: (design: SavedDesign) => void;
    showWatermark: boolean;
    watermarkText: string;
    watermarkOpacity: number;
    iconLoadStatus?: string | null;
};

type GalleryEntry = {
    id: string;
    kind: "preview" | "saved";
    remoteId: string;
    remoteName: string;
    title: string;
    description?: string;
    state: DesignState;
    template: RemoteTemplate;
    updatedAt: number;
    saved?: SavedDesign;
    userExample?: boolean;
    allowGallery?: boolean;
};

const GalleryCard = memo(function GalleryCard({
    entry,
    renderTemplate,
    isSquareRemote,
    showWatermark,
    watermarkText,
    watermarkOpacity,
    onOpenPreview,
    onOpenSaved,
}: {
    entry: GalleryEntry;
    renderTemplate: RemoteTemplate;
    isSquareRemote: boolean;
    showWatermark: boolean;
    watermarkText: string;
    watermarkOpacity: number;
    onOpenPreview: (params: { state: DesignState }) => void;
    onOpenSaved: (design: SavedDesign) => void;
}) {
    const handleOpen = () => {
        if (entry.kind === "saved") {
            onOpenSaved(entry.saved!);
        } else {
            onOpenPreview({ state: entry.state });
        }
    };

    return (
        <button
            type="button"
            className={`galleryCard${isSquareRemote ? " galleryCard--square" : ""}`}
            data-remote-id={entry.remoteId}
            data-entry-kind={entry.kind}
            data-user-example={entry.userExample ? "true" : "false"}
            data-allow-gallery={entry.allowGallery ? "true" : "false"}
            onClick={handleOpen}
        >
            <div className="galleryCard__media">
                <div className="galleryThumb">
                    <RemoteSvg
                        template={renderTemplate}
                        state={entry.state}
                        background="remote"
                        showWatermark={showWatermark}
                        watermarkText={watermarkText}
                        watermarkOpacity={watermarkOpacity}
                        showMissingIconPlaceholder
                        overrides={{
                            showScaleBar: false,
                            showGuides: false,
                            showRemoteOutline: true,
                            showButtonOutlines: true,
                        }}
                    />
                </div>
            </div>

            <div className="galleryCard__meta">
                <div className="galleryCard__title">{entry.title}</div>
                <div className="galleryCard__model">{entry.remoteName}</div>
                {entry.kind === "saved" ? <div className="galleryCard__tag">Saved</div> : null}
                {entry.userExample ? <div className="galleryCard__tag">User example</div> : null}
                {entry.description ? <div className="galleryCard__desc">{entry.description}</div> : null}
            </div>
        </button>
    );
}, (prev, next) => {
    return (
        prev.entry.id === next.entry.id &&
        prev.entry.updatedAt === next.entry.updatedAt &&
        prev.entry.title === next.entry.title &&
        prev.entry.description === next.entry.description &&
        prev.entry.remoteId === next.entry.remoteId &&
        prev.entry.remoteName === next.entry.remoteName &&
        prev.entry.kind === next.entry.kind &&
        prev.entry.state === next.entry.state &&
        prev.renderTemplate === next.renderTemplate &&
        prev.isSquareRemote === next.isSquareRemote &&
        prev.showWatermark === next.showWatermark &&
        prev.watermarkText === next.watermarkText &&
        prev.watermarkOpacity === next.watermarkOpacity
    );
});

GalleryCard.displayName = "GalleryCard";

export function GalleryView(props: GalleryViewProps) {
    const { remotes, savedDesigns, buildStateFromExample, onOpenPreview, onOpenSaved, showWatermark, watermarkText, watermarkOpacity, iconLoadStatus } = props;
    const [selectedRemoteId, setSelectedRemoteId] = useState<string>("all");
    const [sourceFilter, setSourceFilter] = useState<"all" | "preview" | "saved">("all");
    const [exampleFilter, setExampleFilter] = useState<"all" | "official" | "user">("all");
    const [sortKey, setSortKey] = useState<"recent" | "type" | "name" | "source">("name");
    const [visibleCount, setVisibleCount] = useState(12);
    const sentinelRef = useRef<HTMLDivElement | null>(null);

    const remoteById = useMemo(() => new Map(remotes.map((r) => [r.id, r])), [remotes]);
    const remoteOptions = useMemo(() => remotes.map((r) => ({ id: r.id, name: r.name })), [remotes]);

    const getRenderTemplate = (base: RemoteTemplate, state: DesignState): RemoteTemplate => {
        if (!base.isStickerSheet) return base;
        const o = state.options;
        const sheetSizeMm = o.sheetSize === "Letter" ? LETTER_SIZE_MM : A4_SIZE_MM;
        const layout = getStickerSheetLayout({
            labelWidthMm: o.labelWidthMm,
            labelHeightMm: o.labelHeightMm,
            count: o.labelCount,
            sheetWidthMm: sheetSizeMm.width,
            sheetHeightMm: sheetSizeMm.height,
            marginXMm: o.sheetMarginXMm,
            marginYMm: o.sheetMarginYMm,
            gapMm: o.sheetGapMm,
        });

        if (!layout || layout.maxCount <= 0) return base;

        const remaining = Math.max(0, o.labelCount);
        const count = Math.min(layout.maxCount, remaining);
        const positions = layout.positions.slice(0, count);

        const buttons = positions.map((pos, index) => ({
            id: `label_${index + 1}`,
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
    };

    const previewEntries: GalleryEntry[] = remotes.flatMap((r) => {
        const exs = r.examples ?? [];
        return exs.flatMap((ex, index) => {
            if (isUserExample(ex)) {
                const meta = ex.meta;
                if (!meta || !meta.allowGallery) return [];
                const state = buildStateFromExample({ remoteId: r.id, example: ex });
                const title = meta.savedName?.trim() || "User example";
                const description = meta.description ?? "Shared by a user";
                const userId = meta.id ?? `user_${meta.exportedAt ?? index}`;
                return [
                    {
                        id: `${r.id}__${userId}`,
                        kind: "preview" as const,
                        remoteId: r.id,
                        remoteName: r.name,
                        title,
                        description,
                        state,
                        template: r,
                        updatedAt: 0,
                        userExample: true,
                        allowGallery: meta.allowGallery,
                    },
                ];
            }
            return [
                {
                    id: `${r.id}__${ex.id}`,
                    kind: "preview" as const,
                    remoteId: r.id,
                    remoteName: r.name,
                    title: ex.name,
                    description: ex.description,
                    state: buildStateFromExample({ remoteId: r.id, example: ex }),
                    template: r,
                    updatedAt: 0,
                },
            ];
        });
    });

    const savedEntries: GalleryEntry[] = savedDesigns.flatMap((design) => {
        const remote = remoteById.get(design.state.remoteId);
        if (!remote) return [];
        return [
            {
                id: design.id,
                kind: "saved" as const,
                remoteId: design.state.remoteId,
                remoteName: remote.name,
                title: design.name,
                description: `Saved ${new Date(design.updatedAt).toLocaleDateString()}`,
                state: design.state,
                template: remote,
                saved: design,
                updatedAt: design.updatedAt,
            },
        ];
    });

    const allEntries = [...savedEntries, ...previewEntries];
    const filteredEntries = allEntries
        .filter((entry) => {
            if (sourceFilter !== "all" && entry.kind !== sourceFilter) return false;
            if (selectedRemoteId !== "all" && entry.remoteId !== selectedRemoteId) return false;
            if (exampleFilter === "user" && !entry.userExample) return false;
            if (exampleFilter === "official" && (entry.userExample || entry.kind !== "preview")) return false;
            return true;
        })
        .sort((a, b) => {
            if (sortKey === "recent") {
                if (a.updatedAt !== b.updatedAt) return b.updatedAt - a.updatedAt;
                return a.title.localeCompare(b.title);
            }
            if (sortKey === "type") {
                const byType = a.remoteName.localeCompare(b.remoteName);
                if (byType !== 0) return byType;
                if (a.kind !== b.kind) return a.kind.localeCompare(b.kind);
                return a.title.localeCompare(b.title);
            }
            if (sortKey === "source") {
                if (a.kind !== b.kind) return a.kind.localeCompare(b.kind);
                const byType = a.remoteName.localeCompare(b.remoteName);
                if (byType !== 0) return byType;
                return a.title.localeCompare(b.title);
            }
            return a.title.localeCompare(b.title);
        });

    const emptyMessage =
        allEntries.length === 0
            ? "No gallery entries yet."
            : "No entries match the selected filters.";

    const safeVisibleCount = Math.min(visibleCount, filteredEntries.length);

    useEffect(() => {
        if (!sentinelRef.current) return;
        const sentinel = sentinelRef.current;
        const observer = new IntersectionObserver(
            (entries) => {
                if (!entries.some((entry) => entry.isIntersecting)) return;
                setVisibleCount((prev) => Math.min(filteredEntries.length, prev + 12));
            },
            { root: null, rootMargin: "600px 0px", threshold: 0 },
        );
        observer.observe(sentinel);
        return () => observer.disconnect();
    }, [filteredEntries.length]);

    return (
        <section className="gallery" aria-label="Gallery">
            <header className="gallery__header">
                <h2 className="gallery__title">Gallery</h2>
                <p className="gallery__subtitle">Browse preview presets and your saved remotes. Click any card to open it in the editor.</p>
                {iconLoadStatus ? (
                    <p className="gallery__status" role="status" aria-live="polite">
                        <span className="statusSpinner" aria-hidden="true" />
                        {iconLoadStatus}
                    </p>
                ) : null}
                <div className="galleryFiltersBlock">
                    <div className="galleryFilters__title">Filters</div>
                    <div className="galleryFilters" role="group" aria-label="Gallery filters">
                        <label className="galleryFilters__control">
                            Remote type
                            <select
                                value={selectedRemoteId}
                                onChange={(e) => {
                                    setSelectedRemoteId(e.target.value);
                                    setVisibleCount(12);
                                }}
                            >
                                <option value="all">All types</option>
                                {remoteOptions.map((option) => (
                                    <option key={option.id} value={option.id}>
                                        {option.name}
                                    </option>
                                ))}
                            </select>
                        </label>
                        <label className="galleryFilters__control">
                            Source
                            <select
                                value={sourceFilter}
                                onChange={(e) => {
                                    setSourceFilter(e.target.value as "all" | "preview" | "saved");
                                    setVisibleCount(12);
                                }}
                            >
                                <option value="all">All sources</option>
                                <option value="preview">Preview presets</option>
                                <option value="saved">My saved remotes</option>
                            </select>
                        </label>
                        <label className="galleryFilters__control">
                            Examples
                            <select
                                value={exampleFilter}
                                onChange={(e) => {
                                    setExampleFilter(e.target.value as "all" | "official" | "user");
                                    setVisibleCount(12);
                                }}
                            >
                                <option value="all">All examples</option>
                                <option value="official">Official examples</option>
                                <option value="user">User examples</option>
                            </select>
                        </label>
                        <label className="galleryFilters__control">
                            Sort
                            <select
                                value={sortKey}
                                onChange={(e) => {
                                    setSortKey(e.target.value as "recent" | "type" | "name" | "source");
                                    setVisibleCount(12);
                                }}
                            >
                                <option value="recent">Recently saved</option>
                                <option value="type">Remote type</option>
                                <option value="source">Source</option>
                                <option value="name">Name</option>
                            </select>
                        </label>
                        <button
                            type="button"
                            className="galleryFilters__reset"
                            onClick={() => {
                                setSelectedRemoteId("all");
                                setSourceFilter("all");
                                setExampleFilter("all");
                                setSortKey("name");
                                setVisibleCount(12);
                            }}
                        >
                            Clear filters
                        </button>
                        <div className="galleryFilters__summary">
                            Showing {safeVisibleCount} of {filteredEntries.length}
                        </div>
                    </div>
                </div>
            </header>

            <div className="galleryGrid">
                {filteredEntries.length ? (
                    filteredEntries.slice(0, safeVisibleCount).map((entry) => {
                        const renderTemplate = getRenderTemplate(entry.template, entry.state);
                        const isSquareRemote = Math.abs(renderTemplate.widthMm - renderTemplate.heightMm) / Math.max(renderTemplate.widthMm, renderTemplate.heightMm) <= 0.12;

                        return (
                            <GalleryCard
                                key={entry.id}
                                entry={entry}
                                renderTemplate={renderTemplate}
                                isSquareRemote={isSquareRemote}
                                showWatermark={showWatermark}
                                watermarkText={watermarkText}
                                watermarkOpacity={watermarkOpacity}
                                onOpenPreview={onOpenPreview}
                                onOpenSaved={onOpenSaved}
                            />
                        );
                    })
                ) : (
                    <div className="galleryEmpty">{emptyMessage}</div>
                )}
            </div>
            {filteredEntries.length > safeVisibleCount ? <div ref={sentinelRef} className="gallerySentinel" aria-hidden="true" /> : null}
        </section>
    );
}
