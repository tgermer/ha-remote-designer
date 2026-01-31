import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { ButtonDef, CornerRadiiMm, CutoutElement, RemoteTemplate } from "../app/remotes";
import type { DesignState } from "../app/types";
import { PreviewPane } from "./PreviewPane";
import { UiIcon } from "./UiIcon";

type CommunityDraft = {
    id?: string;
    name: string;
    widthMm: number;
    heightMm: number;
    cornerMm: number;
    manufacturerUrl: string;
    imageUrl: string;
    notes: string;
    tags: string[];
    buttons: (ButtonDef & { r?: CornerRadiiMm })[];
    cutouts: CutoutElement[];
};

type CommunityRemotePageProps = {
    draft: CommunityDraft;
    template: RemoteTemplate;
    previewState: DesignState;
    showWatermark: boolean;
    watermarkText: string;
    watermarkOpacity: number;
    onChangeDraft: (patch: Partial<CommunityDraft>) => void;
    onUpdateButton: (index: number, patch: Partial<ButtonDef & { r?: CornerRadiiMm }>) => void;
    onAddButton: () => void;
    onRemoveButton: (index: number) => void;
    onUpdateCutout: (index: number, next: CutoutElement) => void;
    onAddCutoutRect: () => void;
    onAddCutoutCircle: () => void;
    onRemoveCutout: (index: number) => void;
    onUseInConfigurator: () => void;
    onCopyJson: () => void;
    onDownloadJson: () => void;
    onSendToDeveloper: () => void;
    copyStatus?: "idle" | "copied" | "failed";
    drafts: { id: string; name: string; updatedAt: number }[];
    selectedDraftId: string;
    hasUnsavedChanges: boolean;
    onSelectDraft: (id: string) => void;
    onSaveDraft: () => void;
    onDeleteDraft: () => void;
    onNewDraft: () => void;
};

type TableColumn = {
    key: string;
    label: string;
};

const BUTTON_COLUMNS: TableColumn[] = [
    { key: "id", label: "ID" },
    { key: "x", label: "X (mm)" },
    { key: "y", label: "Y (mm)" },
    { key: "w", label: "W (mm)" },
    { key: "h", label: "H (mm)" },
    { key: "r", label: "R (Default, mm)" },
    { key: "tl", label: "TL (Override)" },
    { key: "tr", label: "TR (Override)" },
    { key: "br", label: "BR (Override)" },
    { key: "bl", label: "BL (Override)" },
    { key: "actions", label: "" },
];

const CUTOUT_COLUMNS: TableColumn[] = [
    { key: "type", label: "Type" },
    { key: "x", label: "X" },
    { key: "y", label: "Y" },
    { key: "w", label: "W" },
    { key: "h", label: "H" },
    { key: "r", label: "R (Default)" },
    { key: "tl", label: "TL (Override)" },
    { key: "tr", label: "TR (Override)" },
    { key: "br", label: "BR (Override)" },
    { key: "bl", label: "BL (Override)" },
    { key: "actions", label: "" },
];

function TableCell({ label, children }: { label: string; children: React.ReactNode }) {
    return (
        <div className="communityTable__cell" data-label={label}>
            {children}
        </div>
    );
}

function TableHeaderRow({ className, columns }: { className: string; columns: TableColumn[] }) {
    return <div className={`${className} ${className}--head`}>{columns.map((col) => (col.key === "actions" ? <span key={col.key} className="communityTable__empty" /> : <span key={col.key}>{col.label}</span>))}</div>;
}

