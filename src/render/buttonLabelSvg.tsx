import type { ButtonDef } from "../app/remotes";
import type { DesignState } from "../app/types";
import { renderHaIconAtMm } from "./renderHaIcon";

export function ButtonLabelSvg({ state, button, labelWidthMm, labelHeightMm, showWatermark, watermarkText, watermarkOpacity }: { state: DesignState; button: ButtonDef; labelWidthMm: number; labelHeightMm: number; showWatermark?: boolean; watermarkText?: string; watermarkOpacity?: number }) {
    const cfg = state.buttonConfigs[button.id]?.icons ?? {};
    const taps = state.tapsEnabled.filter((t) => !!cfg[t]);
    const n = taps.length;

    const cx = labelWidthMm / 2;
    const cy = labelHeightMm / 2;

    const markerMm = 3;
    const gapMm = 1;

    const wmEnabled = !!showWatermark && !!watermarkText;
    const wmOpacity = typeof watermarkOpacity === "number" ? watermarkOpacity : 0.12;

    return (
        <svg width={`${labelWidthMm}mm`} height={`${labelHeightMm}mm`} viewBox={`0 0 ${labelWidthMm} ${labelHeightMm}`} xmlns="http://www.w3.org/2000/svg">
            <rect x="0" y="0" width={labelWidthMm} height={labelHeightMm} fill="white" />

            {n === 0 && <rect x="0.2" y="0.2" width={labelWidthMm - 0.4} height={labelHeightMm - 0.4} fill="none" stroke="black" strokeWidth="0.25" />}

            {n === 1 && (
                <>
                    {renderHaIconAtMm({
                        icon: cfg[taps[0]]!,
                        cx,
                        cy,
                        iconMm: Math.min(labelWidthMm, labelHeightMm) - 6,
                    })}
                </>
            )}

            {n > 1 &&
                (() => {
                    const colW = labelWidthMm / n;
                    const iconMm = Math.min(colW - 4, labelHeightMm - markerMm - gapMm - 4);
                    const topY = (labelHeightMm - (iconMm + gapMm + markerMm)) / 2;

                    return taps.map((tap, i) => {
                        const iconCx = colW * (i + 0.5);
                        return (
                            <g key={tap}>
                                {renderHaIconAtMm({
                                    icon: cfg[tap]!,
                                    cx: iconCx,
                                    cy: topY + iconMm / 2,
                                    iconMm,
                                })}
                            </g>
                        );
                    });
                })()}
            {wmEnabled ? (
                <g opacity={wmOpacity} pointerEvents="none">
                    <text x={labelWidthMm / 2} y={labelHeightMm / 2} textAnchor="middle" dominantBaseline="middle" fontSize={Math.max(5, Math.min(12, labelWidthMm / 3))} fontFamily="system-ui, -apple-system, BlinkMacSystemFont, sans-serif" fill="black" transform={`rotate(-75 ${labelWidthMm / 2} ${labelHeightMm / 2})`}>
                        {watermarkText}
                    </text>
                </g>
            ) : null}
        </svg>
    );
}
