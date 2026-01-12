export type RemoteId = "hue_dimmer_v1" | "hue_dimmer_v2";

export type CornerRadiiMm = {
    tl?: number;
    tr?: number;
    br?: number;
    bl?: number;
};

export type ButtonDef = {
    id: string;
    xMm: number;
    yMm: number;
    wMm: number;
    hMm: number;

    // optional uniform radius (fallback)
    rMm?: number;

    // optional per-corner radii (overrides rMm)
    r?: CornerRadiiMm;
};

export type RemoteTemplate = {
    id: RemoteId;
    name: string;
    widthMm: number;
    heightMm: number;
    cornerMm: number;
    buttons: ButtonDef[];
};

// v2: placeholder values – measure and adjust later
export const REMOTES: RemoteTemplate[] = [
    {
        id: "hue_dimmer_v1",
        name: "Philips Hue Dimmer (v1)",
        widthMm: 35,
        heightMm: 95,
        cornerMm: 2,
        buttons: [
            // ON: top rounded, bottom square
            { id: "on", xMm: 1, yMm: 1, wMm: 33, hMm: 28, r: { tl: 1.5, tr: 1.5, br: 0, bl: 0 } },

            // UP: square
            { id: "up", xMm: 1, yMm: 30.25, wMm: 33, hMm: 16.5, r: { tl: 0, tr: 0, br: 0, bl: 0 } },

            // DOWN: square
            { id: "down", xMm: 1, yMm: 48.25, wMm: 33, hMm: 16.5, r: { tl: 0, tr: 0, br: 0, bl: 0 } },

            // OFF: top square, bottom rounded
            { id: "off", xMm: 1, yMm: 66, wMm: 33, hMm: 28, r: { tl: 0, tr: 0, br: 1.5, bl: 1.5 } },
        ],
    },
    {
        id: "hue_dimmer_v2",
        name: "Philips Hue Dimmer (v2)",
        widthMm: 35,
        heightMm: 95,
        cornerMm: 5,
        buttons: [
            { id: "on", xMm: 0, yMm: 0, wMm: 35, hMm: 28, r: { tl: 5, tr: 5, br: 0, bl: 0 } },
            { id: "up", xMm: 0, yMm: 28.5, wMm: 35, hMm: 19, rMm: 0 },
            { id: "down", xMm: 0, yMm: 47.5, wMm: 35, hMm: 19, rMm: 0 },
            { id: "hue", xMm: 0, yMm: 67, wMm: 35, hMm: 28, r: { tl: 0, tr: 0, br: 5, bl: 5 } },
        ],
    },
];
