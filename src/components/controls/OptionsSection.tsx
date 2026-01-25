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
                    <input type="checkbox" checked={options.showTapMarkersAlways} onChange={(e) => onUpdateOptions({ showTapMarkersAlways: e.target.checked })} />
                    Show tap marker for single tap (single icon)
                </label>

                <label className="option">
                    <input type="checkbox" checked={options.showTapDividers} onChange={(e) => onUpdateOptions({ showTapDividers: e.target.checked })} />
                    Show dividers for multi icons
                </label>

                <label className="option">
                    Tap marker style
                    <select value={options.tapMarkerFill} onChange={(e) => onUpdateOptions({ tapMarkerFill: e.target.value as DesignOptions["tapMarkerFill"] })}>
                        <option value="outline">Outline</option>
                        <option value="filled">Filled</option>
                    </select>
                </label>

                <label className="option">
                    <input type="checkbox" checked={options.showRemoteOutline} onChange={(e) => onUpdateOptions({ showRemoteOutline: e.target.checked })} />
                    {outlineLabel}
                </label>

                <label className="option">
                    <input type="checkbox" checked={options.showButtonOutlines} onChange={(e) => onUpdateOptions({ showButtonOutlines: e.target.checked })} />
                    Show button outlines
                </label>

                <label className="option">
                    Label outline color
                    <input type="color" value={options.labelOutlineColor} onChange={(e) => onUpdateOptions({ labelOutlineColor: e.target.value })} />
                </label>

                <label className="option">
                    Label outline stroke (mm)
                    <input
                        type="number"
                        min={0.05}
                        max={2}
                        step={0.05}
                        value={options.labelOutlineStrokeMm}
                        onChange={(e) => onUpdateOptions({ labelOutlineStrokeMm: Number(e.target.value) })}
                    />
                </label>

                <label className="option">
                    <input type="checkbox" checked={options.autoIconSizing} onChange={(e) => onUpdateOptions({ autoIconSizing: e.target.checked })} />
                    Auto icon sizing
                </label>

                {!options.autoIconSizing && (
                    <label className="option">
                        Fixed icon size (mm)
                        <input
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
                    <input type="checkbox" checked={options.showScaleBar} onChange={(e) => onUpdateOptions({ showScaleBar: e.target.checked })} />
                    Show 1 cm scale bar (print check)
                </label>
            </div>
        </fieldset>
    );
}
