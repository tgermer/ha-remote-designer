import type { DesignOptions } from "../../app/types";

type OptionsSectionProps = {
    options: DesignOptions;
    onUpdateOptions: (patch: Partial<DesignOptions>) => void;
    remoteOutlineLabel?: string;
};

export function OptionsSection(props: OptionsSectionProps) {
    const { options, onUpdateOptions, remoteOutlineLabel } = props;
    const outlineLabel = remoteOutlineLabel ?? "Show remote outline";

    return (
        <fieldset>
            <legend>Options</legend>
            <div className="options">
                <label className="option">
                    <input name="showTapMarkersAlways" type="checkbox" checked={options.showTapMarkersAlways} onChange={(e) => onUpdateOptions({ showTapMarkersAlways: e.target.checked })} />
                    Show tap marker for single tap (single content)
                </label>

                <label className="option">
                    <input name="showTapDividers" type="checkbox" checked={options.showTapDividers} onChange={(e) => onUpdateOptions({ showTapDividers: e.target.checked })} />
                    Show dividers for multi content
                </label>

                <label className="option">
                    Tap marker style
                    <select name="tapMarkerFill" value={options.tapMarkerFill} onChange={(e) => onUpdateOptions({ tapMarkerFill: e.target.value as DesignOptions["tapMarkerFill"] })}>
                        <option value="outline">Outline</option>
                        <option value="filled">Filled</option>
                    </select>
                </label>

                <label className="option">
                    Tap marker color
                    <select name="tapMarkerColorMode" value={options.tapMarkerColorMode} onChange={(e) => onUpdateOptions({ tapMarkerColorMode: e.target.value as DesignOptions["tapMarkerColorMode"] })}>
                        <option value="black">Black</option>
                        <option value="icon">Content color</option>
                    </select>
                </label>

                <label className="option">
                    <input name="showRemoteOutline" type="checkbox" checked={options.showRemoteOutline} onChange={(e) => onUpdateOptions({ showRemoteOutline: e.target.checked })} />
                    {outlineLabel}
                </label>

                <label className="option">
                    <input name="showButtonOutlines" type="checkbox" checked={options.showButtonOutlines} onChange={(e) => onUpdateOptions({ showButtonOutlines: e.target.checked })} />
                    Show button outlines
                </label>

                <label className="option">
                    <input name="showCutouts" type="checkbox" checked={options.showCutouts} onChange={(e) => onUpdateOptions({ showCutouts: e.target.checked })} />
                    Show cutouts (export + preview)
                </label>

                <label className="option">
                    Label outline color
                    <input name="labelOutlineColor" type="color" value={options.labelOutlineColor} onChange={(e) => onUpdateOptions({ labelOutlineColor: e.target.value })} />
                </label>

                <label className="option">
                    Label outline stroke (mm)
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
                    Auto content sizing
                </label>

                <label className="option">
                    Default content color
                    <input name="iconColor" type="color" value={options.iconColor} onChange={(e) => onUpdateOptions({ iconColor: e.target.value })} />
                </label>

                {!options.autoIconSizing && (
                    <label className="option">
                        Fixed icon size (mm)
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
                    Show 1 cm scale bar (print check)
                </label>
            </div>
        </fieldset>
    );
}