export function CommunityRemotePage(props: CommunityRemotePageProps) {
    const { draft, template, previewState, showWatermark, watermarkText, watermarkOpacity, onChangeDraft, onUpdateButton, onAddButton, onRemoveButton, onUpdateCutout, onAddCutoutRect, onAddCutoutCircle, onRemoveCutout, onUseInConfigurator, onCopyJson, onDownloadJson, onSendToDeveloper, copyStatus = "idle", drafts, selectedDraftId, hasUnsavedChanges, onSelectDraft, onSaveDraft, onDeleteDraft, onNewDraft } = props;
    const previewRef = useRef<HTMLDivElement | null>(null);
    const dragRef = useRef<{ kind: "move-button"; buttonId: string; offsetX: number; offsetY: number } | { kind: "resize-button"; buttonId: string; handle: "e" | "s" | "se"; startX: number; startY: number; startW: number; startH: number } | { kind: "move-cutout"; index: number; offsetX: number; offsetY: number } | { kind: "resize-cutout-rect"; index: number; handle: "e" | "s" | "se"; startX: number; startY: number; startW: number; startH: number } | { kind: "resize-cutout-circle"; index: number; startCx: number; startCy: number } | null>(null);
    const [selectedButtonId, setSelectedButtonId] = useState<string>(draft.buttons[0]?.id ?? "");
    const [selectedCutoutIndex, setSelectedCutoutIndex] = useState<number | null>(null);
    const selectedButtonIndex = useMemo(() => draft.buttons.findIndex((button) => button.id === selectedButtonId), [draft.buttons, selectedButtonId]);

    useEffect(() => {
        if (selectedButtonId && draft.buttons.some((button) => button.id === selectedButtonId)) return;
        const nextId = selectedCutoutIndex !== null ? "" : draft.buttons[0]?.id ?? "";
        const handle = window.requestAnimationFrame(() => {
            setSelectedButtonId(nextId);
        });
        return () => {
            window.cancelAnimationFrame(handle);
        };
    }, [draft.buttons, selectedButtonId, selectedCutoutIndex]);

    const clientToMm = useCallback(
        (event: { clientX: number; clientY: number }) => {
            const svg = previewRef.current?.querySelector("svg");
            if (!svg) return null;
            const ctm = svg.getScreenCTM();
            if (ctm && typeof DOMPoint !== "undefined") {
                const point = new DOMPoint(event.clientX, event.clientY).matrixTransform(ctm.inverse());
                return { x: point.x, y: point.y };
            }
            const rect = svg.getBoundingClientRect();
            if (!rect.width || !rect.height) return null;
            return {
                x: ((event.clientX - rect.left) / rect.width) * template.widthMm,
                y: ((event.clientY - rect.top) / rect.height) * template.heightMm,
            };
        },
        [template.widthMm, template.heightMm],
    );

    const getRectHandle = (x: number, y: number, rect: { x: number; y: number; w: number; h: number }) => {
        const tol = 3.5;
        const inX = x >= rect.x - tol && x <= rect.x + rect.w + tol;
        const inY = y >= rect.y - tol && y <= rect.y + rect.h + tol;
        if (!inX || !inY) return null;
        const nearRight = Math.abs(x - (rect.x + rect.w)) <= tol;
        const nearBottom = Math.abs(y - (rect.y + rect.h)) <= tol;
        if (nearRight && nearBottom) return "se";
        if (nearRight) return "e";
        if (nearBottom) return "s";
        return null;
    };

    const getCircleHandle = (x: number, y: number, circle: { cx: number; cy: number; r: number }) => {
        const tol = 3.5;
        const hx = circle.cx + circle.r;
        const hy = circle.cy;
        const dist = Math.hypot(x - hx, y - hy);
        return dist <= tol ? "r" : null;
    };

    useEffect(() => {
        const onMove = (event: PointerEvent) => {
            const dragState = dragRef.current;
            if (!dragState) return;
            const coords = clientToMm(event);
            if (!coords) return;
            const { x, y } = coords;
            if (dragState.kind === "move-button") {
                const buttonId = dragState.buttonId;
                const idx = draft.buttons.findIndex((button) => button.id === buttonId);
                if (idx < 0) return;
                const button = draft.buttons[idx];
                const nextX = Math.max(0, Math.min(template.widthMm - button.wMm, x - dragState.offsetX));
                const nextY = Math.max(0, Math.min(template.heightMm - button.hMm, y - dragState.offsetY));
                onUpdateButton(idx, { xMm: Number(nextX.toFixed(2)), yMm: Number(nextY.toFixed(2)) });
                return;
            }
            if (dragState.kind === "resize-button") {
                const buttonId = dragState.buttonId;
                const idx = draft.buttons.findIndex((button) => button.id === buttonId);
                if (idx < 0) return;
                const maxW = template.widthMm - dragState.startX;
                const maxH = template.heightMm - dragState.startY;
                const nextW = dragState.handle === "e" || dragState.handle === "se" ? Math.max(2, Math.min(maxW, x - dragState.startX)) : dragState.startW;
                const nextH = dragState.handle === "s" || dragState.handle === "se" ? Math.max(2, Math.min(maxH, y - dragState.startY)) : dragState.startH;
                onUpdateButton(idx, { wMm: Number(nextW.toFixed(2)), hMm: Number(nextH.toFixed(2)) });
                return;
            }
            if (dragState.kind === "move-cutout") {
                const cutout = draft.cutouts[dragState.index];
                if (!cutout) return;
                if (cutout.kind === "circle") {
                    const nextCx = Math.max(0, Math.min(template.widthMm, x - dragState.offsetX));
                    const nextCy = Math.max(0, Math.min(template.heightMm, y - dragState.offsetY));
                    onUpdateCutout(dragState.index, { ...cutout, cxMm: Number(nextCx.toFixed(2)), cyMm: Number(nextCy.toFixed(2)) });
                    return;
                }
                const nextX = Math.max(0, Math.min(template.widthMm - cutout.wMm, x - dragState.offsetX));
                const nextY = Math.max(0, Math.min(template.heightMm - cutout.hMm, y - dragState.offsetY));
                onUpdateCutout(dragState.index, { ...cutout, xMm: Number(nextX.toFixed(2)), yMm: Number(nextY.toFixed(2)) });
                return;
            }
            if (dragState.kind === "resize-cutout-rect") {
                const cutout = draft.cutouts[dragState.index];
                if (!cutout || cutout.kind !== "rect") return;
                const maxW = template.widthMm - dragState.startX;
                const maxH = template.heightMm - dragState.startY;
                const nextW = dragState.handle === "e" || dragState.handle === "se" ? Math.max(1, Math.min(maxW, x - dragState.startX)) : dragState.startW;
                const nextH = dragState.handle === "s" || dragState.handle === "se" ? Math.max(1, Math.min(maxH, y - dragState.startY)) : dragState.startH;
                onUpdateCutout(dragState.index, { ...cutout, wMm: Number(nextW.toFixed(2)), hMm: Number(nextH.toFixed(2)) });
                return;
            }
            if (dragState.kind === "resize-cutout-circle") {
                const cutout = draft.cutouts[dragState.index];
                if (!cutout || cutout.kind !== "circle") return;
                const dx = x - dragState.startCx;
                const dy = y - dragState.startCy;
                const rawR = Math.hypot(dx, dy);
                const maxR = Math.min(dragState.startCx, dragState.startCy, template.widthMm - dragState.startCx, template.heightMm - dragState.startCy);
                const nextR = Math.max(1, Math.min(maxR, rawR));
                onUpdateCutout(dragState.index, { ...cutout, rMm: Number(nextR.toFixed(2)) });
            }
        };
        const onUp = (event: PointerEvent) => {
            dragRef.current = null;
            if (previewRef.current?.hasPointerCapture(event.pointerId)) {
                previewRef.current.releasePointerCapture(event.pointerId);
            }
        };
        window.addEventListener("pointermove", onMove);
        window.addEventListener("pointerup", onUp);
        window.addEventListener("pointercancel", onUp);
        return () => {
            window.removeEventListener("pointermove", onMove);
            window.removeEventListener("pointerup", onUp);
            window.removeEventListener("pointercancel", onUp);
        };
    }, [draft.buttons, draft.cutouts, onUpdateButton, onUpdateCutout, template.heightMm, template.widthMm, clientToMm]);

    const handlePreviewPointerDown = (event: React.PointerEvent<HTMLDivElement>) => {
        if (event.button !== 0) return;
        const coords = clientToMm(event);
        if (!coords) return;
        const { x, y } = coords;
        const target = event.target as SVGElement;
        const dataset = (target as SVGElement).dataset ?? {};
        if (dataset.buttonId && dataset.resize) {
            const button = draft.buttons.find((item) => item.id === dataset.buttonId);
            if (!button) return;
            setSelectedButtonId(button.id);
            setSelectedCutoutIndex(null);
            dragRef.current = {
                kind: "resize-button",
                buttonId: button.id,
                handle: dataset.resize as "e" | "s" | "se",
                startX: button.xMm,
                startY: button.yMm,
                startW: button.wMm,
                startH: button.hMm,
            };
            event.currentTarget.setPointerCapture(event.pointerId);
            event.preventDefault();
            return;
        }
        if (dataset.cutoutIndex && dataset.resize) {
            const index = Number(dataset.cutoutIndex);
            const cutout = draft.cutouts[index];
            if (!cutout) return;
            setSelectedCutoutIndex(index);
            setSelectedButtonId("");
            if (dataset.cutoutKind === "circle" || cutout.kind === "circle" || dataset.resize === "r") {
                dragRef.current = {
                    kind: "resize-cutout-circle",
                    index,
                    startCx: cutout.kind === "circle" ? cutout.cxMm : x,
                    startCy: cutout.kind === "circle" ? cutout.cyMm : y,
                };
            } else {
                dragRef.current = {
                    kind: "resize-cutout-rect",
                    index,
                    handle: dataset.resize as "e" | "s" | "se",
                    startX: cutout.kind === "rect" ? cutout.xMm : x,
                    startY: cutout.kind === "rect" ? cutout.yMm : y,
                    startW: cutout.kind === "rect" ? cutout.wMm : 10,
                    startH: cutout.kind === "rect" ? cutout.hMm : 10,
                };
            }
            event.currentTarget.setPointerCapture(event.pointerId);
            event.preventDefault();
            return;
        }
        if (dataset.buttonId) {
            const button = draft.buttons.find((item) => item.id === dataset.buttonId);
            if (!button) return;
            setSelectedButtonId(button.id);
            setSelectedCutoutIndex(null);
            dragRef.current = {
                kind: "move-button",
                buttonId: button.id,
                offsetX: x - button.xMm,
                offsetY: y - button.yMm,
            };
            event.currentTarget.setPointerCapture(event.pointerId);
            event.preventDefault();
            return;
        }
        if (dataset.cutoutIndex) {
            const index = Number(dataset.cutoutIndex);
            const cutout = draft.cutouts[index];
            if (!cutout) return;
            setSelectedCutoutIndex(index);
            setSelectedButtonId("");
            if (cutout.kind === "circle") {
                dragRef.current = {
                    kind: "move-cutout",
                    index,
                    offsetX: x - cutout.cxMm,
                    offsetY: y - cutout.cyMm,
                };
            } else {
                dragRef.current = {
                    kind: "move-cutout",
                    index,
                    offsetX: x - cutout.xMm,
                    offsetY: y - cutout.yMm,
                };
            }
            event.currentTarget.setPointerCapture(event.pointerId);
            event.preventDefault();
            return;
        }
        if (dataset.buttonId && dataset.resize) {
            const button = draft.buttons.find((item) => item.id === dataset.buttonId);
            if (!button) return;
            setSelectedButtonId(button.id);
            setSelectedCutoutIndex(null);
            dragRef.current = {
                kind: "resize-button",
                buttonId: button.id,
                handle: dataset.resize as "e" | "s" | "se",
                startX: button.xMm,
                startY: button.yMm,
                startW: button.wMm,
                startH: button.hMm,
            };
            event.currentTarget.setPointerCapture(event.pointerId);
            event.preventDefault();
            return;
        }
        const hitIndex = draft.buttons.findIndex((button) => x >= button.xMm && x <= button.xMm + button.wMm && y >= button.yMm && y <= button.yMm + button.hMm);
        if (hitIndex >= 0) {
            const button = draft.buttons[hitIndex];
            setSelectedButtonId(button.id);
            setSelectedCutoutIndex(null);
            dragRef.current = {
                kind: "move-button",
                buttonId: button.id,
                offsetX: x - button.xMm,
                offsetY: y - button.yMm,
            };
            event.currentTarget.setPointerCapture(event.pointerId);
            event.preventDefault();
            return;
        }
        const cutoutHandleIndex = draft.cutouts.findIndex((cutout) => {
            if (cutout.kind === "circle") {
                return getCircleHandle(x, y, { cx: cutout.cxMm, cy: cutout.cyMm, r: cutout.rMm }) !== null;
            }
            return getRectHandle(x, y, { x: cutout.xMm, y: cutout.yMm, w: cutout.wMm, h: cutout.hMm }) !== null;
        });
        if (cutoutHandleIndex >= 0) {
            const cutout = draft.cutouts[cutoutHandleIndex];
            setSelectedCutoutIndex(cutoutHandleIndex);
            setSelectedButtonId("");
            if (cutout.kind === "circle") {
                dragRef.current = {
                    kind: "resize-cutout-circle",
                    index: cutoutHandleIndex,
                    startCx: cutout.cxMm,
                    startCy: cutout.cyMm,
                };
            } else {
                const handle = getRectHandle(x, y, { x: cutout.xMm, y: cutout.yMm, w: cutout.wMm, h: cutout.hMm }) ?? "se";
                dragRef.current = {
                    kind: "resize-cutout-rect",
                    index: cutoutHandleIndex,
                    handle,
                    startX: cutout.xMm,
                    startY: cutout.yMm,
                    startW: cutout.wMm,
                    startH: cutout.hMm,
                };
            }
            event.currentTarget.setPointerCapture(event.pointerId);
            event.preventDefault();
            return;
        }
        const cutoutIndex = draft.cutouts.findIndex((cutout) => {
            if (cutout.kind === "circle") {
                const dx = x - cutout.cxMm;
                const dy = y - cutout.cyMm;
                return Math.sqrt(dx * dx + dy * dy) <= cutout.rMm;
            }
            return x >= cutout.xMm && x <= cutout.xMm + cutout.wMm && y >= cutout.yMm && y <= cutout.yMm + cutout.hMm;
        });
        if (cutoutIndex >= 0) {
            const cutout = draft.cutouts[cutoutIndex];
            setSelectedCutoutIndex(cutoutIndex);
            setSelectedButtonId("");
            if (cutout.kind === "circle") {
                dragRef.current = {
                    kind: "move-cutout",
                    index: cutoutIndex,
                    offsetX: x - cutout.cxMm,
                    offsetY: y - cutout.cyMm,
                };
            } else {
                dragRef.current = {
                    kind: "move-cutout",
                    index: cutoutIndex,
                    offsetX: x - cutout.xMm,
                    offsetY: y - cutout.yMm,
                };
            }
            event.currentTarget.setPointerCapture(event.pointerId);
            event.preventDefault();
            return;
        }
    };

    const nudgeSelected = useCallback(
        (dx: number, dy: number) => {
            if (selectedButtonIndex >= 0 && selectedCutoutIndex === null) {
                const button = draft.buttons[selectedButtonIndex];
                const nextX = Math.max(0, Math.min(template.widthMm - button.wMm, button.xMm + dx));
                const nextY = Math.max(0, Math.min(template.heightMm - button.hMm, button.yMm + dy));
                onUpdateButton(selectedButtonIndex, { xMm: Number(nextX.toFixed(2)), yMm: Number(nextY.toFixed(2)) });
                return;
            }
            if (selectedCutoutIndex !== null && selectedCutoutIndex >= 0) {
                const cutout = draft.cutouts[selectedCutoutIndex];
                if (!cutout) return;
                if (cutout.kind === "circle") {
                    const nextCx = Math.max(0, Math.min(template.widthMm, cutout.cxMm + dx));
                    const nextCy = Math.max(0, Math.min(template.heightMm, cutout.cyMm + dy));
                    onUpdateCutout(selectedCutoutIndex, { ...cutout, cxMm: Number(nextCx.toFixed(2)), cyMm: Number(nextCy.toFixed(2)) });
                    return;
                }
                const nextX = Math.max(0, Math.min(template.widthMm - cutout.wMm, cutout.xMm + dx));
                const nextY = Math.max(0, Math.min(template.heightMm - cutout.hMm, cutout.yMm + dy));
                onUpdateCutout(selectedCutoutIndex, { ...cutout, xMm: Number(nextX.toFixed(2)), yMm: Number(nextY.toFixed(2)) });
            }
        },
        [selectedButtonIndex, selectedCutoutIndex, draft.buttons, draft.cutouts, template.widthMm, template.heightMm, onUpdateButton, onUpdateCutout],
    );

    useEffect(() => {
        const onKeyDown = (event: KeyboardEvent) => {
            const target = event.target as HTMLElement | null;
            const tag = target?.tagName?.toLowerCase();
            if (tag === "input" || tag === "textarea" || tag === "select" || target?.isContentEditable) return;
            if (selectedButtonIndex < 0 && selectedCutoutIndex === null) return;
            if (event.key === "ArrowUp") {
                event.preventDefault();
                nudgeSelected(0, -1);
            } else if (event.key === "ArrowDown") {
                event.preventDefault();
                nudgeSelected(0, 1);
            } else if (event.key === "ArrowLeft") {
                event.preventDefault();
                nudgeSelected(-1, 0);
            } else if (event.key === "ArrowRight") {
                event.preventDefault();
                nudgeSelected(1, 0);
            }
        };
        window.addEventListener("keydown", onKeyDown);
        return () => window.removeEventListener("keydown", onKeyDown);
    }, [nudgeSelected, selectedButtonIndex, selectedCutoutIndex]);

    return (
        <section className="page" aria-label="Community remote builder">
            <header className="page__hero">
                <p className="page__kicker">Community remote model</p>
                <h2 className="page__title">Create a remote that is not in the catalog.</h2>
                <p className="page__lead">Measure your remote, define the button layout, test the design in the configurator, then share the JSON so it can be added to the catalog.</p>
                <div className="page__cta">
                    <button type="button" className="btn btn--primary" onClick={onUseInConfigurator}>
                        <UiIcon name="mdi:hammer-wrench" className="icon" />
                        Test in configurator
                    </button>
                    <button type="button" className="btn" onClick={onSendToDeveloper}>
                        <UiIcon name="mdi:email-outline" className="icon" />
                        Send to developer
                    </button>
                    <button type="button" className="btn" onClick={onCopyJson}>
                        <UiIcon name="mdi:content-copy" className="icon" />
                        Copy JSON
                    </button>
                    <button type="button" className="btn" onClick={onDownloadJson}>
                        <UiIcon name="mdi:download" className="icon" />
                        Download JSON
                    </button>
                    {copyStatus === "copied" ? <span className="page__note">Copied!</span> : null}
                    {copyStatus === "failed" ? <span className="page__note">Copy failed.</span> : null}
                </div>
            </header>

            <div className="communityGrid">
                <div className="page__card">
                    <div className="communityDraftHeader">
                        <h3>Remote details</h3>
                    </div>
                    <div className="communityDraftHeader__actions">
                        <select value={selectedDraftId} onChange={(e) => onSelectDraft(e.target.value)}>
                            <option value="">Select draft…</option>
                            {drafts.map((entry) => (
                                <option key={entry.id} value={entry.id}>
                                    {entry.name}
                                </option>
                            ))}
                        </select>
                        <button type="button" className="btn" onClick={onSaveDraft} disabled={!hasUnsavedChanges}>
                            <UiIcon name="mdi:content-save-outline" className="icon" />
                            Save draft
                        </button>
                        <button type="button" className="btn" onClick={onNewDraft}>
                            <UiIcon name="mdi:plus" className="icon" />
                            New
                        </button>
                        <button type="button" className="btn btn--danger" onClick={onDeleteDraft} disabled={!selectedDraftId} aria-label="Delete draft">
                            <UiIcon name="mdi:delete-outline" className="icon" />
                        </button>
                    </div>
                    <div className="communityForm">
                        <label className="communityForm__field">
                            Name
                            <input type="text" value={draft.name} onChange={(e) => onChangeDraft({ name: e.target.value })} placeholder="e.g. My Wall Remote" />
                        </label>
                        <label className="communityForm__field">
                            Width (mm)
                            <input type="number" min={1} value={draft.widthMm} onChange={(e) => onChangeDraft({ widthMm: Number(e.target.value) })} />
                        </label>
                        <label className="communityForm__field">
                            Height (mm)
                            <input type="number" min={1} value={draft.heightMm} onChange={(e) => onChangeDraft({ heightMm: Number(e.target.value) })} />
                        </label>
                        <label className="communityForm__field">
                            Corner radius (mm)
                            <input type="number" min={0} value={draft.cornerMm} onChange={(e) => onChangeDraft({ cornerMm: Number(e.target.value) })} />
                        </label>
                        <label className="communityForm__field">
                            Manufacturer URL
                            <input type="url" value={draft.manufacturerUrl} onChange={(e) => onChangeDraft({ manufacturerUrl: e.target.value })} placeholder="https://manufacturer.com" />
                        </label>
                        <label className="communityForm__field">
                            Image URL
                            <input type="url" value={draft.imageUrl} onChange={(e) => onChangeDraft({ imageUrl: e.target.value })} placeholder="https://…" />
                        </label>
                        <label className="communityForm__field communityForm__field--full">
                            Tags (comma-separated)
                            <input
                                type="text"
                                value={draft.tags.join(", ")}
                                onChange={(e) =>
                                    onChangeDraft({
                                        tags: e.target.value
                                            .split(",")
                                            .map((t) => t.trim())
                                            .filter(Boolean),
                                    })
                                }
                            />
                        </label>
                        <label className="communityForm__field communityForm__field--full">
                            Notes (optional)
                            <textarea value={draft.notes} onChange={(e) => onChangeDraft({ notes: e.target.value })} placeholder="Model number, quirks, measurement notes…" />
                        </label>
                    </div>
                </div>

                <div className="page__card communityPreview">
                    <h3>Preview</h3>
                    <div ref={previewRef} onPointerDownCapture={handlePreviewPointerDown}>
                        <PreviewPane template={template} state={previewState} showWatermark={showWatermark} watermarkText={watermarkText} watermarkOpacity={watermarkOpacity} className="preview--community" showMissingIconPlaceholder={false} onSelectButton={setSelectedButtonId} highlightedButtonId={selectedButtonId} highlightedCutoutIndex={selectedCutoutIndex} showResizeHandles />
                    </div>
                    <div className="communityNudge">
                        <div className="communityNudge__title">Button placement</div>
                        <p className="page__note">Drag in the preview or use arrow keys to move the selected item by 1 mm.</p>
                    </div>
                    <p className="page__note">Tip: enable button outlines in the configurator to validate your measurements.</p>
                </div>
            </div>

            <div className="page__grid">
                <article className="page__card">
                    <h3>Measurement guide</h3>
                    <p>All coordinates use the top-left corner of the remote as (0,0). Width and height define the outer dimensions.</p>
                    <p>Button positions use X/Y for the top-left of each button, and W/H for size.</p>
                    <p>Corner radius: R is the default; TL/TR/BR/BL override when set. Empty fields use R.</p>
                    <p className="page__note">Use a ruler or caliper for best accuracy. Start with whole millimeters, then refine.</p>
                </article>
                <article className="page__card">
                    <h3>What are cutouts?</h3>
                    <p>Cutouts mark areas you want to keep empty, such as LED windows, sensors, screws, or switches.</p>
                    <p>They show up as outlines to help you avoid placing labels over those areas.</p>
                </article>
            </div>

            <div className="page__card">
                <div className="communityButtons__header">
                    <h3>Buttons</h3>
                    <button type="button" className="btn" onClick={onAddButton}>
                        <UiIcon name="mdi:plus-circle-outline" className="icon" />
                        Add button
                    </button>
                </div>
                <div className="communityButtons__table">
                    <TableHeaderRow className="communityButtons__row" columns={BUTTON_COLUMNS} />
                    {draft.buttons.map((button, index) => (
                        <div key={`${button.id}-${index}`} className={`communityButtons__row${button.id === selectedButtonId ? " communityButtons__row--selected" : ""}`}>
                            <TableCell label={BUTTON_COLUMNS[0].label}>
                                <input value={button.id} onFocus={() => setSelectedButtonId(button.id)} onChange={(e) => onUpdateButton(index, { id: e.target.value })} />
                            </TableCell>
                            <TableCell label={BUTTON_COLUMNS[1].label}>
                                <input type="number" value={button.xMm} onFocus={() => setSelectedButtonId(button.id)} onChange={(e) => onUpdateButton(index, { xMm: Number(e.target.value) })} />
                            </TableCell>
                            <TableCell label={BUTTON_COLUMNS[2].label}>
                                <input type="number" value={button.yMm} onFocus={() => setSelectedButtonId(button.id)} onChange={(e) => onUpdateButton(index, { yMm: Number(e.target.value) })} />
                            </TableCell>
                            <TableCell label={BUTTON_COLUMNS[3].label}>
                                <input type="number" value={button.wMm} onFocus={() => setSelectedButtonId(button.id)} onChange={(e) => onUpdateButton(index, { wMm: Number(e.target.value) })} />
                            </TableCell>
                            <TableCell label={BUTTON_COLUMNS[4].label}>
                                <input type="number" value={button.hMm} onFocus={() => setSelectedButtonId(button.id)} onChange={(e) => onUpdateButton(index, { hMm: Number(e.target.value) })} />
                            </TableCell>
                            <TableCell label={BUTTON_COLUMNS[5].label}>
                                <input type="number" value={button.rMm ?? 0} onFocus={() => setSelectedButtonId(button.id)} onChange={(e) => onUpdateButton(index, { rMm: Number(e.target.value) })} />
                            </TableCell>
                            <TableCell label={BUTTON_COLUMNS[6].label}>
                                <input type="number" value={button.r?.tl ?? 0} onFocus={() => setSelectedButtonId(button.id)} onChange={(e) => onUpdateButton(index, { r: { ...(button.r ?? {}), tl: Number(e.target.value) } })} />
                            </TableCell>
                            <TableCell label={BUTTON_COLUMNS[7].label}>
                                <input type="number" value={button.r?.tr ?? 0} onFocus={() => setSelectedButtonId(button.id)} onChange={(e) => onUpdateButton(index, { r: { ...(button.r ?? {}), tr: Number(e.target.value) } })} />
                            </TableCell>
                            <TableCell label={BUTTON_COLUMNS[8].label}>
                                <input type="number" value={button.r?.br ?? 0} onFocus={() => setSelectedButtonId(button.id)} onChange={(e) => onUpdateButton(index, { r: { ...(button.r ?? {}), br: Number(e.target.value) } })} />
                            </TableCell>
                            <TableCell label={BUTTON_COLUMNS[9].label}>
                                <input type="number" value={button.r?.bl ?? 0} onFocus={() => setSelectedButtonId(button.id)} onChange={(e) => onUpdateButton(index, { r: { ...(button.r ?? {}), bl: Number(e.target.value) } })} />
                            </TableCell>
                            <TableCell label="Actions">
                                <button type="button" className="btn btn--danger" onClick={() => onRemoveButton(index)} aria-label="Remove button">
                                    <UiIcon name="mdi:delete-outline" className="icon" />
                                </button>
                            </TableCell>
                        </div>
                    ))}
                </div>
            </div>

            <div className="page__card">
                <div className="communityButtons__header">
                    <h3>Cutouts</h3>
                    <div className="communityCutouts__actions">
                        <button type="button" className="btn" onClick={onAddCutoutRect}>
                            <UiIcon name="mdi:shape-rectangle-plus" className="icon" />
                            Add rectangle
                        </button>
                        <button type="button" className="btn" onClick={onAddCutoutCircle}>
                            <UiIcon name="mdi:shape-circle-plus" className="icon" />
                            Add circle
                        </button>
                    </div>
                </div>
                <div className="communityCutouts__table">
                    <TableHeaderRow className="communityCutouts__row" columns={CUTOUT_COLUMNS} />
                    {draft.cutouts.length === 0 ? <p className="page__note">No cutouts yet.</p> : null}
                    {draft.cutouts.map((cutout, index) => (
                        <div key={`cutout-${index}`} className={`communityCutouts__row${selectedCutoutIndex === index ? " communityCutouts__row--selected" : ""}`}>
                            <TableCell label={CUTOUT_COLUMNS[0].label}>
                                <select
                                    value={cutout.kind}
                                    onChange={(e) => {
                                        setSelectedCutoutIndex(index);
                                        const nextKind = e.target.value === "circle" ? "circle" : "rect";
                                        if (nextKind === "circle" && cutout.kind !== "circle") {
                                            onUpdateCutout(index, { kind: "circle", cxMm: 10, cyMm: 10, rMm: 3 });
                                        }
                                        if (nextKind === "rect" && cutout.kind !== "rect") {
                                            onUpdateCutout(index, { kind: "rect", xMm: 4, yMm: 4, wMm: 10, hMm: 10, rMm: 0 });
                                        }
                                    }}
                                >
                                    <option value="rect">Rectangle</option>
                                    <option value="circle">Circle</option>
                                </select>
                            </TableCell>
                            {cutout.kind === "rect" ? (
                                <>
                                    <TableCell label={CUTOUT_COLUMNS[1].label}>
                                        <input type="number" value={cutout.xMm} onFocus={() => setSelectedCutoutIndex(index)} onChange={(e) => onUpdateCutout(index, { ...cutout, xMm: Number(e.target.value) })} />
                                    </TableCell>
                                    <TableCell label={CUTOUT_COLUMNS[2].label}>
                                        <input type="number" value={cutout.yMm} onFocus={() => setSelectedCutoutIndex(index)} onChange={(e) => onUpdateCutout(index, { ...cutout, yMm: Number(e.target.value) })} />
                                    </TableCell>
                                    <TableCell label={CUTOUT_COLUMNS[3].label}>
                                        <input type="number" value={cutout.wMm} onFocus={() => setSelectedCutoutIndex(index)} onChange={(e) => onUpdateCutout(index, { ...cutout, wMm: Number(e.target.value) })} />
                                    </TableCell>
                                    <TableCell label={CUTOUT_COLUMNS[4].label}>
                                        <input type="number" value={cutout.hMm} onFocus={() => setSelectedCutoutIndex(index)} onChange={(e) => onUpdateCutout(index, { ...cutout, hMm: Number(e.target.value) })} />
                                    </TableCell>
                                    <TableCell label={CUTOUT_COLUMNS[5].label}>
                                        <input type="number" value={cutout.rMm ?? 0} onFocus={() => setSelectedCutoutIndex(index)} onChange={(e) => onUpdateCutout(index, { ...cutout, rMm: Number(e.target.value) })} />
                                    </TableCell>
                                    <TableCell label={CUTOUT_COLUMNS[6].label}>
                                        <input type="number" value={cutout.r?.tl ?? 0} onFocus={() => setSelectedCutoutIndex(index)} onChange={(e) => onUpdateCutout(index, { ...cutout, r: { ...(cutout.r ?? {}), tl: Number(e.target.value) } })} />
                                    </TableCell>
                                    <TableCell label={CUTOUT_COLUMNS[7].label}>
                                        <input type="number" value={cutout.r?.tr ?? 0} onFocus={() => setSelectedCutoutIndex(index)} onChange={(e) => onUpdateCutout(index, { ...cutout, r: { ...(cutout.r ?? {}), tr: Number(e.target.value) } })} />
                                    </TableCell>
                                    <TableCell label={CUTOUT_COLUMNS[8].label}>
                                        <input type="number" value={cutout.r?.br ?? 0} onFocus={() => setSelectedCutoutIndex(index)} onChange={(e) => onUpdateCutout(index, { ...cutout, r: { ...(cutout.r ?? {}), br: Number(e.target.value) } })} />
                                    </TableCell>
                                    <TableCell label={CUTOUT_COLUMNS[9].label}>
                                        <input type="number" value={cutout.r?.bl ?? 0} onFocus={() => setSelectedCutoutIndex(index)} onChange={(e) => onUpdateCutout(index, { ...cutout, r: { ...(cutout.r ?? {}), bl: Number(e.target.value) } })} />
                                    </TableCell>
                                </>
                            ) : (
                                <>
                                    <TableCell label={CUTOUT_COLUMNS[1].label}>
                                        <input type="number" value={cutout.cxMm} onFocus={() => setSelectedCutoutIndex(index)} onChange={(e) => onUpdateCutout(index, { ...cutout, cxMm: Number(e.target.value) })} />
                                    </TableCell>
                                    <TableCell label={CUTOUT_COLUMNS[2].label}>
                                        <input type="number" value={cutout.cyMm} onFocus={() => setSelectedCutoutIndex(index)} onChange={(e) => onUpdateCutout(index, { ...cutout, cyMm: Number(e.target.value) })} />
                                    </TableCell>
                                    <TableCell label={CUTOUT_COLUMNS[5].label}>
                                        <input type="number" value={cutout.rMm} onFocus={() => setSelectedCutoutIndex(index)} onChange={(e) => onUpdateCutout(index, { ...cutout, rMm: Number(e.target.value) })} />
                                    </TableCell>
                                    <TableCell label={CUTOUT_COLUMNS[3].label}>
                                        <span className="communityTable__empty">—</span>
                                    </TableCell>
                                    <TableCell label={CUTOUT_COLUMNS[4].label}>
                                        <span className="communityTable__empty">—</span>
                                    </TableCell>
                                    <TableCell label={CUTOUT_COLUMNS[6].label}>
                                        <span className="communityTable__empty">—</span>
                                    </TableCell>
                                    <TableCell label={CUTOUT_COLUMNS[7].label}>
                                        <span className="communityTable__empty">—</span>
                                    </TableCell>
                                    <TableCell label={CUTOUT_COLUMNS[8].label}>
                                        <span className="communityTable__empty">—</span>
                                    </TableCell>
                                    <TableCell label={CUTOUT_COLUMNS[9].label}>
                                        <span className="communityTable__empty">—</span>
                                    </TableCell>
                                </>
                            )}
                            <TableCell label="Actions">
                                <button type="button" className="btn btn--danger" onClick={() => onRemoveCutout(index)} aria-label="Remove cutout">
                                    <UiIcon name="mdi:delete-outline" className="icon" />
                                </button>
                            </TableCell>
                        </div>
                    ))}
                </div>
            </div>
        </section>
    );
}
