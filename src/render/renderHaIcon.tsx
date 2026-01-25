import { getMdiPath } from "../app/mdi";
import { MdiPath } from "../components/Icon";
import { getHueSvg, hasHueIcon, isHueEnabled, isHueIcon } from "../hue/hueIcons";

type ViewBox = { minX: number; minY: number; w: number; h: number };

function parseViewBox(svg: string): ViewBox {
    const m = svg.match(/viewBox\s*=\s*"([^"]+)"/i);
    if (!m) return { minX: 0, minY: 0, w: 24, h: 24 };
    const parts = m[1].trim().split(/\s+/).map(Number);
    if (parts.length !== 4 || parts.some((n) => Number.isNaN(n))) return { minX: 0, minY: 0, w: 24, h: 24 };
    return { minX: parts[0], minY: parts[1], w: parts[2], h: parts[3] };
}

function stripOuterSvg(svg: string): string {
    return svg
        .replace(/^[\s\S]*?<svg[^>]*>/i, "")
        .replace(/<\/svg>\s*$/i, "")
        .trim();
}

export function isSupportedHaIcon(icon: string): boolean {
    if (icon.startsWith("mdi:")) return !!getMdiPath(icon);
    if (isHueEnabled() && isHueIcon(icon)) return hasHueIcon(icon);
    return false;
}

export function renderHaIconAtMm({
    icon,
    cx,
    cy,
    iconMm,
    strike,
    color,
    strikeBgColor,
}: {
    icon: string;
    cx: number;
    cy: number;
    iconMm: number;
    strike?: boolean;
    color?: string;
    strikeBgColor?: string;
}) {
    // MDI (24x24)
    const strikeColor = color || "black";
    const highlightColor = strikeBgColor || "white";
    const strikeOverlay = strike ? (
        <>
            {(() => {
                // Mirrored (top-left -> bottom-right) and slightly shorter than the full icon box.
                const d = iconMm * 0.42;
                const x1 = cx - d;
                const y1 = cy - d;
                const x2 = cx + d;
                const y2 = cy + d;

                // Offset a parallel white highlight to the "right" side of the diagonal.
                // For a (1,1) direction line, the right-side perpendicular is (1,-1).
                const off = iconMm * 0.06;
                const ox = off / Math.SQRT2;
                const oy = -off / Math.SQRT2;

                const blackW = iconMm * 0.085;
                const whiteW = iconMm * 0.085;

                return (
                    <>
                        {/* white highlight line (parallel, offset) */}
                        <line x1={x1 + ox} y1={y1 + oy} x2={x2 + ox} y2={y2 + oy} stroke={highlightColor} strokeWidth={whiteW} strokeLinecap="butt" />
                        {/* black strike line */}
                        <line x1={x1} y1={y1} x2={x2} y2={y2} stroke={strikeColor} strokeWidth={blackW} strokeLinecap="butt" />
                    </>
                );
            })()}
        </>
    ) : null;
    if (icon.startsWith("mdi:")) {
        if (!getMdiPath(icon)) return null;
        const fill = color || "black";
        return (
            <>
                <g
                    transform={`
        translate(${cx}, ${cy})
        translate(${-iconMm / 2}, ${-iconMm / 2})
        scale(${iconMm / 24})
      `}
                    fill={fill}
                >
                    <MdiPath name={icon} />
                </g>

                {strikeOverlay}
            </>
        );
    }

    // Hue (preserve original svg styling as much as possible)
    if (isHueEnabled() && isHueIcon(icon)) {
        const svg = getHueSvg(icon);
        if (!svg) return null;

        const vb = parseViewBox(svg);
        const inner = stripOuterSvg(svg);

        const sx = iconMm / vb.w;
        const sy = iconMm / vb.h;

        const hueStyle = color ? { color, fill: color, stroke: color } : undefined;
        return (
            <>
                <g
                    transform={`
        translate(${cx}, ${cy})
        translate(${-iconMm / 2}, ${-iconMm / 2})
        scale(${sx} ${sy})
        translate(${-vb.minX} ${-vb.minY})
      `}
                    style={hueStyle}
                    dangerouslySetInnerHTML={{ __html: inner }}
                />

                {strikeOverlay}
            </>
        );
    }

    return null;
}
