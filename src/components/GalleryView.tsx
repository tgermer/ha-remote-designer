import { useMemo, useState } from "react";
import type { DesignState } from "../app/types";
import type { RemoteExample, RemoteTemplate } from "../app/remotes";
import type { SavedDesign } from "../app/savedDesigns";
import { A4_SIZE_MM, LETTER_SIZE_MM, getStickerSheetLayout } from "../app/stickerSheet";
import { RemoteSvg } from "../render/RemoteSvg";

type GalleryViewProps = {
    remotes: RemoteTemplate[];
    savedDesigns: SavedDesign[];
    buildStateFromExample: (params: { remoteId: RemoteTemplate["id"]; example: RemoteExample }) => DesignState;
    onOpenPreview: (params: { state: DesignState }) => void;
    onOpenSaved: (design: SavedDesign) => void;
    showWatermark: boolean;
    watermarkText: string;
    watermarkOpacity: number;
    iconLoadStatus?: string | null;
};

export function GalleryView(props: GalleryViewProps) {
    const { remotes, savedDesigns, buildStateFromExample, onOpenPreview, onOpenSaved, showWatermark, watermarkText, watermarkOpacity, iconLoadStatus } = props;
    const [selectedRemoteId, setSelectedRemoteId] = useState<string>("all");
    const [sourceFilter, setSourceFilter] = useState<"all" | "preview" | "saved">("all");
    const [sortKey, setSortKey] = useState<"recent" | "type" | "name" | "source">("name");

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

    const previewEntries = remotes.flatMap((r) => {
        const exs = r.examples ?? [];
        return exs.map((ex) => {
            const state = buildStateFromExample({ remoteId: r.id, example: ex });
            return {
                id: `${r.id}__${ex.id}`,
                kind: "preview" as const,
                remoteId: r.id,
                remoteName: r.name,
                title: ex.name,
                description: ex.description,
                state,
                template: r,
                updatedAt: 0,
            };
        });
    });

    const savedEntries = savedDesigns.flatMap((design) => {
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
                            <select value={selectedRemoteId} onChange={(e) => setSelectedRemoteId(e.target.value)}>
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
                            <select value={sourceFilter} onChange={(e) => setSourceFilter(e.target.value as "all" | "preview" | "saved")}>
                                <option value="all">All sources</option>
                                <option value="preview">Preview presets</option>
                                <option value="saved">My saved remotes</option>
                            </select>
                        </label>
                        <label className="galleryFilters__control">
                            Sort
                            <select value={sortKey} onChange={(e) => setSortKey(e.target.value as "recent" | "type" | "name" | "source")}>
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
                                setSortKey("name");
                            }}
                        >
                            Clear filters
                        </button>
                        <div className="galleryFilters__summary">
                            Showing {filteredEntries.length} of {allEntries.length}
                        </div>
                    </div>
                </div>
            </header>

            <div className="galleryGrid">
                {filteredEntries.length ? (
                    filteredEntries.map((entry) => {
                        const renderTemplate = getRenderTemplate(entry.template, entry.state);
                        const isSquareRemote = Math.abs(renderTemplate.widthMm - renderTemplate.heightMm) / Math.max(renderTemplate.widthMm, renderTemplate.heightMm) <= 0.12;
                        const handleOpen = () => {
                            if (entry.kind === "saved") {
                                onOpenSaved(entry.saved);
                            } else {
                                onOpenPreview({ state: entry.state });
                            }
                        };

                        return (
                            <button
                                key={entry.id}
                                type="button"
                                className={`galleryCard${isSquareRemote ? " galleryCard--square" : ""}`}
                                data-remote-id={entry.remoteId}
                                data-entry-kind={entry.kind}
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
                                    {entry.description ? <div className="galleryCard__desc">{entry.description}</div> : null}
                                </div>
                            </button>
                        );
                    })
                ) : (
                    <div className="galleryEmpty">{emptyMessage}</div>
                )}
            </div>
        </section>
    );
}
