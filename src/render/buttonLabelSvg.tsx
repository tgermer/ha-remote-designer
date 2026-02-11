import type { ButtonDef } from "../app/remotes";
import { TAP_ORDER, type DesignState, type StrikeStyle, type TapType } from "../app/types";
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

const BUTTON_TEXT_PADDING_X_MM = 1.2;
const BUTTON_TEXT_PADDING_Y_MM = 1.1;
const BUTTON_TEXT_FONT = "IBM Plex Sans";
const BUTTON_TEXT_LINE_HEIGHT = 1.15;

function normalizeTapTextLines(text: string | undefined) {
    if (typeof text !== "string") return [] as string[];
    return text
        .replace(/\r\n/g, "\n")
        .split("\n")
        .map((line) => line.replace(/\s+/g, " ").trim())
        .filter((line) => line.length > 0);
}

function estimateTextWidthUnits(text: string) {
    let units = 0;
    for (const ch of Array.from(text)) {
        if (" ilI|!.,'`".includes(ch)) {
            units += 0.34;
            continue;
        }
        if ("mwMW@#%&".includes(ch)) {
            units += 0.95;
            continue;
        }
        if (/[0-9]/.test(ch)) {
            units += 0.64;
            continue;
        }
        if (/[A-ZÄÖÜ]/.test(ch)) {
            units += 0.72;
            continue;
        }
        units += 0.58;
    }
    return Math.max(1, units);
}

function getTextFontSizeMm(lines: string[], maxWidthMm: number, maxHeightMm: number) {
    const widestUnits = Math.max(...lines.map((line) => estimateTextWidthUnits(line)));
    const totalUnits = lines.reduce((sum, line) => sum + estimateTextWidthUnits(line), 0);
    const widthUnits = Math.max(widestUnits, totalUnits * 0.38);
    const innerWidth = Math.max(0.8, maxWidthMm - BUTTON_TEXT_PADDING_X_MM * 2);
    const innerHeight = Math.max(0.8, maxHeightMm - BUTTON_TEXT_PADDING_Y_MM * 2);
    const byWidth = innerWidth / widthUnits;
    const byHeight = innerHeight / (Math.max(1, lines.length) * BUTTON_TEXT_LINE_HEIGHT);
    return Math.max(1.3, Math.min(byWidth, byHeight));
}

function getTextVisualHeightMm(lines: string[], fontSizeMm: number) {
    const lineAdvance = BUTTON_TEXT_LINE_HEIGHT * fontSizeMm;
    return (Math.max(1, lines.length) - 1) * lineAdvance + fontSizeMm;
}

function renderTapContent(params: {
    icon?: string;
    text?: string;
    cx: number;
    cy: number;
    maxWidthMm: number;
    maxHeightMm: number;
    iconMm: number;
    strike?: boolean;
    strikeStyle?: StrikeStyle;
    color?: string;
    strikeBgColor?: string;
    forcedFontSizeMm?: number;
}) {
    const { icon, text, cx, cy, maxWidthMm, maxHeightMm, iconMm, strike, strikeStyle, color, strikeBgColor, forcedFontSizeMm } = params;
    const lines = normalizeTapTextLines(text);
    if (lines.length) {
        const fontSize = forcedFontSizeMm ?? getTextFontSizeMm(lines, maxWidthMm, maxHeightMm);
        const lineAdvance = BUTTON_TEXT_LINE_HEIGHT * fontSize;
        const blockHeight = (lines.length - 1) * lineAdvance;
        const strikeColor = color || "black";
        const highlightColor = strikeBgColor || "white";
        const textBlockWidth = Math.max(...lines.map((line) => estimateTextWidthUnits(line))) * fontSize;
        const textBlockHeight = getTextVisualHeightMm(lines, fontSize);
        const padX = Math.max(0.2, fontSize * 0.22);
        const padY = Math.max(0.16, fontSize * 0.16);
        const halfW = textBlockWidth / 2 + padX;
        const halfH = textBlockHeight / 2 + padY;
        const d = Math.max(0.2, Math.min(halfW, halfH) * 0.82);
        const x1 = cx - d;
        const y1 = cy - d;
        const x2 = cx + d;
        const y2 = cy + d;
        const strikeOffset = Math.max(0.08, fontSize * 0.06);
        const strikeOx = strikeOffset / Math.SQRT2;
        const strikeOy = -strikeOffset / Math.SQRT2;
        const strikeWidth = Math.max(0.16, fontSize * 0.14);
        const strikeOverlay = strike
            ? strikeStyle === "straight"
                ? lines.map((line, i) => {
                      const lineY = cy - blockHeight / 2 + i * lineAdvance;
                      const lineWidth = estimateTextWidthUnits(line) * fontSize;
                      const linePadX = Math.max(0.2, fontSize * 0.22);
                      const straightInset = Math.max(0.25, fontSize * 0.24);
                      const xLeft = cx - lineWidth / 2 - linePadX + straightInset;
                      const xRight = cx + lineWidth / 2 + linePadX - straightInset;
                      const yOff = Math.max(0.08, fontSize * 0.06);
                      return (
                          <g key={`strike-${i}`}>
                              <line x1={xLeft} y1={lineY - yOff} x2={xRight} y2={lineY - yOff} stroke={highlightColor} strokeWidth={strikeWidth} strokeLinecap="butt" />
                              <line x1={xLeft} y1={lineY} x2={xRight} y2={lineY} stroke={strikeColor} strokeWidth={strikeWidth} strokeLinecap="butt" />
                          </g>
                      );
                  })
                : (
                    <>
                        <line x1={x1 + strikeOx} y1={y1 + strikeOy} x2={x2 + strikeOx} y2={y2 + strikeOy} stroke={highlightColor} strokeWidth={strikeWidth} strokeLinecap="butt" />
                        <line x1={x1} y1={y1} x2={x2} y2={y2} stroke={strikeColor} strokeWidth={strikeWidth} strokeLinecap="butt" />
                    </>
                )
            : null;
        return (
            <g fill={color || "black"} fontSize={fontSize} fontWeight={600} fontFamily={BUTTON_TEXT_FONT}>
                {lines.map((line, i) => (
                    <text key={`${line}-${i}`} x={cx} y={cy - blockHeight / 2 + i * lineAdvance} textAnchor="middle" dominantBaseline="middle">
                        {line}
                    </text>
                ))}
                {strikeOverlay}
            </g>
        );
    }
    if (!icon) return null;
    return renderHaIconAtMm({ icon, cx, cy, iconMm, strike, color, strikeBgColor });
}

