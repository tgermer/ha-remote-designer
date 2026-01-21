import type { ButtonDef } from "../app/remotes";
import type { DesignState, TapType } from "../app/types";
import { renderHaIconAtMm } from "./renderHaIcon";

type CornerRadii = { tl: number; tr: number; br: number; bl: number };

function clampRadius(r: number, w: number, h: number) {
    return Math.max(0, Math.min(r, w / 2, h / 2));
}

function roundedRectPath(x: number, y: number, w: number, h: number, r: CornerRadii) {
    const tl = clampRadius(r.tl, w, h);
    const tr = clampRadius(r.tr, w, h);
    const br = clampRadius(r.br, w, h);
    const bl = clampRadius(r.bl, w, h);

    const x0 = x;
    const y0 = y;
    const x1 = x + w;
    const y1 = y + h;

    return [`M ${x0 + tl} ${y0}`, `H ${x1 - tr}`, tr ? `A ${tr} ${tr} 0 0 1 ${x1} ${y0 + tr}` : `L ${x1} ${y0}`, `V ${y1 - br}`, br ? `A ${br} ${br} 0 0 1 ${x1 - br} ${y1}` : `L ${x1} ${y1}`, `H ${x0 + bl}`, bl ? `A ${bl} ${bl} 0 0 1 ${x0} ${y1 - bl}` : `L ${x0} ${y1}`, `V ${y0 + tl}`, tl ? `A ${tl} ${tl} 0 0 1 ${x0 + tl} ${y0}` : `L ${x0} ${y0}`, "Z"].join(" ");
}

function getButtonRadii(button: ButtonDef): CornerRadii {
    const uni = typeof button.rMm === "number" ? button.rMm : 0;
    const tl = typeof button.r?.tl === "number" ? button.r.tl : uni;
    const tr = typeof button.r?.tr === "number" ? button.r.tr : uni;
    const br = typeof button.r?.br === "number" ? button.r.br : uni;
    const bl = typeof button.r?.bl === "number" ? button.r.bl : uni;
    return { tl, tr, br, bl };
}

function isUniformRadii(r: CornerRadii) {
    return r.tl === r.tr && r.tr === r.br && r.br === r.bl;
}

function TapMarker({ tap, sizeMm = 3, fillMode = "outline" }: { tap: TapType; sizeMm?: number; fillMode?: "outline" | "filled" }) {
    const stroke = 0.35;
    const rr = sizeMm / 2 - stroke;
    const fill = fillMode === "filled" ? "black" : "none";

    if (tap === "single") {
        return <circle cx="0" cy="0" r={rr} fill={fill} stroke="black" strokeWidth={stroke} />;
    }

    if (tap === "double") {
        const dx = rr + 0.6;
        return (
            <g>
                <circle cx={-dx} cy="0" r={rr} fill={fill} stroke="black" strokeWidth={stroke} />
                <circle cx={dx} cy="0" r={rr} fill={fill} stroke="black" strokeWidth={stroke} />
            </g>
        );
    }

    // Long press: robust pill (always rounded in SVG)
    const h = sizeMm * 0.8;
    const w = sizeMm * 2.6;
    return <line x1={-w / 2} y1={0} x2={w / 2} y2={0} stroke="black" strokeWidth={h} strokeLinecap="round" />;
}

export function ButtonLabelSvg({ state, button, labelWidthMm, labelHeightMm, showWatermark, watermarkText, watermarkOpacity }: { state: DesignState; button: ButtonDef; labelWidthMm: number; labelHeightMm: number; showWatermark?: boolean; watermarkText?: string; watermarkOpacity?: number }) {
    const cfg = state.buttonConfigs[button.id]?.icons ?? {};

    const enabledTaps = state.tapsEnabled.length ? state.tapsEnabled : (["single"] as TapType[]);
    const taps = enabledTaps.filter((t) => !!cfg[t]);
    const n = taps.length;

    // Center the button zone inside the label (40×30mm)
    const bx = (labelWidthMm - button.wMm) / 2;
    const by = (labelHeightMm - button.hMm) / 2;

    const radii = getButtonRadii(button);

    const markerMm = 3;
    const gapMm = 1;
    const markerFill = state.options.tapMarkerFill;

    const wmEnabled = !!showWatermark && !!watermarkText;
    const wmOpacity = typeof watermarkOpacity === "number" ? watermarkOpacity : 0.12;

    return (
        <svg width={`${labelWidthMm}mm`} height={`${labelHeightMm}mm`} viewBox={`0 0 ${labelWidthMm} ${labelHeightMm}`} xmlns="http://www.w3.org/2000/svg">
            <rect x="0" y="0" width={labelWidthMm} height={labelHeightMm} fill="white" />

            {/* Button cut frame (with radii) */}
            {isUniformRadii(radii) ? <rect x={bx} y={by} width={button.wMm} height={button.hMm} rx={radii.tl} ry={radii.tl} fill="none" stroke="black" strokeWidth={0.25} /> : <path d={roundedRectPath(bx, by, button.wMm, button.hMm, radii)} fill="none" stroke="black" strokeWidth={0.25} />}

            {/* Icons + markers inside the button frame */}
            {n === 1 &&
                (() => {
                    const tap = taps[0];
                    const iconMm = state.options.autoIconSizing ? Math.max(5, Math.min(10, button.wMm - 2, button.hMm - 2)) : state.options.fixedIconMm;

                    const buttonCx = bx + button.wMm / 2;

                    if (state.options.showTapMarkersAlways) {
                        const groupH = iconMm + gapMm + markerMm;
                        const topY = by + (button.hMm - groupH) / 2;
                        const iconCy = topY + iconMm / 2;
                        const markerCy = topY + iconMm + gapMm + markerMm / 2;

                        return (
                            <g>
                                {renderHaIconAtMm({ icon: cfg[tap] as string, cx: buttonCx, cy: iconCy, iconMm })}
                                <g transform={`translate(${buttonCx}, ${markerCy})`}>
                                    <TapMarker tap={tap} fillMode={markerFill} sizeMm={markerMm} />
                                </g>
                            </g>
                        );
                    }

                    const buttonCy = by + button.hMm / 2;
                    return <g>{renderHaIconAtMm({ icon: cfg[tap] as string, cx: buttonCx, cy: buttonCy, iconMm })}</g>;
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
                                {renderHaIconAtMm({ icon: cfg[tap] as string, cx: iconCx, cy: iconCy, iconMm })}
                                <g transform={`translate(${iconCx}, ${markerCy})`}>
                                    <TapMarker tap={tap} fillMode={markerFill} sizeMm={markerMm} />
                                </g>
                            </g>
                        );
                    });
                })()}

            {/* Watermark */}
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
