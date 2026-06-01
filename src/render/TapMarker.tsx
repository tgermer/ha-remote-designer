import type { TapType } from "../app/types";

type TapMarkerProps = {
    tap: TapType;
    sizeMm?: number;
    fillMode?: "outline" | "filled";
    color?: string;
};

function TapDots({ count, r, fill, color, stroke }: { count: number; r: number; fill: string; color: string; stroke: number }) {
    const gap = Math.max(0.55, r * 0.55);
    const dx = r * 2 + gap;
    const start = -dx * (count - 1) * 0.5;

    return (
        <g>
            {Array.from({ length: count }).map((_, index) => (
                <circle key={index} cx={start + dx * index} cy="0" r={r} fill={fill} stroke={color} strokeWidth={stroke} />
            ))}
        </g>
    );
}

export function TapMarker({ tap, sizeMm = 3, fillMode = "outline", color = "black" }: TapMarkerProps) {
    const stroke = 0.35;
    const r = sizeMm / 2 - stroke;
    const fill = fillMode === "filled" ? color : "none";

    if (tap === "single") {
        return <TapDots count={1} r={r} fill={fill} color={color} stroke={stroke} />;
    }

    if (tap === "double") {
        return <TapDots count={2} r={r} fill={fill} color={color} stroke={stroke} />;
    }

    if (tap === "triple") {
        return <TapDots count={3} r={r} fill={fill} color={color} stroke={stroke} />;
    }

    const h = sizeMm * 0.7;
    const w = sizeMm * 2.3;
    return <rect x={-w / 2} y={-h / 2} width={w} height={h} rx={h / 2} ry={h / 2} fill={fill} stroke={color} strokeWidth={stroke} />;
}
