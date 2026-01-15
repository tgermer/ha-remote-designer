import { TapMarker } from "../components/TapMarker";
import { renderHaIconAtMm } from "./renderHaIcon";
import { TapType } from "../app/types";

type ButtonLabelSvgProps = {
    state: any;
    cfg: Record<TapType, string | undefined>;
    taps: TapType[];
    bx: number;
    by: number;
    button: { wMm: number; hMm: number };
};

export function ButtonLabelSvg({ state, cfg, taps, bx, by, button }: ButtonLabelSvgProps) {
    const labelWidthMm = 40;
    const labelHeightMm = 30;

    const gapMm = 1;
    const markerMm = 3;

    const markerFill = state.options.markerFillMode;

    return (
        <svg width={labelWidthMm} height={labelHeightMm} viewBox={`0 0 ${labelWidthMm} ${labelHeightMm}`} xmlns="http://www.w3.org/2000/svg" shapeRendering="geometricPrecision">
            {/* Label background */}
            <rect width={labelWidthMm} height={labelHeightMm} fill="#eee" rx={3} ry={3} />

            {/* Button cut frame */}
            <rect x={bx} y={by} width={button.wMm} height={button.hMm} fill="none" stroke="#aaa" strokeWidth={0.5} rx={3} ry={3} />

            {/* Icons and tap markers inside button frame */}
            {taps.length === 1 &&
                (() => {
                    const tap = taps[0] as TapType;
                    const iconMm = state.options.autoIconSizing ? Math.max(5, Math.min(10, button.wMm - 2, button.hMm - 2)) : state.options.fixedIconMm;

                    const buttonCx = bx + button.wMm / 2;

                    if (state.options.showTapMarkersAlways) {
                        const groupH = iconMm + gapMm + markerMm;
                        const topY = by + (button.hMm - groupH) / 2;
                        const iconCy = topY + iconMm / 2;
                        const markerCy = topY + iconMm + gapMm + markerMm / 2;

                        return (
                            <g>
                                {renderHaIconAtMm({ icon: cfg[tap]!, cx: buttonCx, cy: iconCy, iconMm })}
                                <g transform={`translate(${buttonCx}, ${markerCy})`}>
                                    <TapMarker tap={tap} fillMode={markerFill} sizeMm={markerMm} />
                                </g>
                            </g>
                        );
                    }

                    const buttonCy = by + button.hMm / 2;
                    return <g>{renderHaIconAtMm({ icon: cfg[tap]!, cx: buttonCx, cy: buttonCy, iconMm })}</g>;
                })()}

            {taps.length > 1 &&
                (() => {
                    const n = taps.length;
                    const colW = button.wMm / n;
                    const iconMm = state.options.autoIconSizing ? Math.max(5, Math.min(9, colW - 2, button.hMm - markerMm - gapMm - 2)) : Math.min(state.options.fixedIconMm, colW - 2);

                    const groupH = iconMm + gapMm + markerMm;
                    const topY = by + (button.hMm - groupH) / 2;
                    const iconCy = topY + iconMm / 2;
                    const markerCy = topY + iconMm + gapMm + markerMm / 2;

                    return taps.map((tap, i) => {
                        const iconCx = bx + colW * (i + 0.5);
                        return (
                            <g key={tap}>
                                {renderHaIconAtMm({
                                    icon: cfg[tap]!,
                                    cx: iconCx,
                                    cy: iconCy,
                                    iconMm,
                                })}
                                <g transform={`translate(${iconCx}, ${markerCy})`}>
                                    <TapMarker tap={tap as TapType} fillMode={markerFill} sizeMm={markerMm} />
                                </g>
                            </g>
                        );
                    });
                })()}

            {/* Watermark */}
            {state.options.showWatermark && (
                <text x={labelWidthMm - 1} y={labelHeightMm - 1} fontSize={3} fill="#888" textAnchor="end" alignmentBaseline="baseline" pointerEvents="none">
                    HA
                </text>
            )}
        </svg>
    );
}
