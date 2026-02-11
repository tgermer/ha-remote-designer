import type { DesignOptions } from "../../app/types";
import type { StickerSheetLayout } from "../../app/stickerSheet";

type StickerTemplateSectionProps = {
    options: DesignOptions;
    layout: StickerSheetLayout;
    onUpdateOptions: (patch: Partial<DesignOptions>) => void;
};

export function StickerTemplateSection(props: StickerTemplateSectionProps) {
    const { options, layout, onUpdateOptions } = props;

    const sizeFits = layout.maxCount > 0;
    const countTooHigh = options.labelCount > layout.maxCount && layout.maxCount > 0;
    const pagesLabel = layout.pages === 1 ? "1 page" : `${layout.pages} pages`;

    return (
        <fieldset>
            <legend>Sticker Template</legend>
            <div className="options">
                <label className="option">
                    Paper size
                    <select name="sheetSize" value={options.sheetSize} onChange={(e) => onUpdateOptions({ sheetSize: e.target.value as DesignOptions["sheetSize"] })}>
                        <option value="A4">A4</option>
                        <option value="Letter">Letter</option>
                    </select>
                </label>

                <label className="option">
                    Sticker width (mm)
                    <input
                        name="labelWidthMm"
                        type="number"
                        min={5}
                        max={210}
                        step={0.5}
                        value={options.labelWidthMm}
                        onChange={(e) => onUpdateOptions({ labelWidthMm: Number(e.target.value) })}
                    />
                </label>

                <label className="option">
                    Sticker height (mm)
                    <input
                        name="labelHeightMm"
                        type="number"
                        min={5}
                        max={297}
                        step={0.5}
                        value={options.labelHeightMm}
                        onChange={(e) => onUpdateOptions({ labelHeightMm: Number(e.target.value) })}
                    />
                </label>

                <label className="option">
                    Corner radius (mm)
                    <input
                        name="labelCornerMm"
                        type="number"
                        min={0}
                        max={20}
                        step={0.5}
                        value={options.labelCornerMm}
                        onChange={(e) => onUpdateOptions({ labelCornerMm: Number(e.target.value) })}
                    />
                </label>

                <label className="option">
                    Sticker count
                    <input
                        name="labelCount"
                        type="number"
                        min={1}
                        max={999}
                        step={1}
                        value={options.labelCount}
                        onChange={(e) => onUpdateOptions({ labelCount: Math.max(1, Math.floor(Number(e.target.value))) })}
                    />
                </label>

                <label className="option">
                    Sheet margin X (mm)
                    <input
                        name="sheetMarginXMm"
                        type="number"
                        min={0}
                        max={50}
                        step={0.5}
                        value={options.sheetMarginXMm}
                        onChange={(e) => onUpdateOptions({ sheetMarginXMm: Number(e.target.value) })}
                    />
                </label>

                <label className="option">
                    Sheet margin Y (mm)
                    <input
                        name="sheetMarginYMm"
                        type="number"
                        min={0}
                        max={50}
                        step={0.5}
                        value={options.sheetMarginYMm}
                        onChange={(e) => onUpdateOptions({ sheetMarginYMm: Number(e.target.value) })}
                    />
                </label>

                <label className="option">
                    Sticker gap (mm)
                    <input
                        name="sheetGapMm"
                        type="number"
                        min={0}
                        max={30}
                        step={0.5}
                        value={options.sheetGapMm}
                        onChange={(e) => onUpdateOptions({ sheetGapMm: Number(e.target.value) })}
                    />
                </label>

                <p className="option__note">
                    {options.sheetSize} layout: {layout.columns} × {layout.rows} (max {layout.maxCount} stickers per page) — {pagesLabel}
                </p>

                {!sizeFits && <p className="option__note option__note--warn">Sticker size is too large to fit on A4.</p>}
                {countTooHigh && <p className="option__note option__note--warn">Only the first {layout.maxCount} stickers fit on one A4 page.</p>}
            </div>
        </fieldset>
    );
}
