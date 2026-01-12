import React from "react";
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

export function renderHaIconAtMm({ icon, cx, cy, iconMm }: { icon: string; cx: number; cy: number; iconMm: number }) {
    // MDI (24x24)
    if (icon.startsWith("mdi:")) {
        if (!getMdiPath(icon)) return null;
        return (
            <g
                transform={`
          translate(${cx}, ${cy})
          translate(${-iconMm / 2}, ${-iconMm / 2})
          scale(${iconMm / 24})
        `}
                fill="black"
            >
                <MdiPath name={icon} />
            </g>
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

        return (
            <g
                transform={`
          translate(${cx}, ${cy})
          translate(${-iconMm / 2}, ${-iconMm / 2})
          scale(${sx} ${sy})
          translate(${-vb.minX} ${-vb.minY})
        `}
                // DO NOT force fill/stroke; let the SVG define it.
                dangerouslySetInnerHTML={{ __html: inner }}
            />
        );
    }

    return null;
}
