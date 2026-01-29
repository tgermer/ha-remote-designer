import type { ButtonDef, CutoutElement, PreviewElement, RemoteTemplate } from "../app/remotes";
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

function getButtonRadiiMm(button: Pick<ButtonDef, "rMm" | "r">, squareButtons?: boolean): CornerRadii {
    if (squareButtons) return { tl: 0, tr: 0, br: 0, bl: 0 };

    const uni = typeof button.rMm === "number" ? button.rMm : 0;
    const tl = typeof button.r?.tl === "number" ? button.r.tl : uni;
    const tr = typeof button.r?.tr === "number" ? button.r.tr : uni;
    const br = typeof button.r?.br === "number" ? button.r.br : uni;
    const bl = typeof button.r?.bl === "number" ? button.r.bl : uni;

    return { tl, tr, br, bl };
}

function getElementRadiiMm(element: Pick<PreviewElement, "rMm" | "r">): CornerRadii {
    const uni = typeof element.rMm === "number" ? element.rMm : 0;
    const tl = typeof element.r?.tl === "number" ? element.r.tl : uni;
    const tr = typeof element.r?.tr === "number" ? element.r.tr : uni;
    const br = typeof element.r?.br === "number" ? element.r.br : uni;
    const bl = typeof element.r?.bl === "number" ? element.r.bl : uni;

    return { tl, tr, br, bl };
}

function getCutoutRadiiMm(element: Extract<CutoutElement, { kind: "rect" }>): CornerRadii {
    const uni = typeof element.rMm === "number" ? element.rMm : 0;
    const tl = typeof element.r?.tl === "number" ? element.r.tl : uni;
    const tr = typeof element.r?.tr === "number" ? element.r.tr : uni;
    const br = typeof element.r?.br === "number" ? element.r.br : uni;
    const bl = typeof element.r?.bl === "number" ? element.r.bl : uni;

    return { tl, tr, br, bl };
}

function isUniformRadii(r: CornerRadii) {
    return r.tl === r.tr && r.tr === r.br && r.br === r.bl;
}

function TapMarker({ tap, sizeMm = 3, fillMode = "outline", color = "black" }: { tap: TapType; sizeMm?: number; fillMode?: "outline" | "filled"; color?: string }) {
    const stroke = 0.35;
    const r = sizeMm / 2 - stroke;
    const fill = fillMode === "filled" ? color : "none";

    if (tap === "single") {
        return <circle cx="0" cy="0" r={r} fill={fill} stroke={color} strokeWidth={stroke} />;
    }

    if (tap === "double") {
        const dx = r + 0.6;
        return (
            <g>
                <circle cx={-dx} cy="0" r={r} fill={fill} stroke={color} strokeWidth={stroke} />
                <circle cx={dx} cy="0" r={r} fill={fill} stroke={color} strokeWidth={stroke} />
            </g>
        );
    }

    const h = sizeMm * 0.7;
    const w = sizeMm * 2.3;
    return <rect x={-w / 2} y={-h / 2} width={w} height={h} rx={h / 2} fill={fill} stroke={color} strokeWidth={stroke} />;
}

function getMarkerSizing(iconMm: number, autoIconSizing: boolean) {
    if (autoIconSizing) {
        return { markerMm: 3, gapMm: 1 };
    }

    const markerMm = Math.max(2.2, Math.min(4.8, iconMm * 0.45));
    const gapMm = Math.max(0.9, Math.min(2.2, iconMm * 0.2));
    return { markerMm, gapMm };
}

