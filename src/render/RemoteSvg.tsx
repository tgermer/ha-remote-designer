import type { TapType } from "../app/types";
import { renderHaIconAtMm } from "./renderHaIcon";
import { TapMarker } from "./RemoteSvg";

const labelWidthMm = 40;
const labelHeightMm = 30;

export function ButtonLabelSvg({ button, state, taps, markerFill = "outline" }: { button: any; state: any; taps: TapType[]; markerFill?: "outline" | "filled" }) {
    const markerMm = 3;
    const gapMm = 1;

    const bx = 4;
    const by = 3;

    const cfg = state.buttonConfigs[button.id]?.icons ?? {};

    return (
        <svg width={`${labelWidthMm}mm`} height={`${labelHeightMm}mm`} viewBox={`0 0 ${labelWidthMm} ${labelHeightMm}`} xmlns="http://www.w3.org/2000/svg">
            <rect width={labelWidthMm} height={labelHeightMm} fill="white" />
            <rect x={bx} y={by} width={button.wMm} height={button.hMm} rx={button.rMm} ry={button.rMm} fill="none" stroke="black" strokeWidth="0.5" />

            {taps.length === 0 && <></>}

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
        </svg>
    );
}
