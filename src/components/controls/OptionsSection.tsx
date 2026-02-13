import type { DesignOptions } from "../../app/types";
import { useTranslation } from "react-i18next";

type OptionsSectionProps = {
    options: DesignOptions;
    onUpdateOptions: (patch: Partial<DesignOptions>) => void;
    remoteOutlineLabel?: string;
};

export function OptionsSection(props: OptionsSectionProps) {
    const { t } = useTranslation();
    const { options, onUpdateOptions, remoteOutlineLabel } = props;
    const outlineLabel = remoteOutlineLabel ?? t("controls.options.showRemoteOutline");

    return (
        <fieldset>
            <legend>{t("controls.options.legend")}</legend>
            <div className="options">
                <label className="option">
                    <input name="showTapMarkersAlways" type="checkbox" checked={options.showTapMarkersAlways} onChange={(e) => onUpdateOptions({ showTapMarkersAlways: e.target.checked })} />
                    {t("controls.options.showTapMarker")}
                </label>

                <label className="option">
                    <input name="showTapDividers" type="checkbox" checked={options.showTapDividers} onChange={(e) => onUpdateOptions({ showTapDividers: e.target.checked })} />
                    {t("controls.options.showDividers")}
                </label>

                <label className="option">
                    {t("controls.options.tapMarkerStyle")}
                    <select name="tapMarkerFill" value={options.tapMarkerFill} onChange={(e) => onUpdateOptions({ tapMarkerFill: e.target.value as DesignOptions["tapMarkerFill"] })}>
                        <option value="outline">{t("controls.options.outline")}</option>
                        <option value="filled">{t("controls.options.filled")}</option>
                    </select>
                </label>

                <label className="option">
                    {t("controls.options.tapMarkerColor")}
                    <select name="tapMarkerColorMode" value={options.tapMarkerColorMode} onChange={(e) => onUpdateOptions({ tapMarkerColorMode: e.target.value as DesignOptions["tapMarkerColorMode"] })}>
                        <option value="black">{t("controls.options.black")}</option>
                        <option value="icon">{t("controls.options.contentColor")}</option>
                    </select>
                </label>

                <label className="option">
                    <input name="showRemoteOutline" type="checkbox" checked={options.showRemoteOutline} onChange={(e) => onUpdateOptions({ showRemoteOutline: e.target.checked })} />
                    {outlineLabel}
                </label>

                <label className="option">
                    <input name="showButtonOutlines" type="checkbox" checked={options.showButtonOutlines} onChange={(e) => onUpdateOptions({ showButtonOutlines: e.target.checked })} />
                    {t("controls.options.showButtonOutlines")}
                </label>

                <label className="option">
                    <input name="showCutouts" type="checkbox" checked={options.showCutouts} onChange={(e) => onUpdateOptions({ showCutouts: e.target.checked })} />
                    {t("controls.options.showCutouts")}
                </label>

                <label className="option">
                    {t("controls.options.labelOutlineColor")}
                    <input name="labelOutlineColor" type="color" value={options.labelOutlineColor} onChange={(e) => onUpdateOptions({ labelOutlineColor: e.target.value })} />
                </label>

                <label className="option">
                    {t("controls.options.labelOutlineStroke")}
                    <input
                        name="labelOutlineStrokeMm"
                        type="number"
                        min={0.05}
                        max={2}
                        step={0.05}
                        value={options.labelOutlineStrokeMm}
                        onChange={(e) => onUpdateOptions({ labelOutlineStrokeMm: Number(e.target.value) })}
                    />
                </label>

                <label className="option">
                    <input name="autoIconSizing" type="checkbox" checked={options.autoIconSizing} onChange={(e) => onUpdateOptions({ autoIconSizing: e.target.checked })} />
                    {t("controls.options.autoContentSizing")}
                </label>

                <label className="option">
                    {t("controls.options.defaultContentColor")}
                    <input name="iconColor" type="color" value={options.iconColor} onChange={(e) => onUpdateOptions({ iconColor: e.target.value })} />
                </label>

                {!options.autoIconSizing && (
                    <label className="option">
                        {t("controls.options.fixedIconSize")}
                        <input
                            name="fixedIconMm"
                            type="number"
                            min={4}
                            max={40}
                            step={0.5}
                            value={options.fixedIconMm}
                            onChange={(e) => onUpdateOptions({ fixedIconMm: Number(e.target.value) })}
                        />
                    </label>
                )}

                <label className="option">
                    <input name="showScaleBar" type="checkbox" checked={options.showScaleBar} onChange={(e) => onUpdateOptions({ showScaleBar: e.target.checked })} />
                    {t("controls.options.showScaleBar")}
                </label>
            </div>
        </fieldset>
    );
}
