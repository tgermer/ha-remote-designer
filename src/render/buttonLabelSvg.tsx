import type { ButtonDef } from "../app/remotes";
import type { DesignState, TapType } from "../app/types";
import { renderHaIconAtMm } from "./renderHaIcon";

export function ButtonLabelSvg({ state, button, labelWidthMm, labelHeightMm, showWatermark, watermarkText, watermarkOpacity }: { state: DesignState; button: ButtonDef; labelWidthMm: number; labelHeightMm: number; showWatermark?: boolean; watermarkText?: string; watermarkOpacity?: number }) {
    const cfg = state.buttonConfigs[button.id]?.icons ?? {};
    const taps = state.tapsEnabled.filter((t) => !!cfg[t]);
    const n = taps.length;

    const markerMm = 3;
    const gapMm = 1;

    const markerFill = state.options.tapMarkerFill;

    function TapMarker({ tap, sizeMm = 3, fillMode = "outline" }: { tap: TapType; sizeMm?: number; fillMode?: "outline" | "filled" }) {
        const stroke = 0.35;
        const r = sizeMm / 2 - stroke;
        const fill = fillMode === "filled" ? "black" : "none";

        if (tap === "single") {
            return <circle cx="0" cy="0" r={r} fill={fill} stroke="black" strokeWidth={stroke} />;
        }

        if (tap === "double") {
            const dx = r + 0.6;
            return (
                <g>
                    <circle cx={-dx} cy="0" r={r} fill={fill} stroke="black" strokeWidth={stroke} />
                    <circle cx={dx} cy="0" r={r} fill={fill} stroke="black" strokeWidth={stroke} />
                </g>
            );
        }

        const h = sizeMm * 0.8;
        const w = sizeMm * 2.6;
        return <rect x={-w / 2} y={-h / 2} width={w} height={h} rx={h / 2} ry={h / 2} fill={fill} stroke="black" strokeWidth={stroke} />;
    }

    const wmEnabled = !!showWatermark && !!watermarkText;
    const wmOpacity = typeof watermarkOpacity === "number" ? watermarkOpacity : 0.12;

    // Center the real button area inside the 40×30mm label (may clip if the button is larger).
    const bx = (labelWidthMm - button.wMm) / 2;
    const by = (labelHeightMm - button.hMm) / 2;

    return (
        <svg width={`${labelWidthMm}mm`} height={`${labelHeightMm}mm`} viewBox={`0 0 ${labelWidthMm} ${labelHeightMm}`} xmlns="http://www.w3.org/2000/svg">
            <rect x="0" y="0" width={labelWidthMm} height={labelHeightMm} fill="white" />

            {/* Button cut frame (always square) */}
            <rect x={bx} y={by} width={button.wMm} height={button.hMm} rx={0} ry={0} fill="none" stroke="black" strokeWidth="0.25" />

            {n === 0 && <rect x="0.2" y="0.2" width={labelWidthMm - 0.4} height={labelHeightMm - 0.4} fill="none" stroke="black" strokeWidth="0.25" />}

            {n === 1 &&
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

            {n > 1 &&
                (() => {
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
            {wmEnabled ? (
                <g opacity={wmOpacity} pointerEvents="none">
                    <text x={labelWidthMm / 2} y={labelHeightMm / 2} textAnchor="middle" dominantBaseline="middle" fontSize={Math.max(5, Math.min(12, labelWidthMm / 3))} fontFamily="system-ui, -apple-system, BlinkMacSystemFont, sans-serif" fill="black" transform={`rotate(-30 ${labelWidthMm / 2} ${labelHeightMm / 2})`}>
                        {watermarkText}
                    </text>
                </g>
            ) : null}
        </svg>
    );
}
