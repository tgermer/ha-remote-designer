import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { ButtonDef, CornerRadiiMm, CutoutElement, RemoteTemplate } from "../app/remotes";
import type { DesignState } from "../app/types";
import { MigrationNotice } from "./MigrationNotice";
import { PreviewPane } from "./PreviewPane";
import { UiIcon } from "./UiIcon";
import { Button } from "./ui/Button";
import { useTranslation } from "react-i18next";

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
    const { t } = useTranslation();
    const { draft, template, previewState, showWatermark, watermarkText, watermarkOpacity, onChangeDraft, onUpdateButton, onAddButton, onRemoveButton, onUpdateCutout, onAddCutoutRect, onAddCutoutCircle, onRemoveCutout, onUseInConfigurator, onCopyJson, onDownloadJson, onSendToDeveloper, copyStatus = "idle", drafts, selectedDraftId, hasUnsavedChanges, onSelectDraft, onSaveDraft, onDeleteDraft, onNewDraft } = props;
    const BUTTON_COLUMNS: TableColumn[] = [
        { key: "id", label: t("community.columns.id") },
        { key: "x", label: t("community.columns.xMm") },
        { key: "y", label: t("community.columns.yMm") },
        { key: "w", label: t("community.columns.wMm") },
        { key: "h", label: t("community.columns.hMm") },
        { key: "r", label: t("community.columns.rDefaultMm") },
        { key: "tl", label: t("community.columns.tlOverride") },
        { key: "tr", label: t("community.columns.trOverride") },
        { key: "br", label: t("community.columns.brOverride") },
        { key: "bl", label: t("community.columns.blOverride") },
        { key: "actions", label: "" },
    ];
    const CUTOUT_COLUMNS: TableColumn[] = [
        { key: "type", label: t("community.columns.type") },
        { key: "x", label: t("community.columns.x") },
        { key: "y", label: t("community.columns.y") },
        { key: "w", label: t("community.columns.w") },
        { key: "h", label: t("community.columns.h") },
        { key: "r", label: t("community.columns.rDefault") },
        { key: "tl", label: t("community.columns.tlOverride") },
        { key: "tr", label: t("community.columns.trOverride") },
        { key: "br", label: t("community.columns.brOverride") },
        { key: "bl", label: t("community.columns.blOverride") },
        { key: "actions", label: "" },
    ];
    const previewRef = useRef<HTMLDivElement | null>(null);
    const dragRef = useRef<{ kind: "move-button"; buttonId: string; offsetX: number; offsetY: number } | { kind: "resize-button"; buttonId: string; handle: "e" | "s" | "se"; startX: number; startY: number; startW: number; startH: number } | { kind: "move-cutout"; index: number; offsetX: number; offsetY: number } | { kind: "resize-cutout-rect"; index: number; handle: "e" | "s" | "se"; startX: number; startY: number; startW: number; startH: number } | { kind: "resize-cutout-circle"; index: number; startCx: number; startCy: number } | null>(null);
    const [selectedButtonId, setSelectedButtonId] = useState<string>(draft.buttons[0]?.id ?? "");
    const [selectedCutoutIndex, setSelectedCutoutIndex] = useState<number | null>(null);
    const selectedButtonIndex = useMemo(() => draft.buttons.findIndex((button) => button.id === selectedButtonId), [draft.buttons, selectedButtonId]);

    useEffect(() => {
        if (selectedButtonId && draft.buttons.some((button) => button.id === selectedButtonId)) return;
        const nextId = selectedCutoutIndex !== null ? "" : (draft.buttons[0]?.id ?? "");
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
        <section className="page" aria-label={t("community.sectionLabel")}>
            <header className="page__hero page__hero--compact">
                <h1 className="page__title">{t("community.kicker")}</h1>
                <p className="page__lead">{t("community.title")}</p>
                <p className="page__lead">{t("community.lead")}</p>

                <div className="page__cta">
                    <Button variant="primary" type="button" onClick={onUseInConfigurator}>
                        <UiIcon name="mdi:hammer-wrench" className="icon" />
                        {t("community.testInConfigurator")}
                    </Button>
                    <Button type="button" onClick={onSendToDeveloper}>
                        <UiIcon name="mdi:email-outline" className="icon" />
                        {t("community.sendToDeveloper")}
                    </Button>
                    <Button type="button" onClick={onCopyJson}>
                        <UiIcon name="mdi:content-copy" className="icon" />
                        {t("community.copyJson")}
                    </Button>
                    <Button type="button" onClick={onDownloadJson}>
                        <UiIcon name="mdi:download" className="icon" />
                        {t("community.downloadJson")}
                    </Button>
                    {copyStatus === "copied" ? <span className="page__note">{t("community.copied")}</span> : null}
                    {copyStatus === "failed" ? <span className="page__note">{t("community.copyFailed")}</span> : null}
                </div>
            </header>

            <MigrationNotice variant="hero" />
            <div className="communityGrid">
                <div className="page__card">
                    <div className="communityDraftHeader">
                        <h3>{t("community.remoteDetails")}</h3>
                    </div>
                    <div className="communityDraftHeader__actions">
                        <select name="communitySelectedDraftId" value={selectedDraftId} onChange={(e) => onSelectDraft(e.target.value)}>
                            <option value="">{t("community.selectDraft")}</option>
                            {drafts.map((entry) => (
                                <option key={entry.id} value={entry.id}>
                                    {entry.name}
                                </option>
                            ))}
                        </select>
                        <Button type="button" onClick={onSaveDraft} disabled={!hasUnsavedChanges}>
                            <UiIcon name="mdi:content-save-outline" className="icon" />
                            {t("community.saveDraft")}
                        </Button>
                        <Button type="button" onClick={onNewDraft}>
                            <UiIcon name="mdi:plus" className="icon" />
                            {t("community.new")}
                        </Button>
                        <Button variant="danger" type="button" onClick={onDeleteDraft} disabled={!selectedDraftId} aria-label={t("community.deleteDraft")}>
                            <UiIcon name="mdi:delete-outline" className="icon" />
                        </Button>
                    </div>
                    <div className="communityForm">
                        <label className="communityForm__field">
                            {t("community.name")}
                            <input name="communityDraftName" type="text" value={draft.name} onChange={(e) => onChangeDraft({ name: e.target.value })} placeholder={t("community.namePlaceholder")} />
                        </label>
                        <label className="communityForm__field">
                            {t("community.width")}
                            <input name="communityDraftWidthMm" type="number" min={1} value={draft.widthMm} onChange={(e) => onChangeDraft({ widthMm: Number(e.target.value) })} />
                        </label>
                        <label className="communityForm__field">
                            {t("community.height")}
                            <input name="communityDraftHeightMm" type="number" min={1} value={draft.heightMm} onChange={(e) => onChangeDraft({ heightMm: Number(e.target.value) })} />
                        </label>
                        <label className="communityForm__field">
                            {t("community.corner")}
                            <input name="communityDraftCornerMm" type="number" min={0} value={draft.cornerMm} onChange={(e) => onChangeDraft({ cornerMm: Number(e.target.value) })} />
                        </label>
                        <label className="communityForm__field">
                            {t("community.manufacturerUrl")}
                            <input name="communityDraftManufacturerUrl" type="url" value={draft.manufacturerUrl} onChange={(e) => onChangeDraft({ manufacturerUrl: e.target.value })} placeholder="https://manufacturer.com" />
                        </label>
                        <label className="communityForm__field">
                            {t("community.imageUrl")}
                            <input name="communityDraftImageUrl" type="url" value={draft.imageUrl} onChange={(e) => onChangeDraft({ imageUrl: e.target.value })} placeholder="https://..." />
                        </label>
                        <label className="communityForm__field communityForm__field--full">
                            {t("community.tags")}
                            <input
                                name="communityDraftTags"
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
                            {t("community.notes")}
                            <textarea name="communityDraftNotes" value={draft.notes} onChange={(e) => onChangeDraft({ notes: e.target.value })} placeholder={t("community.notesPlaceholder")} />
                        </label>
                    </div>
                </div>

                <div className="page__card communityPreview">
                    <h3>{t("community.preview")}</h3>
                    <div ref={previewRef} onPointerDownCapture={handlePreviewPointerDown}>
                        <PreviewPane template={template} state={previewState} showWatermark={showWatermark} watermarkText={watermarkText} watermarkOpacity={watermarkOpacity} className="preview--community" showMissingIconPlaceholder={false} onSelectButton={setSelectedButtonId} highlightedButtonId={selectedButtonId} highlightedCutoutIndex={selectedCutoutIndex} showResizeHandles />
                    </div>
                    <div className="communityNudge">
                        <div className="communityNudge__title">{t("community.buttonPlacement")}</div>
                        <p className="page__note">{t("community.dragHint")}</p>
                    </div>
                    <p className="page__note">{t("community.outlineTip")}</p>
                </div>
            </div>

            <div className="page__grid">
                <article className="page__card">
                    <h3>{t("community.measurementGuide")}</h3>
                    <p>{t("community.measurement1")}</p>
                    <p>{t("community.measurement2")}</p>
                    <p>{t("community.measurement3")}</p>
                    <p className="page__note">{t("community.measurement4")}</p>
                </article>
                <article className="page__card">
                    <h3>{t("community.whatAreCutouts")}</h3>
                    <p>{t("community.cutouts1")}</p>
                    <p>{t("community.cutouts2")}</p>
                </article>
            </div>

            <div className="page__card">
                <div className="communityButtons__header">
                    <h3>{t("community.buttons")}</h3>
                    <Button type="button" onClick={onAddButton}>
                        <UiIcon name="mdi:plus-circle-outline" className="icon" />
                        {t("community.addButton")}
                    </Button>
                </div>
                <div className="communityButtons__table">
                    <TableHeaderRow className="communityButtons__row" columns={BUTTON_COLUMNS} />
                    {draft.buttons.map((button, index) => (
                        <div key={`${button.id}-${index}`} className={`communityButtons__row${button.id === selectedButtonId ? " communityButtons__row--selected" : ""}`}>
                            <TableCell label={BUTTON_COLUMNS[0].label}>
                                <input name={`communityButtonId-${index}`} value={button.id} onFocus={() => setSelectedButtonId(button.id)} onChange={(e) => onUpdateButton(index, { id: e.target.value })} />
                            </TableCell>
                            <TableCell label={BUTTON_COLUMNS[1].label}>
                                <input name={`communityButtonX-${index}`} type="number" value={button.xMm} onFocus={() => setSelectedButtonId(button.id)} onChange={(e) => onUpdateButton(index, { xMm: Number(e.target.value) })} />
                            </TableCell>
                            <TableCell label={BUTTON_COLUMNS[2].label}>
                                <input name={`communityButtonY-${index}`} type="number" value={button.yMm} onFocus={() => setSelectedButtonId(button.id)} onChange={(e) => onUpdateButton(index, { yMm: Number(e.target.value) })} />
                            </TableCell>
                            <TableCell label={BUTTON_COLUMNS[3].label}>
                                <input name={`communityButtonW-${index}`} type="number" value={button.wMm} onFocus={() => setSelectedButtonId(button.id)} onChange={(e) => onUpdateButton(index, { wMm: Number(e.target.value) })} />
                            </TableCell>
                            <TableCell label={BUTTON_COLUMNS[4].label}>
                                <input name={`communityButtonH-${index}`} type="number" value={button.hMm} onFocus={() => setSelectedButtonId(button.id)} onChange={(e) => onUpdateButton(index, { hMm: Number(e.target.value) })} />
                            </TableCell>
                            <TableCell label={BUTTON_COLUMNS[5].label}>
                                <input name={`communityButtonR-${index}`} type="number" value={button.rMm ?? 0} onFocus={() => setSelectedButtonId(button.id)} onChange={(e) => onUpdateButton(index, { rMm: Number(e.target.value) })} />
                            </TableCell>
                            <TableCell label={BUTTON_COLUMNS[6].label}>
                                <input name={`communityButtonTl-${index}`} type="number" value={button.r?.tl ?? 0} onFocus={() => setSelectedButtonId(button.id)} onChange={(e) => onUpdateButton(index, { r: { ...(button.r ?? {}), tl: Number(e.target.value) } })} />
                            </TableCell>
                            <TableCell label={BUTTON_COLUMNS[7].label}>
                                <input name={`communityButtonTr-${index}`} type="number" value={button.r?.tr ?? 0} onFocus={() => setSelectedButtonId(button.id)} onChange={(e) => onUpdateButton(index, { r: { ...(button.r ?? {}), tr: Number(e.target.value) } })} />
                            </TableCell>
                            <TableCell label={BUTTON_COLUMNS[8].label}>
                                <input name={`communityButtonBr-${index}`} type="number" value={button.r?.br ?? 0} onFocus={() => setSelectedButtonId(button.id)} onChange={(e) => onUpdateButton(index, { r: { ...(button.r ?? {}), br: Number(e.target.value) } })} />
                            </TableCell>
                            <TableCell label={BUTTON_COLUMNS[9].label}>
                                <input name={`communityButtonBl-${index}`} type="number" value={button.r?.bl ?? 0} onFocus={() => setSelectedButtonId(button.id)} onChange={(e) => onUpdateButton(index, { r: { ...(button.r ?? {}), bl: Number(e.target.value) } })} />
                            </TableCell>
                            <TableCell label={t("community.actions")}>
                                <Button variant="danger" type="button" onClick={() => onRemoveButton(index)} aria-label={t("community.removeButton")}>
                                    <UiIcon name="mdi:delete-outline" className="icon" />
                                </Button>
                            </TableCell>
                        </div>
                    ))}
                </div>
            </div>

            <div className="page__card">
                <div className="communityButtons__header">
                    <h3>{t("community.cutouts")}</h3>
                    <div className="communityCutouts__actions">
                        <Button type="button" onClick={onAddCutoutRect}>
                            <UiIcon name="mdi:shape-rectangle-plus" className="icon" />
                            {t("community.addRectangle")}
                        </Button>
                        <Button type="button" onClick={onAddCutoutCircle}>
                            <UiIcon name="mdi:shape-circle-plus" className="icon" />
                            {t("community.addCircle")}
                        </Button>
                    </div>
                </div>
                <div className="communityCutouts__table">
                    <TableHeaderRow className="communityCutouts__row" columns={CUTOUT_COLUMNS} />
                    {draft.cutouts.length === 0 ? <p className="page__note">{t("community.noCutouts")}</p> : null}
                    {draft.cutouts.map((cutout, index) => (
                        <div key={`cutout-${index}`} className={`communityCutouts__row${selectedCutoutIndex === index ? " communityCutouts__row--selected" : ""}`}>
                            <TableCell label={CUTOUT_COLUMNS[0].label}>
                                <select
                                    name={`communityCutoutKind-${index}`}
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
                                    <option value="rect">{t("community.rectangle")}</option>
                                    <option value="circle">{t("community.circle")}</option>
                                </select>
                            </TableCell>
                            {cutout.kind === "rect" ? (
                                <>
                                    <TableCell label={CUTOUT_COLUMNS[1].label}>
                                        <input name={`communityCutoutX-${index}`} type="number" value={cutout.xMm} onFocus={() => setSelectedCutoutIndex(index)} onChange={(e) => onUpdateCutout(index, { ...cutout, xMm: Number(e.target.value) })} />
                                    </TableCell>
                                    <TableCell label={CUTOUT_COLUMNS[2].label}>
                                        <input name={`communityCutoutY-${index}`} type="number" value={cutout.yMm} onFocus={() => setSelectedCutoutIndex(index)} onChange={(e) => onUpdateCutout(index, { ...cutout, yMm: Number(e.target.value) })} />
                                    </TableCell>
                                    <TableCell label={CUTOUT_COLUMNS[3].label}>
                                        <input name={`communityCutoutW-${index}`} type="number" value={cutout.wMm} onFocus={() => setSelectedCutoutIndex(index)} onChange={(e) => onUpdateCutout(index, { ...cutout, wMm: Number(e.target.value) })} />
                                    </TableCell>
                                    <TableCell label={CUTOUT_COLUMNS[4].label}>
                                        <input name={`communityCutoutH-${index}`} type="number" value={cutout.hMm} onFocus={() => setSelectedCutoutIndex(index)} onChange={(e) => onUpdateCutout(index, { ...cutout, hMm: Number(e.target.value) })} />
                                    </TableCell>
                                    <TableCell label={CUTOUT_COLUMNS[5].label}>
                                        <input name={`communityCutoutR-${index}`} type="number" value={cutout.rMm ?? 0} onFocus={() => setSelectedCutoutIndex(index)} onChange={(e) => onUpdateCutout(index, { ...cutout, rMm: Number(e.target.value) })} />
                                    </TableCell>
                                    <TableCell label={CUTOUT_COLUMNS[6].label}>
                                        <input name={`communityCutoutTl-${index}`} type="number" value={cutout.r?.tl ?? 0} onFocus={() => setSelectedCutoutIndex(index)} onChange={(e) => onUpdateCutout(index, { ...cutout, r: { ...(cutout.r ?? {}), tl: Number(e.target.value) } })} />
                                    </TableCell>
                                    <TableCell label={CUTOUT_COLUMNS[7].label}>
                                        <input name={`communityCutoutTr-${index}`} type="number" value={cutout.r?.tr ?? 0} onFocus={() => setSelectedCutoutIndex(index)} onChange={(e) => onUpdateCutout(index, { ...cutout, r: { ...(cutout.r ?? {}), tr: Number(e.target.value) } })} />
                                    </TableCell>
                                    <TableCell label={CUTOUT_COLUMNS[8].label}>
                                        <input name={`communityCutoutBr-${index}`} type="number" value={cutout.r?.br ?? 0} onFocus={() => setSelectedCutoutIndex(index)} onChange={(e) => onUpdateCutout(index, { ...cutout, r: { ...(cutout.r ?? {}), br: Number(e.target.value) } })} />
                                    </TableCell>
                                    <TableCell label={CUTOUT_COLUMNS[9].label}>
                                        <input name={`communityCutoutBl-${index}`} type="number" value={cutout.r?.bl ?? 0} onFocus={() => setSelectedCutoutIndex(index)} onChange={(e) => onUpdateCutout(index, { ...cutout, r: { ...(cutout.r ?? {}), bl: Number(e.target.value) } })} />
                                    </TableCell>
                                </>
                            ) : (
                                <>
                                    <TableCell label={CUTOUT_COLUMNS[1].label}>
                                        <input name={`communityCutoutCx-${index}`} type="number" value={cutout.cxMm} onFocus={() => setSelectedCutoutIndex(index)} onChange={(e) => onUpdateCutout(index, { ...cutout, cxMm: Number(e.target.value) })} />
                                    </TableCell>
                                    <TableCell label={CUTOUT_COLUMNS[2].label}>
                                        <input name={`communityCutoutCy-${index}`} type="number" value={cutout.cyMm} onFocus={() => setSelectedCutoutIndex(index)} onChange={(e) => onUpdateCutout(index, { ...cutout, cyMm: Number(e.target.value) })} />
                                    </TableCell>
                                    <TableCell label={CUTOUT_COLUMNS[5].label}>
                                        <input name={`communityCutoutRadius-${index}`} type="number" value={cutout.rMm} onFocus={() => setSelectedCutoutIndex(index)} onChange={(e) => onUpdateCutout(index, { ...cutout, rMm: Number(e.target.value) })} />
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
                            <TableCell label={t("community.actions")}>
                                <Button variant="danger" type="button" onClick={() => onRemoveCutout(index)} aria-label={t("community.removeCutout")}>
                                    <UiIcon name="mdi:delete-outline" className="icon" />
                                </Button>
                            </TableCell>
                        </div>
                    ))}
                </div>
            </div>
        </section>
    );
}
