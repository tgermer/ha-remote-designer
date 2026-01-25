import type { ButtonDef, RemoteTemplate } from "../app/remotes";
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

function isUniformRadii(r: CornerRadii) {
    return r.tl === r.tr && r.tr === r.br && r.br === r.bl;
}

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

    const h = sizeMm * 0.7;
    const w = sizeMm * 2.3;
    return <rect x={-w / 2} y={-h / 2} width={w} height={h} rx={h / 2} fill={fill} stroke="black" strokeWidth={stroke} />;
}

export function RemoteSvg({ template, state, overrides, exportMode, showWatermark, watermarkText, watermarkOpacity, background, onSelectButton }: { template: RemoteTemplate; state: DesignState; overrides?: Partial<DesignState["options"]>; exportMode?: { squareButtons?: boolean }; showWatermark?: boolean; watermarkText?: string; watermarkOpacity?: number; background?: "white" | "remote" | "transparent"; onSelectButton?: (buttonId: string) => void }) {
    const options = { ...state.options, ...overrides };
    const { showTapMarkersAlways, showTapDividers, showRemoteOutline, showButtonOutlines, showGuides, autoIconSizing, fixedIconMm, tapMarkerFill } = options;

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

            {template.buttons.map((b) => {
                const cfg = state.buttonConfigs[b.id]?.icons ?? {};
                const activeTaps = TAP_ORDER.filter((t) => enabledTaps.includes(t) && !!cfg[t]);
                const n = activeTaps.length;

                const buttonCx = b.xMm + b.wMm / 2;
                const buttonCy = b.yMm + b.hMm / 2;

                const radii = getButtonRadiiMm(b, exportMode?.squareButtons);

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
                            onClick={() => onSelectButton(b.id)}
                        />
                    ) : (
                        <path
                            className="preview__buttonHit"
                            d={roundedRectPath(hitX, hitY, hitW, hitH, hitRadii)}
                            fill="transparent"
                            stroke="none"
                            pointerEvents="all"
                            onClick={() => onSelectButton(b.id)}
                        />
                    )
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
                            {outline}
                            {buttonGuides}
                            {hitTarget}
                        </g>
                    );
                }

                if (n === 1) {
                    const tap = activeTaps[0];
                    const iconMm = autoIconSizing ? Math.max(5, Math.min(10, b.wMm - 2, b.hMm - 2)) : fixedIconMm;

                    const shouldShowMarker = tap !== "single" || showTapMarkersAlways;

                    if (shouldShowMarker) {
                        const markerMm = 3;
                        const gapMm = 1;
                        const groupH = iconMm + gapMm + markerMm;
                        const topY = b.yMm + (b.hMm - groupH) / 2;

                        return (
                            <g key={b.id}>
                                {outline}
                                {buttonGuides}
                                {renderHaIconAtMm({
                                    icon: cfg[tap]!,
                                    cx: buttonCx,
                                    cy: topY + iconMm / 2,
                                    iconMm,
                                    strike: state.buttonConfigs[b.id]?.strike?.[tap] ?? false,
                                })}
                                <g transform={`translate(${buttonCx}, ${topY + iconMm + gapMm + markerMm / 2})`}>
                                    <TapMarker tap={tap} fillMode={tapMarkerFill} />
                                </g>
                                {hitTarget}
                            </g>
                        );
                    }

                    return (
                        <g key={b.id}>
                            {outline}
                            {buttonGuides}
                            {renderHaIconAtMm({
                                icon: cfg[tap]!,
                                cx: buttonCx,
                                cy: buttonCy,
                                iconMm,
                                strike: state.buttonConfigs[b.id]?.strike?.[tap] ?? false,
                            })}
                            {hitTarget}
                        </g>
                    );
                }

                const colW = b.wMm / n;
                const markerMm = 3;
                const gapMm = 1;
                const iconMm = autoIconSizing ? Math.max(5, Math.min(9, colW - 2, b.hMm - markerMm - gapMm - 2)) : Math.min(fixedIconMm, colW - 2);

                const groupH = iconMm + gapMm + markerMm;
                const topY = b.yMm + (b.hMm - groupH) / 2;

                return (
                    <g key={b.id}>
                        {outline}
                        {buttonGuides}

                        {showTapDividers &&
                            Array.from({ length: n - 1 }).map((_, i) => {
                                const x = b.xMm + colW * (i + 1);
                                return <line key={i} x1={x} y1={b.yMm + 0.8} x2={x} y2={b.yMm + b.hMm - 0.8} stroke="black" strokeWidth="0.2" opacity={0.6} />;
                            })}

                        {activeTaps.map((tap, i) => {
                            const cx = b.xMm + colW * (i + 0.5);
                            return (
                                <g key={tap}>
                                    {renderHaIconAtMm({
                                        icon: cfg[tap]!,
                                        cx,
                                        cy: topY + iconMm / 2,
                                        iconMm,
                                        strike: state.buttonConfigs[b.id]?.strike?.[tap] ?? false,
                                    })}
                                    <g transform={`translate(${cx}, ${topY + iconMm + gapMm + markerMm / 2})`}>
                                        <TapMarker tap={tap} fillMode={tapMarkerFill} />
                                    </g>
                                </g>
                            );
                        })}
                        {hitTarget}
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
