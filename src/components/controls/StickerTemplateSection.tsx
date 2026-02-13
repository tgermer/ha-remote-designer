import type { DesignOptions } from "../../app/types";
import type { StickerSheetLayout } from "../../app/stickerSheet";
import { useTranslation } from "react-i18next";

type StickerTemplateSectionProps = {
    options: DesignOptions;
    layout: StickerSheetLayout;
    onUpdateOptions: (patch: Partial<DesignOptions>) => void;
};

export function StickerTemplateSection(props: StickerTemplateSectionProps) {
    const { t } = useTranslation();
    const { options, layout, onUpdateOptions } = props;

    const sizeFits = layout.maxCount > 0;
    const countTooHigh = options.labelCount > layout.maxCount && layout.maxCount > 0;
    const pagesLabel = layout.pages === 1 ? t("controls.sticker.onePage") : t("controls.sticker.pages", { count: layout.pages });

    return (
        <fieldset>
            <legend>{t("controls.sticker.legend")}</legend>
            <div className="options">
                <label className="option">
                    {t("controls.sticker.paperSize")}
                    <select name="sheetSize" value={options.sheetSize} onChange={(e) => onUpdateOptions({ sheetSize: e.target.value as DesignOptions["sheetSize"] })}>
                        <option value="A4">A4</option>
                        <option value="Letter">{t("controls.sticker.letter")}</option>
                    </select>
                </label>

                <label className="option">
                    {t("controls.sticker.width")}
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
                    {t("controls.sticker.height")}
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
                    {t("controls.sticker.corner")}
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
                    {t("controls.sticker.count")}
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
                    {t("controls.sticker.marginX")}
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
                    {t("controls.sticker.marginY")}
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
                    {t("controls.sticker.gap")}
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
                    {t("controls.sticker.layoutNote", { sheetSize: options.sheetSize, columns: layout.columns, rows: layout.rows, max: layout.maxCount, pagesLabel })}
                </p>

                {!sizeFits && <p className="option__note option__note--warn">{t("controls.sticker.tooLarge")}</p>}
                {countTooHigh && <p className="option__note option__note--warn">{t("controls.sticker.countTooHigh", { max: layout.maxCount })}</p>}
            </div>
        </fieldset>
    );
}
