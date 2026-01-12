import React from "react";
import type { RemoteTemplate } from "../app/remotes";
import type { DesignState, TapType } from "../app/types";
import { renderHaIconAtMm } from "./renderHaIcon";

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

export function RemoteSvg({ template, state, overrides, exportMode }: { template: RemoteTemplate; state: DesignState; overrides?: Partial<DesignState["options"]>; exportMode?: { squareButtons?: boolean } }) {
    const options = { ...state.options, ...overrides };
    const { showTapMarkersAlways, showTapDividers, showRemoteOutline, showButtonOutlines, showGuides, autoIconSizing, fixedIconMm, tapMarkerFill } = options;

    const enabledTaps = state.tapsEnabled.length ? state.tapsEnabled : (["single"] as TapType[]);

    return (
        <svg width={`${template.widthMm}mm`} height={`${template.heightMm}mm`} viewBox={`0 0 ${template.widthMm} ${template.heightMm}`} xmlns="http://www.w3.org/2000/svg">
            {/* Background */}
            <rect x="0" y="0" width={template.widthMm} height={template.heightMm} fill="white" />

            {/* Remote outline */}
            {showRemoteOutline && <rect x="0.2" y="0.2" width={template.widthMm - 0.4} height={template.heightMm - 0.4} rx={template.cornerMm} fill="none" stroke="black" strokeWidth="0.4" />}

            {/* Global guides */}
            {showGuides && (
                <g opacity={0.35}>
                    <line x1={template.widthMm / 2} y1={0} x2={template.widthMm / 2} y2={template.heightMm} stroke="black" strokeWidth="0.2" />
                    <line x1={0} y1={template.heightMm / 2} x2={template.widthMm} y2={template.heightMm / 2} stroke="black" strokeWidth="0.2" />
                </g>
            )}

            {/* Buttons */}
            {template.buttons.map((b) => {
                const cfg = state.buttonConfigs[b.id]?.icons ?? {};
                const activeTaps = enabledTaps.filter((t) => !!cfg[t]);
                const n = activeTaps.length;

                const buttonCx = b.xMm + b.wMm / 2;
                const buttonCy = b.yMm + b.hMm / 2;

                const rx = exportMode?.squareButtons ? 0 : b.r?.tl ?? b.rMm ?? 0;

                const outline = showButtonOutlines ? <rect x={b.xMm} y={b.yMm} width={b.wMm} height={b.hMm} rx={rx} fill="none" stroke="black" strokeWidth="0.25" /> : null;

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
                        </g>
                    );
                }

                // Single icon
                if (n === 1) {
                    const tap = activeTaps[0];
                    const iconMm = autoIconSizing ? Math.max(5, Math.min(10, b.wMm - 2, b.hMm - 2)) : fixedIconMm;

                    if (showTapMarkersAlways) {
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
                                })}
                                <g transform={`translate(${buttonCx}, ${topY + iconMm + gapMm + markerMm / 2})`}>
                                    <TapMarker tap={tap} fillMode={tapMarkerFill} />
                                </g>
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
                            })}
                        </g>
                    );
                }

                // Multiple icons
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
                                    })}
                                    <g transform={`translate(${cx}, ${topY + iconMm + gapMm + markerMm / 2})`}>
                                        <TapMarker tap={tap} fillMode={tapMarkerFill} />
                                    </g>
                                </g>
                            );
                        })}
                    </g>
                );
            })}
        </svg>
    );
}
