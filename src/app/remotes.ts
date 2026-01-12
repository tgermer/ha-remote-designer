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

export const REMOTES: RemoteTemplate[] = [
    {
        id: "hue_dimmer_v1",
        name: "Philips Hue Dimmer (v1)",
        widthMm: 35,
        heightMm: 95,
        cornerMm: 2,
        buttons: [
            // ON: oben rund, unten eckig
            { id: "on", xMm: 1, yMm: 1, wMm: 33, hMm: 28, r: { tl: 2, tr: 2, br: 0, bl: 0 } },

            // UP: komplett eckig
            { id: "up", xMm: 1, yMm: 30, wMm: 33, hMm: 16.5, r: { tl: 0, tr: 0, br: 0, bl: 0 } },

            // DOWN: komplett eckig
            { id: "down", xMm: 1, yMm: 47.5, wMm: 33, hMm: 16.5, r: { tl: 0, tr: 0, br: 0, bl: 0 } },

            // OFF: oben eckig, unten rund
            { id: "off", xMm: 1, yMm: 65, wMm: 33, hMm: 28, r: { tl: 0, tr: 0, br: 2, bl: 2 } },
        ],
    },

    {
        id: "hue_dimmer_v2",
        name: "Philips Hue Dimmer (v2)",
        // Platzhalter – später messen
        widthMm: 35,
        heightMm: 95,
        cornerMm: 5,
        buttons: [
            // V2 hat typischerweise: On, Dim Up, Dim Down, Hue/Scene
            // IDs bewusst "stabil" und sprechend
            { id: "on", xMm: 0, yMm: 0, wMm: 35, hMm: 28.5, r: { tl: 5, tr: 5, br: 0, bl: 0 } },
            { id: "up", xMm: 0, yMm: 28.8, wMm: 35, hMm: 18.5, rMm: 0 },
            { id: "down", xMm: 0, yMm: 47.4, wMm: 35, hMm: 18.5, rMm: 0 },
            { id: "hue", xMm: 0, yMm: 66.2, wMm: 35, hMm: 28.5, r: { tl: 0, tr: 0, br: 5, bl: 5 } },
        ],
    },
];
