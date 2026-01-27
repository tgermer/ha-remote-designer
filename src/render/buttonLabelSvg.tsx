import type { ButtonDef } from "../app/remotes";
import { TAP_ORDER, type DesignState, type TapType } from "../app/types";
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

function TapMarker({ tap, sizeMm = 3, fillMode = "outline", color = "black" }: { tap: TapType; sizeMm?: number; fillMode?: "outline" | "filled"; color?: string }) {
    const stroke = 0.35;
    const rr = sizeMm / 2 - stroke;
    const fill = fillMode === "filled" ? color : "none";

    if (tap === "single") {
        return <circle cx="0" cy="0" r={rr} fill={fill} stroke={color} strokeWidth={stroke} />;
    }

    if (tap === "double") {
        const dx = rr + 0.6;
        return (
            <g>
                <circle cx={-dx} cy="0" r={rr} fill={fill} stroke={color} strokeWidth={stroke} />
                <circle cx={dx} cy="0" r={rr} fill={fill} stroke={color} strokeWidth={stroke} />
            </g>
        );
    }

    // Long press: rounded capsule that supports outline vs filled
    const h = sizeMm * 0.8;
    const w = sizeMm * 2.6;

    return <rect x={-w / 2} y={-h / 2} width={w} height={h} rx={h / 2} ry={h / 2} fill={fill} stroke={color} strokeWidth={stroke} />;
}

function getMarkerSizing(iconMm: number, autoIconSizing: boolean) {
    if (autoIconSizing) {
        return { markerMm: 3, gapMm: 1 };
    }

    const markerMm = Math.max(2.2, Math.min(4.8, iconMm * 0.45));
    const gapMm = Math.max(0.9, Math.min(2.2, iconMm * 0.2));
    return { markerMm, gapMm };
}

