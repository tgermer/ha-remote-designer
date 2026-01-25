export const A4_SIZE_MM = { width: 210, height: 297 };
export const LETTER_SIZE_MM = { width: 215.9, height: 279.4 };

export const DEFAULT_SHEET_MARGIN_X_MM = 8;
export const DEFAULT_SHEET_MARGIN_Y_MM = 8;
export const DEFAULT_SHEET_GAP_MM = 3;

export type StickerSheetLayout = {
    sheetWidthMm: number;
    sheetHeightMm: number;
    marginXMm: number;
    marginYMm: number;
    gapMm: number;
    columns: number;
    rows: number;
    maxCount: number;
    effectiveCount: number;
    pages: number;
    positions: { xMm: number; yMm: number }[];
};

type StickerLayoutParams = {
    labelWidthMm: number;
    labelHeightMm: number;
    count: number;
    sheetWidthMm?: number;
    sheetHeightMm?: number;
    marginXMm?: number;
    marginYMm?: number;
    gapMm?: number;
};

export function getStickerSheetLayout(params: StickerLayoutParams): StickerSheetLayout {
    const sheetWidthMm = Number.isFinite(params.sheetWidthMm) ? (params.sheetWidthMm as number) : A4_SIZE_MM.width;
    const sheetHeightMm = Number.isFinite(params.sheetHeightMm) ? (params.sheetHeightMm as number) : A4_SIZE_MM.height;
    const marginXMm = Number.isFinite(params.marginXMm) ? (params.marginXMm as number) : DEFAULT_SHEET_MARGIN_X_MM;
    const marginYMm = Number.isFinite(params.marginYMm) ? (params.marginYMm as number) : DEFAULT_SHEET_MARGIN_Y_MM;
    const gapMm = Number.isFinite(params.gapMm) ? (params.gapMm as number) : DEFAULT_SHEET_GAP_MM;
    const count = Math.max(0, Math.floor(Number.isFinite(params.count) ? (params.count as number) : 0));

    const labelWidthMm = Number.isFinite(params.labelWidthMm) ? (params.labelWidthMm as number) : 0;
    const labelHeightMm = Number.isFinite(params.labelHeightMm) ? (params.labelHeightMm as number) : 0;

    if (labelWidthMm <= 0 || labelHeightMm <= 0) {
        return {
            sheetWidthMm,
            sheetHeightMm,
            marginXMm,
            marginYMm,
            gapMm,
            columns: 0,
            rows: 0,
            maxCount: 0,
            effectiveCount: 0,
            positions: [],
        };
    }

    const usableWidth = Math.max(0, sheetWidthMm - marginXMm * 2);
    const usableHeight = Math.max(0, sheetHeightMm - marginYMm * 2);

    const rawColumns = Math.floor((usableWidth + gapMm) / (labelWidthMm + gapMm));
    const rawRows = Math.floor((usableHeight + gapMm) / (labelHeightMm + gapMm));
    const columns = Number.isFinite(rawColumns) ? Math.max(0, rawColumns) : 0;
    const rows = Number.isFinite(rawRows) ? Math.max(0, rawRows) : 0;
    const maxCount = Number.isFinite(columns * rows) ? columns * rows : 0;
    const effectiveCount = Math.min(count, maxCount);
    const pages = maxCount > 0 ? Math.ceil(count / maxCount) : 0;

    const positions = Array.from({ length: effectiveCount }, (_, i) => {
        const col = columns ? i % columns : 0;
        const row = columns ? Math.floor(i / columns) : 0;
        return {
            xMm: marginXMm + col * (labelWidthMm + gapMm),
            yMm: marginYMm + row * (labelHeightMm + gapMm),
        };
    });

    return {
        sheetWidthMm,
        sheetHeightMm,
        marginXMm,
        marginYMm,
        gapMm,
        columns,
        rows,
        maxCount,
        effectiveCount,
        pages,
        positions,
    };
}