export function ButtonLabelSvg({ state, button, labelWidthMm, labelHeightMm, showWatermark, watermarkText, watermarkOpacity, xMm, yMm }: { state: DesignState; button: ButtonDef; labelWidthMm: number; labelHeightMm: number; showWatermark?: boolean; watermarkText?: string; watermarkOpacity?: number; xMm?: number; yMm?: number }) {
    const buttonCfg = state.buttonConfigs[button.id] ?? {};
    const cfg = buttonCfg.icons ?? {};
    const texts = buttonCfg.texts ?? {};
    const strikeStyles = buttonCfg.strikeStyle ?? {};
    const iconColors = buttonCfg.iconColors ?? {};
    const buttonFill = buttonCfg.buttonFill;
    const strikeBgColor = buttonFill ?? "white";
    const defaultIconColor = state.options.iconColor;

    const enabledTaps = state.tapsEnabled.length ? state.tapsEnabled : (["single"] as TapType[]);
    const taps = TAP_ORDER.filter((t) => enabledTaps.includes(t) && (!!cfg[t] || normalizeTapTextLines(texts[t]).length > 0));
    const n = taps.length;
    const uniformTextFontSizeMm = (() => {
        let minSize = Infinity;
        if (n === 0) return undefined;

        if (n === 1) {
            const tap = taps[0];
            const lines = normalizeTapTextLines(texts[tap]);
            if (!lines.length) return undefined;
            const iconMm = state.options.autoIconSizing ? Math.max(5, Math.min(10, button.wMm - 2, button.hMm - 2)) : state.options.fixedIconMm;
            const shouldShowMarker = tap !== "single" || state.options.showTapMarkersAlways;
            const { markerMm, gapMm } = getMarkerSizing(iconMm, state.options.autoIconSizing);
            const maxWidthMm = Math.max(1, button.wMm - 2);
            const maxHeightMm = shouldShowMarker ? Math.max(1, button.hMm - markerMm - gapMm - 1.2) : Math.max(1, button.hMm - 2);
            minSize = Math.min(minSize, getTextFontSizeMm(lines, maxWidthMm, maxHeightMm));
            return Number.isFinite(minSize) ? minSize : undefined;
        }

        const colW = button.wMm / n;
        const iconMm = state.options.autoIconSizing ? Math.max(5, Math.min(9, colW - 2, button.hMm - 3 - 1 - 2)) : Math.min(state.options.fixedIconMm, colW - 2);
        const { markerMm, gapMm } = getMarkerSizing(iconMm, state.options.autoIconSizing);
        for (const tap of taps) {
            const lines = normalizeTapTextLines(texts[tap]);
            if (!lines.length) continue;
            minSize = Math.min(minSize, getTextFontSizeMm(lines, Math.max(1, colW - 1.6), Math.max(1, button.hMm - markerMm - gapMm - 1.2)));
        }
        return Number.isFinite(minSize) ? minSize : undefined;
    })();

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
                        const hasText = normalizeTapTextLines(texts[tap]).length > 0;
                        const lines = normalizeTapTextLines(texts[tap]);
                        const textFontSizeMm = lines.length
                            ? (uniformTextFontSizeMm ?? getTextFontSizeMm(lines, Math.max(1, button.wMm - 2), Math.max(1, button.hMm - markerMm - gapMm - 1.2)))
                            : 0;
                        const contentHeightMm = hasText ? getTextVisualHeightMm(lines, textFontSizeMm) : iconMm;
                        const groupH = contentHeightMm + gapMm + markerMm;
                        const topY = by + (button.hMm - groupH) / 2;
                        const iconCy = topY + contentHeightMm / 2;
                        const markerCy = topY + contentHeightMm + gapMm + markerMm / 2;
                        const markerColor = markerColorMode === "icon" ? iconColors[tap] ?? defaultIconColor : "black";

                        return (
                            <g>
                                {renderTapContent({
                                    icon: cfg[tap],
                                    text: texts[tap],
                                    cx: buttonCx,
                                    cy: iconCy,
                                    maxWidthMm: Math.max(1, button.wMm - 2),
                                    maxHeightMm: Math.max(1, button.hMm - markerMm - gapMm - 1.2),
                                    iconMm,
                                    strike: state.buttonConfigs[button.id]?.strike?.[tap] ?? false,
                                    strikeStyle: strikeStyles[tap] ?? "diagonal",
                                    color: iconColors[tap] ?? defaultIconColor,
                                    strikeBgColor,
                                    forcedFontSizeMm: uniformTextFontSizeMm,
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
                            {renderTapContent({
                                icon: cfg[tap],
                                text: texts[tap],
                                cx: buttonCx,
                                cy: buttonCy,
                                maxWidthMm: Math.max(1, button.wMm - 2),
                                maxHeightMm: Math.max(1, button.hMm - 2),
                                iconMm,
                                strike: state.buttonConfigs[button.id]?.strike?.[tap] ?? false,
                                strikeStyle: strikeStyles[tap] ?? "diagonal",
                                color: iconColors[tap] ?? defaultIconColor,
                                strikeBgColor,
                                forcedFontSizeMm: uniformTextFontSizeMm,
                            })}
                        </g>
                    );
                })()}

            {n > 1 &&
                (() => {
                    const colW = button.wMm / n;
                    const iconMm = state.options.autoIconSizing ? Math.max(5, Math.min(9, colW - 2, button.hMm - 3 - 1 - 2)) : Math.min(state.options.fixedIconMm, colW - 2);
                    const { markerMm, gapMm } = getMarkerSizing(iconMm, state.options.autoIconSizing);
                    const resolveMarkerColor = (tap: TapType) => (markerColorMode === "icon" ? iconColors[tap] ?? defaultIconColor : "black");
                    const iconGroupH = iconMm + gapMm + markerMm;
                    const iconTopY = by + (button.hMm - iconGroupH) / 2;

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
                                const hasText = normalizeTapTextLines(texts[tap]).length > 0;
                                const lines = normalizeTapTextLines(texts[tap]);
                                const textFontSizeMm = lines.length
                                    ? (uniformTextFontSizeMm ?? getTextFontSizeMm(lines, Math.max(1, colW - 1.6), Math.max(1, button.hMm - markerMm - gapMm - 1.2)))
                                    : 0;
                                const contentHeightMm = hasText ? getTextVisualHeightMm(lines, textFontSizeMm) : iconMm;
                                const groupH = contentHeightMm + gapMm + markerMm;
                                const topY = by + (button.hMm - groupH) / 2;
                                const iconCy = hasText ? topY + contentHeightMm / 2 : iconTopY + iconMm / 2;
                                const markerCy = hasText ? topY + contentHeightMm + gapMm + markerMm / 2 : iconTopY + iconMm + gapMm + markerMm / 2;
                                return (
                                    <g key={tap}>
                                        {renderTapContent({
                                            icon: cfg[tap],
                                            text: texts[tap],
                                            cx: iconCx,
                                            cy: iconCy,
                                            maxWidthMm: Math.max(1, colW - 1.6),
                                            maxHeightMm: Math.max(1, button.hMm - markerMm - gapMm - 1.2),
                                            iconMm,
                                            strike: state.buttonConfigs[button.id]?.strike?.[tap] ?? false,
                                            strikeStyle: strikeStyles[tap] ?? "diagonal",
                                            color: iconColors[tap] ?? defaultIconColor,
                                            strikeBgColor,
                                            forcedFontSizeMm: uniformTextFontSizeMm,
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
