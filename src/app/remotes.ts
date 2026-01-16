import type { TapType } from "./types";

export type RemoteId = "hue_dimmer_v1" | "hue_dimmer_v2" | "ikea_bilresa_dual_switch" | "aqara_w100";

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

export type RemoteExample = {
    id: string;
    name: string;
    description?: string;
    tapsEnabled: TapType[];
    buttonIcons: Record<string, Partial<Record<TapType, string>>>;
};

export type RemoteTemplate = {
    id: RemoteId;
    name: string;
    widthMm: number;
    heightMm: number;
    cornerMm: number;
    buttons: ButtonDef[];

    examples?: RemoteExample[];
    defaultExampleId?: string;
};

// v2: placeholder values – measure and adjust later
export const REMOTES: RemoteTemplate[] = [
    {
        id: "hue_dimmer_v1",
        name: "Philips Hue Dimmer Switch (v1)",
        widthMm: 34,
        heightMm: 95,
        cornerMm: 2,
        buttons: [
            // ON: top rounded, bottom square
            { id: "on", xMm: 1.25, yMm: 1.8, wMm: 31.5, hMm: 27, r: { tl: 1.5, tr: 1.5, br: 0, bl: 0 } },

            // UP: square
            { id: "up", xMm: 1.25, yMm: 30.6, wMm: 31.5, hMm: 16, r: { tl: 0, tr: 0, br: 0, bl: 0 } },

            // DOWN: square
            { id: "down", xMm: 1.25, yMm: 48.4, wMm: 31.5, hMm: 16, r: { tl: 0, tr: 0, br: 0, bl: 0 } },

            // OFF: top square, bottom rounded
            { id: "off", xMm: 1.25, yMm: 66.2, wMm: 31.5, hMm: 27, r: { tl: 0, tr: 0, br: 1.5, bl: 1.5 } },
        ],
        examples: [
            {
                id: "factory",
                name: "Factory labels",
                description: "Default labeling matching the physical Hue dimmer switch",
                tapsEnabled: ["single"],
                buttonIcons: {
                    on: { single: "mdi:power" },
                    up: { single: "mdi:plus" },
                    down: { single: "mdi:minus" },
                    off: { single: "mdi:power-off" },
                },
            },
            {
                id: "scene_brightness",
                name: "Scenes & Brightness",
                description: "Single tap for power and brightness, double tap for scenes",
                tapsEnabled: ["single", "double"],
                buttonIcons: {
                    on: {
                        single: "mdi:dots-vertical",
                        double: "mdi:palette", // Scene on / next scene
                    },
                    up: {
                        single: "mdi:brightness-5",
                        double: "mdi:arrow-up-bold", // Faster / jump up
                    },
                    down: {
                        single: "mdi:brightness-4",
                        double: "mdi:arrow-down-bold",
                    },
                    off: {
                        single: "mdi:power-off",
                        double: "mdi:lightbulb-off-outline",
                    },
                },
            },
            {
                id: "home_automation",
                name: "Home automation",
                description: "Turn the room on or off, apply predefined brightness and Kelvin presets, control curtains, or switch off the full room or selected lights",
                tapsEnabled: ["single", "double", "long"],
                buttonIcons: {
                    on: {
                        single: "mdi:lightbulb-group",
                        long: "mdi:lightbulb-on-outline",
                    },
                    up: {
                        single: "mdi:curtains",
                    },
                    down: {
                        single: "mdi:curtains-closed",
                    },
                    off: {
                        single: "mdi:lightbulb-group-off-outline",
                        long: "mdi:lightbulb-off-outline",
                    },
                },
            },
        ],
        defaultExampleId: "factory",
    },
    {
        id: "hue_dimmer_v2",
        name: "Philips Hue Dimmer Switch (v2)",
        widthMm: 34,
        heightMm: 91,
        cornerMm: 5.6,
        buttons: [
            { id: "on", xMm: 0, yMm: 0, wMm: 34, hMm: 28.5, r: { tl: 5.6, tr: 5.6, br: 0, bl: 0 } },
            { id: "up", xMm: 0, yMm: 29.25, wMm: 34, hMm: 16.25, rMm: 0 },
            { id: "down", xMm: 0, yMm: 45.5, wMm: 34, hMm: 16.25, rMm: 0 },
            { id: "hue", xMm: 0, yMm: 62.5, wMm: 34, hMm: 28.5, r: { tl: 0, tr: 0, br: 5.6, bl: 5.6 } },
        ],
    },
    {
        id: "ikea_bilresa_dual_switch",
        name: "IKEA BILRESA Dual Switch",
        // Placeholder measurements — adjust after measuring the real device
        widthMm: 40,
        heightMm: 70,
        cornerMm: 20,
        buttons: [
            // Top rocker: outer corners rounded, bottom corners square
            { id: "top", xMm: 3, yMm: 3, wMm: 34, hMm: 32.25, r: { tl: 40, tr: 40, br: 0, bl: 0 } },

            // Bottom rocker: outer corners rounded, top corners square
            { id: "bottom", xMm: 3, yMm: 35.25, wMm: 34, hMm: 32.25, r: { tl: 0, tr: 0, br: 40, bl: 40 } },
        ],
    },
    {
        id: "aqara_w100",
        name: "Aqara Climate Sensor W100",
        // Placeholder measurements — adjust after measuring the real device
        widthMm: 82,
        heightMm: 82,
        cornerMm: 12,
        buttons: [
            // Top rocker: outer corners rounded, bottom corners square
            { id: "plus", xMm: 61, yMm: 3, wMm: 17, hMm: 25, r: { tl: 0, tr: 10, br: 0, bl: 0 } },

            { id: "center", xMm: 61, yMm: 28.5, wMm: 17, hMm: 25, r: { tl: 0, tr: 0, br: 0, bl: 0 } },

            // Bottom rocker: outer corners rounded, top corners square
            { id: "minus", xMm: 61, yMm: 54, wMm: 17, hMm: 25, r: { tl: 0, tr: 0, br: 10, bl: 0 } },
        ],
    },
];