export function RemoteSvg({
    template,
    state,
    overrides,
    exportMode,
    showWatermark,
    watermarkText,
    watermarkOpacity,
    background,
    onSelectButton,
    highlightedButtonId,
    highlightedCutoutIndex,
    showResizeHandles,
    renderPreviewElements = true,
    showMissingIconPlaceholder = false,
}: {
    template: RemoteTemplate;
    state: DesignState;
    overrides?: Partial<DesignState["options"]>;
    exportMode?: { squareButtons?: boolean };
    showWatermark?: boolean;
    watermarkText?: string;
    watermarkOpacity?: number;
    background?: "white" | "remote" | "transparent";
    onSelectButton?: (buttonId: string) => void;
    highlightedButtonId?: string;
    highlightedCutoutIndex?: number;
    showResizeHandles?: boolean;
    renderPreviewElements?: boolean;
    showMissingIconPlaceholder?: boolean;
}) {
    const options = { ...state.options, ...overrides };
    const { showTapMarkersAlways, showTapDividers, showRemoteOutline, showButtonOutlines, showCutouts, showGuides, autoIconSizing, fixedIconMm, tapMarkerFill, tapMarkerColorMode, iconColor } = options;

    const outlineColor = options.labelOutlineColor ?? "#ccc";
    const outlineStrokeMm = typeof options.labelOutlineStrokeMm === "number" ? options.labelOutlineStrokeMm : 0.1;

    const showScaleBar = options.showScaleBar === true;
    // Extra bottom space for the 1 cm scale bar + text (export only)
    const extraBottomMm = showScaleBar ? 16 : 0;
    const canvasHeightMm = template.heightMm + extraBottomMm;

    const enabledTaps = state.tapsEnabled.length ? state.tapsEnabled : (["single"] as TapType[]);

    const wmEnabled = !!showWatermark && !!watermarkText;
    const wmOpacity = typeof watermarkOpacity === "number" ? watermarkOpacity : 0.12;

    return (
        <svg width={`${template.widthMm}mm`} height={`${canvasHeightMm}mm`} viewBox={`0 0 ${template.widthMm} ${canvasHeightMm}`} xmlns="http://www.w3.org/2000/svg">
            {background === "white" || background === undefined ? <rect x="0" y="0" width={template.widthMm} height={canvasHeightMm} fill="white" /> : background === "remote" ? <rect x="0" y="0" width={template.widthMm} height={template.heightMm} rx={template.cornerMm} fill="white" /> : null}
            {showRemoteOutline && <rect x="0.2" y="0.2" width={template.widthMm - 0.4} height={template.heightMm - 0.4} rx={template.cornerMm} fill="none" stroke="black" strokeWidth="0.4" />}

            {showGuides && (
                <g opacity={0.35}>
                    <line x1={template.widthMm / 2} y1={0} x2={template.widthMm / 2} y2={template.heightMm} stroke="black" strokeWidth="0.2" />
                    <line x1={0} y1={template.heightMm / 2} x2={template.widthMm} y2={template.heightMm / 2} stroke="black" strokeWidth="0.2" />
                </g>
            )}

            {renderPreviewElements &&
                template.previewElements?.map((element, index) => {
                    if (element.kind !== "rect") return null;
                    const radii = getElementRadiiMm(element);
                    const fill = element.fill ?? "#e6e6e6";
                    const stroke = element.stroke ?? "none";
                    const strokeWidthMm = typeof element.strokeWidthMm === "number" ? element.strokeWidthMm : 0.2;
                    const opacity = typeof element.opacity === "number" ? element.opacity : 1;

                    if (isUniformRadii(radii)) {
                        return (
                            <rect
                                key={`preview-${index}`}
                                x={element.xMm}
                                y={element.yMm}
                                width={element.wMm}
                                height={element.hMm}
                                rx={radii.tl}
                                fill={fill}
                                stroke={stroke}
                                strokeWidth={strokeWidthMm}
                                opacity={opacity}
                                pointerEvents="none"
                            />
                        );
                    }

                    return (
                        <path
                            key={`preview-${index}`}
                            d={roundedRectPath(element.xMm, element.yMm, element.wMm, element.hMm, radii)}
                            fill={fill}
                            stroke={stroke}
                            strokeWidth={strokeWidthMm}
                            opacity={opacity}
                            pointerEvents="none"
                        />
                    );
                })}

            {template.buttons.map((b) => {
                const buttonCfg = state.buttonConfigs[b.id] ?? {};
                const cfg = buttonCfg.icons ?? {};
                const iconColors = buttonCfg.iconColors ?? {};
                const buttonFill = buttonCfg.buttonFill;
                const strikeBgColor = buttonFill ?? "white";
                const activeTaps = TAP_ORDER.filter((t) => enabledTaps.includes(t) && !!cfg[t]);
                const n = activeTaps.length;

                const buttonCx = b.xMm + b.wMm / 2;
                const buttonCy = b.yMm + b.hMm / 2;

                const radii = getButtonRadiiMm(b, exportMode?.squareButtons);

                const fill = typeof buttonFill === "string" && buttonFill.length > 0 ? (isUniformRadii(radii) ? <rect x={b.xMm} y={b.yMm} width={b.wMm} height={b.hMm} rx={radii.tl} fill={buttonFill} stroke="none" /> : <path d={roundedRectPath(b.xMm, b.yMm, b.wMm, b.hMm, radii)} fill={buttonFill} stroke="none" />) : null;
                const outline = showButtonOutlines ? isUniformRadii(radii) ? <rect x={b.xMm} y={b.yMm} width={b.wMm} height={b.hMm} rx={radii.tl} fill="none" stroke={outlineColor} strokeWidth={outlineStrokeMm} /> : <path d={roundedRectPath(b.xMm, b.yMm, b.wMm, b.hMm, radii)} fill="none" stroke={outlineColor} strokeWidth={outlineStrokeMm} /> : null;
                const hitPaddingMm = onSelectButton ? 1.5 : 0;
                const hitX = b.xMm - hitPaddingMm;
                const hitY = b.yMm - hitPaddingMm;
                const hitW = b.wMm + hitPaddingMm * 2;
                const hitH = b.hMm + hitPaddingMm * 2;
                const hitRadii = {
                    tl: radii.tl + hitPaddingMm,
                    tr: radii.tr + hitPaddingMm,
                    br: radii.br + hitPaddingMm,
                    bl: radii.bl + hitPaddingMm,
                };
                const hitTarget = onSelectButton ? (
                    isUniformRadii(radii) ? (
                        <rect
                            className="preview__buttonHit"
                            x={hitX}
                            y={hitY}
                            width={hitW}
                            height={hitH}
                            rx={hitRadii.tl}
                            fill="transparent"
                            stroke="none"
                            pointerEvents="all"
                            data-button-id={b.id}
                            onClick={() => onSelectButton(b.id)}
                        />
                    ) : (
                        <path
                            className="preview__buttonHit"
                            d={roundedRectPath(hitX, hitY, hitW, hitH, hitRadii)}
                            fill="transparent"
                            stroke="none"
                            pointerEvents="all"
                            data-button-id={b.id}
                            onClick={() => onSelectButton(b.id)}
                        />
                    )
                ) : null;
                const highlight = highlightedButtonId === b.id ? (
                    isUniformRadii(radii) ? (
                        <rect x={b.xMm} y={b.yMm} width={b.wMm} height={b.hMm} rx={radii.tl} fill="none" stroke="#6d5cc6" strokeWidth="0.6" pointerEvents="none" />
                    ) : (
                        <path d={roundedRectPath(b.xMm, b.yMm, b.wMm, b.hMm, radii)} fill="none" stroke="#6d5cc6" strokeWidth="0.6" pointerEvents="none" />
                    )
                ) : null;
                const handles =
                    highlightedButtonId === b.id && showResizeHandles ? (
                        <g className="preview__resizeHandles">
                            <circle className="preview__resizeHandle preview__resizeHandle--e" cx={b.xMm + b.wMm} cy={b.yMm + b.hMm / 2} r={1.2} data-button-id={b.id} data-resize="e" />
                            <circle className="preview__resizeHandle preview__resizeHandle--s" cx={b.xMm + b.wMm / 2} cy={b.yMm + b.hMm} r={1.2} data-button-id={b.id} data-resize="s" />
                            <circle className="preview__resizeHandle preview__resizeHandle--se" cx={b.xMm + b.wMm} cy={b.yMm + b.hMm} r={1.4} data-button-id={b.id} data-resize="se" />
                        </g>
                    ) : null;
                const buttonGuides = showGuides ? (
                    <g opacity={0.25}>
                        <line x1={buttonCx} y1={b.yMm} x2={buttonCx} y2={b.yMm + b.hMm} stroke="black" strokeWidth="0.2" />
                        <line x1={b.xMm} y1={buttonCy} x2={b.xMm + b.wMm} y2={buttonCy} stroke="black" strokeWidth="0.2" />
                    </g>
                ) : null;

                if (n === 0) {
                    return (
                        <g key={b.id}>
                            {fill}
                            {outline}
                            {highlight}
                            {buttonGuides}
                            {hitTarget}
                            {handles}
                        </g>
                    );
                }

                if (n === 1) {
                    const tap = activeTaps[0];
                    const iconMm = autoIconSizing ? Math.max(5, Math.min(10, b.wMm - 2, b.hMm - 2)) : fixedIconMm;

                    const shouldShowMarker = tap !== "single" || showTapMarkersAlways;

                    if (shouldShowMarker) {
                        const { markerMm, gapMm } = getMarkerSizing(iconMm, autoIconSizing);
                        const groupH = iconMm + gapMm + markerMm;
                        const topY = b.yMm + (b.hMm - groupH) / 2;
                        const markerColor = tapMarkerColorMode === "icon" ? iconColors[tap] ?? iconColor : "black";
                        const renderedIcon = renderHaIconAtMm({
                            icon: cfg[tap]!,
                            cx: buttonCx,
                            cy: topY + iconMm / 2,
                            iconMm,
                            strike: state.buttonConfigs[b.id]?.strike?.[tap] ?? false,
                            color: iconColors[tap] ?? iconColor,
                            strikeBgColor,
                        });
                        const fallbackIcon = showMissingIconPlaceholder ? (
                            <g fill="#b0b0b0">
                                <circle cx={buttonCx - iconMm * 0.2} cy={topY + iconMm / 2} r={iconMm * 0.08} />
                                <circle cx={buttonCx} cy={topY + iconMm / 2} r={iconMm * 0.08} />
                                <circle cx={buttonCx + iconMm * 0.2} cy={topY + iconMm / 2} r={iconMm * 0.08} />
                            </g>
                        ) : null;

                        return (
                            <g key={b.id}>
                                {fill}
                                {outline}
                                {highlight}
                                {buttonGuides}
                                {renderedIcon ?? fallbackIcon}
                                <g transform={`translate(${buttonCx}, ${topY + iconMm + gapMm + markerMm / 2})`}>
                                    <TapMarker tap={tap} sizeMm={markerMm} fillMode={tapMarkerFill} color={markerColor} />
                                </g>
                                {hitTarget}
                                {handles}
                            </g>
                        );
                    }

                    const renderedIcon = renderHaIconAtMm({
                        icon: cfg[tap]!,
                        cx: buttonCx,
                        cy: buttonCy,
                        iconMm,
                        strike: state.buttonConfigs[b.id]?.strike?.[tap] ?? false,
                        color: iconColors[tap] ?? iconColor,
                        strikeBgColor,
                    });
                    const fallbackIcon = showMissingIconPlaceholder ? (
                        <g fill="#b0b0b0">
                            <circle cx={buttonCx - iconMm * 0.2} cy={buttonCy} r={iconMm * 0.08} />
                            <circle cx={buttonCx} cy={buttonCy} r={iconMm * 0.08} />
                            <circle cx={buttonCx + iconMm * 0.2} cy={buttonCy} r={iconMm * 0.08} />
                        </g>
                    ) : null;
                    return (
                        <g key={b.id}>
                            {fill}
                            {outline}
                            {highlight}
                            {buttonGuides}
                            {renderedIcon ?? fallbackIcon}
                            {hitTarget}
                            {handles}
                        </g>
                    );
                }

                const colW = b.wMm / n;
                const iconMm = autoIconSizing ? Math.max(5, Math.min(9, colW - 2, b.hMm - 3 - 1 - 2)) : Math.min(fixedIconMm, colW - 2);
                const { markerMm, gapMm } = getMarkerSizing(iconMm, autoIconSizing);

                const groupH = iconMm + gapMm + markerMm;
                const topY = b.yMm + (b.hMm - groupH) / 2;

                return (
                    <g key={b.id}>
                        {fill}
                        {outline}
                        {highlight}
                        {buttonGuides}

                        {showTapDividers &&
                            Array.from({ length: n - 1 }).map((_, i) => {
                                const x = b.xMm + colW * (i + 1);
                                return <line key={i} x1={x} y1={b.yMm + 0.8} x2={x} y2={b.yMm + b.hMm - 0.8} stroke="black" strokeWidth="0.2" opacity={0.6} />;
                            })}

                        {activeTaps.map((tap, i) => {
                            const cx = b.xMm + colW * (i + 0.5);
                            const markerColor = tapMarkerColorMode === "icon" ? iconColors[tap] ?? iconColor : "black";
                            const renderedIcon = renderHaIconAtMm({
                                icon: cfg[tap]!,
                                cx,
                                cy: topY + iconMm / 2,
                                iconMm,
                                strike: state.buttonConfigs[b.id]?.strike?.[tap] ?? false,
                                color: iconColors[tap] ?? iconColor,
                                strikeBgColor,
                            });
                            const fallbackIcon = showMissingIconPlaceholder ? (
                                <g fill="#b0b0b0">
                                    <circle cx={cx - iconMm * 0.2} cy={topY + iconMm / 2} r={iconMm * 0.08} />
                                    <circle cx={cx} cy={topY + iconMm / 2} r={iconMm * 0.08} />
                                    <circle cx={cx + iconMm * 0.2} cy={topY + iconMm / 2} r={iconMm * 0.08} />
                                </g>
                            ) : null;
                            return (
                                <g key={tap}>
                                    {renderedIcon ?? fallbackIcon}
                                    <g transform={`translate(${cx}, ${topY + iconMm + gapMm + markerMm / 2})`}>
                                        <TapMarker tap={tap} sizeMm={markerMm} fillMode={tapMarkerFill} color={markerColor} />
                                    </g>
                                </g>
                            );
                        })}
                        {hitTarget}
                        {handles}
                    </g>
                );
            })}

            {showCutouts &&
                template.cutoutElements?.map((element, index) => {
                    const fill = element.fill ?? "white";
                    const stroke = element.stroke ?? "#6f6f6f";
                    const strokeWidthMm = typeof element.strokeWidthMm === "number" ? element.strokeWidthMm : 0.3;
                    const opacity = typeof element.opacity === "number" ? element.opacity : 1;
                    const highlightStroke = "#1f9a8a";
                    const highlightWidth = 0.6;
                    const isHighlighted = highlightedCutoutIndex === index;
                    const showHandles = isHighlighted && showResizeHandles;

                    if (element.kind === "circle") {
                        return (
                            <g key={`cutout-${index}`}>
                                <circle cx={element.cxMm} cy={element.cyMm} r={element.rMm} fill={fill} stroke={stroke} strokeWidth={strokeWidthMm} opacity={opacity} pointerEvents="none" />
                                {isHighlighted ? <circle cx={element.cxMm} cy={element.cyMm} r={element.rMm} fill="none" stroke={highlightStroke} strokeWidth={highlightWidth} pointerEvents="none" /> : null}
                                {showHandles ? <circle className="preview__resizeHandle preview__resizeHandle--e" cx={element.cxMm + element.rMm} cy={element.cyMm} r={1.2} data-cutout-index={index} data-cutout-kind="circle" data-resize="r" /> : null}
                                <circle className="preview__cutoutHit" cx={element.cxMm} cy={element.cyMm} r={element.rMm} fill="transparent" stroke="none" pointerEvents="all" data-cutout-index={index} data-cutout-kind="circle" />
                            </g>
                        );
                    }

                    const radii = getCutoutRadiiMm(element);
                    if (isUniformRadii(radii)) {
                        return (
                            <g key={`cutout-${index}`}>
                                <rect x={element.xMm} y={element.yMm} width={element.wMm} height={element.hMm} rx={radii.tl} fill={fill} stroke={stroke} strokeWidth={strokeWidthMm} opacity={opacity} pointerEvents="none" />
                                {isHighlighted ? <rect x={element.xMm} y={element.yMm} width={element.wMm} height={element.hMm} rx={radii.tl} fill="none" stroke={highlightStroke} strokeWidth={highlightWidth} pointerEvents="none" /> : null}
                                {showHandles ? (
                                    <g className="preview__resizeHandles">
                                        <circle className="preview__resizeHandle preview__resizeHandle--e" cx={element.xMm + element.wMm} cy={element.yMm + element.hMm / 2} r={1.2} data-cutout-index={index} data-cutout-kind="rect" data-resize="e" />
                                        <circle className="preview__resizeHandle preview__resizeHandle--s" cx={element.xMm + element.wMm / 2} cy={element.yMm + element.hMm} r={1.2} data-cutout-index={index} data-cutout-kind="rect" data-resize="s" />
                                        <circle className="preview__resizeHandle preview__resizeHandle--se" cx={element.xMm + element.wMm} cy={element.yMm + element.hMm} r={1.4} data-cutout-index={index} data-cutout-kind="rect" data-resize="se" />
                                    </g>
                                ) : null}
                                <rect className="preview__cutoutHit" x={element.xMm} y={element.yMm} width={element.wMm} height={element.hMm} rx={radii.tl} fill="transparent" stroke="none" pointerEvents="all" data-cutout-index={index} data-cutout-kind="rect" />
                            </g>
                        );
                    }

                    return (
                        <g key={`cutout-${index}`}>
                            <path d={roundedRectPath(element.xMm, element.yMm, element.wMm, element.hMm, radii)} fill={fill} stroke={stroke} strokeWidth={strokeWidthMm} opacity={opacity} pointerEvents="none" />
                            {isHighlighted ? <path d={roundedRectPath(element.xMm, element.yMm, element.wMm, element.hMm, radii)} fill="none" stroke={highlightStroke} strokeWidth={highlightWidth} pointerEvents="none" /> : null}
                            {showHandles ? (
                                <g className="preview__resizeHandles">
                                    <circle className="preview__resizeHandle preview__resizeHandle--e" cx={element.xMm + element.wMm} cy={element.yMm + element.hMm / 2} r={1.2} data-cutout-index={index} data-cutout-kind="rect" data-resize="e" />
                                    <circle className="preview__resizeHandle preview__resizeHandle--s" cx={element.xMm + element.wMm / 2} cy={element.yMm + element.hMm} r={1.2} data-cutout-index={index} data-cutout-kind="rect" data-resize="s" />
                                    <circle className="preview__resizeHandle preview__resizeHandle--se" cx={element.xMm + element.wMm} cy={element.yMm + element.hMm} r={1.4} data-cutout-index={index} data-cutout-kind="rect" data-resize="se" />
                                </g>
                            ) : null}
                            <path className="preview__cutoutHit" d={roundedRectPath(element.xMm, element.yMm, element.wMm, element.hMm, radii)} fill="transparent" stroke="none" pointerEvents="all" data-cutout-index={index} data-cutout-kind="rect" />
                        </g>
                    );
                })}

            {wmEnabled ? (
                <g opacity={wmOpacity} pointerEvents="none">
                    <text x={template.widthMm / 2} y={template.heightMm / 2} textAnchor="middle" dominantBaseline="middle" fontSize={Math.max(6, Math.min(18, template.widthMm / 4))} fontFamily="system-ui, -apple-system, BlinkMacSystemFont, sans-serif" fill="black" transform={`rotate(-30 ${template.widthMm / 2} ${template.heightMm / 2})`}>
                        {watermarkText}
                    </text>
                </g>
            ) : null}

            {showScaleBar ? (
                <g pointerEvents="none">
                    {/* 1 cm scale bar (10 mm). Verify print scale. */}
                    {(() => {
                        // Place the bar 6mm below the remote (requested: extra spacing)
                        const y = template.heightMm + 6;
                        return (
                            <>
                                <line x1={2} y1={y} x2={12} y2={y} stroke="black" strokeWidth={0.4} strokeLinecap="round" />
                                {/* end ticks */}
                                <line x1={2} y1={y - 1.5} x2={2} y2={y + 1.5} stroke="black" strokeWidth={0.4} />
                                <line x1={12} y1={y - 1.5} x2={12} y2={y + 1.5} stroke="black" strokeWidth={0.4} />
                                <text x={2} y={y - 2.4} textAnchor="start" fontSize={2.6} fontFamily="system-ui, -apple-system, BlinkMacSystemFont, sans-serif" fill="black">
                                    1 cm — print check
                                </text>
                            </>
                        );
                    })()}
                </g>
            ) : null}
        </svg>
    );
}