export function ButtonLabelSvg({ state, button, labelWidthMm, labelHeightMm, showWatermark, watermarkText, watermarkOpacity, xMm, yMm }: { state: DesignState; button: ButtonDef; labelWidthMm: number; labelHeightMm: number; showWatermark?: boolean; watermarkText?: string; watermarkOpacity?: number; xMm?: number; yMm?: number }) {
    const buttonCfg = state.buttonConfigs[button.id] ?? {};
    const cfg = buttonCfg.icons ?? {};
    const iconColors = buttonCfg.iconColors ?? {};
    const buttonFill = buttonCfg.buttonFill;
    const strikeBgColor = buttonFill ?? "white";
    const defaultIconColor = state.options.iconColor;

    const enabledTaps = state.tapsEnabled.length ? state.tapsEnabled : (["single"] as TapType[]);
    const taps = TAP_ORDER.filter((t) => enabledTaps.includes(t) && !!cfg[t]);
    const n = taps.length;

    // Center the button zone inside the label (40×30mm)
    const bx = (labelWidthMm - button.wMm) / 2;
    const by = (labelHeightMm - button.hMm) / 2;

    const radii = getButtonRadii(button);

    const outlineColor = state.options.labelOutlineColor || "#ccc";
    const outlineStroke = typeof state.options.labelOutlineStrokeMm === "number" ? state.options.labelOutlineStrokeMm : 0.1;

    const markerFill = state.options.tapMarkerFill;
    const markerColorMode = state.options.tapMarkerColorMode;
    const showButtonOutlines = state.options.showButtonOutlines;

    const wmEnabled = !!showWatermark && !!watermarkText;
    const wmOpacity = typeof watermarkOpacity === "number" ? watermarkOpacity : 0.12;

    return (
        <svg
            width={`${labelWidthMm}mm`}
            height={`${labelHeightMm}mm`}
            viewBox={`0 0 ${labelWidthMm} ${labelHeightMm}`}
            xmlns="http://www.w3.org/2000/svg"
            x={typeof xMm === "number" ? xMm : undefined}
            y={typeof yMm === "number" ? yMm : undefined}
        >
            <rect x="0" y="0" width={labelWidthMm} height={labelHeightMm} fill="white" />

            {/* Button cut frame (with radii) */}
            {typeof buttonFill === "string" && buttonFill.length > 0
                ? isUniformRadii(radii)
                    ? <rect x={bx} y={by} width={button.wMm} height={button.hMm} rx={radii.tl} ry={radii.tl} fill={buttonFill} stroke="none" />
                    : <path d={roundedRectPath(bx, by, button.wMm, button.hMm, radii)} fill={buttonFill} stroke="none" />
                : null}
            {showButtonOutlines
                ? isUniformRadii(radii)
                    ? <rect x={bx} y={by} width={button.wMm} height={button.hMm} rx={radii.tl} ry={radii.tl} fill="none" stroke={outlineColor} strokeWidth={outlineStroke} />
                    : <path d={roundedRectPath(bx, by, button.wMm, button.hMm, radii)} fill="none" stroke={outlineColor} strokeWidth={outlineStroke} />
                : null}

            {/* Icons + markers inside the button frame */}
            {n === 1 &&
                (() => {
                    const tap = taps[0];
                    const iconMm = state.options.autoIconSizing ? Math.max(5, Math.min(10, button.wMm - 2, button.hMm - 2)) : state.options.fixedIconMm;
                    const { markerMm, gapMm } = getMarkerSizing(iconMm, state.options.autoIconSizing);

                    const buttonCx = bx + button.wMm / 2;

                    const shouldShowMarker = tap !== "single" || state.options.showTapMarkersAlways;

                    if (shouldShowMarker) {
                        const groupH = iconMm + gapMm + markerMm;
                        const topY = by + (button.hMm - groupH) / 2;
                        const iconCy = topY + iconMm / 2;
                        const markerCy = topY + iconMm + gapMm + markerMm / 2;
                        const markerColor = markerColorMode === "icon" ? iconColors[tap] ?? defaultIconColor : "black";

                        return (
                            <g>
                                {renderHaIconAtMm({
                                    icon: cfg[tap] as string,
                                    cx: buttonCx,
                                    cy: iconCy,
                                    iconMm,
                                    strike: state.buttonConfigs[button.id]?.strike?.[tap] ?? false,
                                    color: iconColors[tap] ?? defaultIconColor,
                                    strikeBgColor,
                                })}
                                <g transform={`translate(${buttonCx}, ${markerCy})`}>
                                    <TapMarker tap={tap} fillMode={markerFill} sizeMm={markerMm} color={markerColor} />
                                </g>
                            </g>
                        );
                    }

                    const buttonCy = by + button.hMm / 2;
                    return (
                        <g>
                            {renderHaIconAtMm({
                                icon: cfg[tap] as string,
                                cx: buttonCx,
                                cy: buttonCy,
                                iconMm,
                                strike: state.buttonConfigs[button.id]?.strike?.[tap] ?? false,
                                color: iconColors[tap] ?? defaultIconColor,
                                strikeBgColor,
                            })}
                        </g>
                    );
                })()}

            {n > 1 &&
                (() => {
                    const colW = button.wMm / n;
                    const iconMm = state.options.autoIconSizing ? Math.max(5, Math.min(9, colW - 2, button.hMm - 3 - 1 - 2)) : Math.min(state.options.fixedIconMm, colW - 2);
                    const { markerMm, gapMm } = getMarkerSizing(iconMm, state.options.autoIconSizing);

                    const groupH = iconMm + gapMm + markerMm;
                    const topY = by + (button.hMm - groupH) / 2;
                    const iconCy = topY + iconMm / 2;
                    const markerCy = topY + iconMm + gapMm + markerMm / 2;
                    const resolveMarkerColor = (tap: TapType) => (markerColorMode === "icon" ? iconColors[tap] ?? defaultIconColor : "black");

                    const showDividers = state.options.showTapDividers;

                    const dividers = showDividers
                        ? Array.from({ length: n - 1 }).map((_, i) => {
                              const x = bx + colW * (i + 1);
                              return <line key={`div_${i}`} x1={x} y1={by + 0.8} x2={x} y2={by + button.hMm - 0.8} stroke="black" strokeWidth={0.2} opacity={0.6} />;
                          })
                        : null;

                    return (
                        <g>
                            {dividers}
                            {taps.map((tap, i) => {
                                const iconCx = bx + colW * (i + 0.5);
                                return (
                                    <g key={tap}>
                                        {renderHaIconAtMm({
                                            icon: cfg[tap] as string,
                                            cx: iconCx,
                                            cy: iconCy,
                                            iconMm,
                                            strike: state.buttonConfigs[button.id]?.strike?.[tap] ?? false,
                                            color: iconColors[tap] ?? defaultIconColor,
                                            strikeBgColor,
                                        })}
                                        <g transform={`translate(${iconCx}, ${markerCy})`}>
                                            <TapMarker tap={tap} fillMode={markerFill} sizeMm={markerMm} color={resolveMarkerColor(tap)} />
                                        </g>
                                    </g>
                                );
                            })}
                        </g>
                    );
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
