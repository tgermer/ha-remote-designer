import type { TapType, DesignOptions } from "./types";

export type RemoteId = "hue_dimmer_v1" | "hue_dimmer_v2" | "ikea_bilresa_dual_switch" | "aqara_w100" | "HM-PB-6-WM55" | "tuya_ts0044" | "enocean_ptm_215ze" | "generic";

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

export type PreviewElement = {
    kind: "rect";
    xMm: number;
    yMm: number;
    wMm: number;
    hMm: number;
    rMm?: number;
    r?: CornerRadiiMm;
    fill?: string;
    stroke?: string;
    strokeWidthMm?: number;
    opacity?: number;
};

export type CutoutElement =
    | {
          kind: "rect";
          xMm: number;
          yMm: number;
          wMm: number;
          hMm: number;
          rMm?: number;
          r?: CornerRadiiMm;
          fill?: string;
          stroke?: string;
          strokeWidthMm?: number;
          opacity?: number;
      }
    | {
          kind: "circle";
          cxMm: number;
          cyMm: number;
          rMm: number;
          fill?: string;
          stroke?: string;
          strokeWidthMm?: number;
          opacity?: number;
      };

export type RemoteExample = {
    id: string;
    name: string;
    description?: string;
    tapsEnabled: TapType[];
    buttonIcons: Record<string, Partial<Record<TapType, string>>>;
    buttonStrike?: Record<string, Partial<Record<TapType, boolean>>>;
    options?: Partial<DesignOptions>;
};

export type RemoteTemplate = {
    id: RemoteId;
    name: string;
    description?: string;
    isDraft?: boolean;
    isStickerSheet?: boolean;
    productIds?: string[];
    links?: { label: string; url: string }[];
    widthMm: number;
    heightMm: number;
    cornerMm: number;
    buttons: ButtonDef[];
    previewElements?: PreviewElement[];
    cutoutElements?: CutoutElement[];

    examples?: RemoteExample[];
    defaultExampleId?: string;
};

// v2: placeholder values – measure and adjust later
export const REMOTES: RemoteTemplate[] = [
    {
        id: "generic",
        name: "Generic Sticker Sheet",
        description: "For generic label sheets, e.g. suitable for Aqara Cube sides.",
        isDraft: false,
        isStickerSheet: true,
        widthMm: 210,
        heightMm: 297,
        cornerMm: 0,
        buttons: [],
    },
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
                options: {
                    showTapMarkersAlways: false,
                    showTapDividers: false,
                },
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
        examples: [
            {
                id: "factory",
                name: "Factory labels",
                description: "Default labeling matching the physical Hue dimmer switch v2",
                tapsEnabled: ["single"],
                options: {
                    showTapMarkersAlways: false,
                    showTapDividers: false,
                },
                buttonIcons: {
                    on: { single: "mdi:power" },
                    up: { single: "mdi:weather-sunset-up" },
                    down: { single: "mdi:weather-sunset-down" },
                    hue: { single: "hue:logo" },
                },
            },
        ],
        defaultExampleId: "factory",
    },
    {
        id: "ikea_bilresa_dual_switch",
        name: "IKEA BILRESA Dual Switch",
        // Placeholder measurements — adjust after measuring the real device
        widthMm: 40,
        heightMm: 70,
        cornerMm: 20,
        cutoutElements: [
            {
                kind: "circle",
                cxMm: 20,
                cyMm: 35,
                rMm: 2,
                stroke: "#6f6f6f",
                strokeWidthMm: 0.3,
            },
        ],
        buttons: [
            // Top rocker: outer corners rounded, bottom corners square
            { id: "top", xMm: 3, yMm: 3, wMm: 34, hMm: 32.25, r: { tl: 40, tr: 40, br: 0, bl: 0 } },

            // Bottom rocker: outer corners rounded, top corners square
            { id: "bottom", xMm: 3, yMm: 35.25, wMm: 34, hMm: 32.25, r: { tl: 0, tr: 0, br: 40, bl: 40 } },
        ],
        examples: [
            {
                id: "bilresa_scene_light",
                name: "Scenes & Light Control",
                description: "Single tap for automatic lighting, long press for scenes and accent lighting",
                tapsEnabled: ["single", "long"],
                buttonIcons: {
                    top: {
                        single: "mdi:lightbulb-auto",
                        long: "mdi:palette",
                    },
                    bottom: {
                        single: "mdi:lightbulb-off-outline",
                        long: "hue:ensis",
                    },
                },
                buttonStrike: {
                    bottom: {
                        long: true,
                    },
                },
                options: {
                    showTapMarkersAlways: false,
                    showTapDividers: true,
                    showRemoteOutline: true,
                    showButtonOutlines: true,
                    autoIconSizing: true,
                    fixedIconMm: 8,
                    tapMarkerFill: "outline",
                    labelOutlineColor: "#757575",
                },
            },
        ],
    },
    {
        id: "aqara_w100",
        name: "Aqara Climate Sensor W100",
        // Placeholder measurements — adjust after measuring the real device
        widthMm: 82,
        heightMm: 82,
        cornerMm: 12,
        previewElements: [
            {
                kind: "rect",
                xMm: 4,
                yMm: 4,
                wMm: 52,
                hMm: 74,
                r: { tl: 10, tr: 6, br: 6, bl: 12 },
                fill: "#e6e6e6",
                stroke: "#c8c8c8",
                strokeWidthMm: 0.2,
            },
        ],
        buttons: [
            // Top rocker: outer corners rounded, bottom corners square
            { id: "plus", xMm: 61, yMm: 3, wMm: 17, hMm: 25, r: { tl: 0, tr: 10, br: 0, bl: 0 } },

            { id: "center", xMm: 61, yMm: 28.5, wMm: 17, hMm: 25, r: { tl: 0, tr: 0, br: 0, bl: 0 } },

            // Bottom rocker: outer corners rounded, top corners square
            { id: "minus", xMm: 61, yMm: 54, wMm: 17, hMm: 25, r: { tl: 0, tr: 0, br: 10, bl: 0 } },
        ],
        examples: [
            {
                id: "factory",
                name: "Factory labels",
                description: "Default labeling matching the physical Aquara W100",
                tapsEnabled: ["single"],
                options: {
                    showTapMarkersAlways: false,
                    showTapDividers: false,
                },
                buttonIcons: {
                    plus: { single: "mdi:plus" },
                    minus: { single: "mdi:minus" },
                },
            },
            {
                id: "office",
                name: "Office Switch",
                description: "Desk lighting control with brightness, color scenes and full off.",
                tapsEnabled: ["single", "long"],
                options: {
                    showTapMarkersAlways: false,
                    showTapDividers: true,
                },
                buttonIcons: {
                    plus: { single: "mdi:plus", long: "mdi:palette" },
                    center: { single: "mdi:desk", long: "mdi:desk" },
                    minus: { single: "mdi:lightbulb-group-off-outline" },
                },
                buttonStrike: {
                    minus: {
                        long: true,
                    },
                },
            },
        ],
        defaultExampleId: "factory",
    },
    {
        id: "HM-PB-6-WM55",
        name: "Homematic Funk-Wandsender 6fach",
        // Placeholder measurements — adjust after measuring the real device
        widthMm: 55,
        heightMm: 55,
        cornerMm: 2,
        buttons: [
            { id: "top_left", xMm: 15.5, yMm: 4, wMm: 12, hMm: 14, rMm: 0 },
            { id: "top_right", xMm: 27.5, yMm: 4, wMm: 12, hMm: 14, rMm: 0 },

            { id: "center_left", xMm: 15.5, yMm: 18.33, wMm: 12, hMm: 19, rMm: 0 },
            { id: "center_right", xMm: 27.5, yMm: 18.33, wMm: 12, hMm: 19, rMm: 0 },

            { id: "bottom_left", xMm: 15.5, yMm: 37, wMm: 12, hMm: 14, rMm: 0 },
            { id: "bottom_right", xMm: 27.5, yMm: 37, wMm: 12, hMm: 14, rMm: 0 },
        ],
        examples: [
            {
                id: "candy1",
                name: "Home Automation Master Switch",
                description: "Master switch to control all major home functions: light groups on/off, windows, pool and day/night scenes.",
                tapsEnabled: ["single"],

                buttonIcons: {
                    top_left: { single: "mdi:lightbulb-group-outline" },
                    top_right: { single: "mdi:lightbulb-group-off-outline" },
                    center_left: { single: "mdi:window-closed-variant" },
                    center_right: { single: "mdi:pool" },
                    bottom_left: { single: "mdi:weather-sunny" },
                    bottom_right: { single: "mdi:weather-night" },
                },

                options: {
                    showTapMarkersAlways: false,
                    showTapDividers: true,
                    showRemoteOutline: true,
                    showButtonOutlines: true,
                    showGuides: false,
                    autoIconSizing: false,
                    fixedIconMm: 6.5,
                    tapMarkerFill: "outline",
                    labelOutlineColor: "#464646",
                    labelOutlineStrokeMm: 0.2,
                    // showScaleBar: false, // meist nicht als Example speichern
                },
            },
        ],
    },
    {
        id: "tuya_ts0044",
        name: "MOES 4 Button Scene (TS0044)",
        isDraft: true,
        productIds: ["TS0044"],
        links: [
            { label: "Zigbee2MQTT", url: "https://www.zigbee2mqtt.io/devices/TS0044.html" },
            // { label: "Manufacturer", url: "https://moeshouse.com/products/zigbee-4-gang-scene-remote" },
            // { label: "Manual", url: "https://qistore.ru/instructions/ESW-0ZAA-EU.pdf" }
        ],
        // Placeholder measurements — adjust after measuring the real device
        widthMm: 86,
        heightMm: 86,
        cornerMm: 6,
        cutoutElements: [
            { kind: "rect", xMm: 18.3, yMm: 40.3, wMm: 10.2, hMm: 1.5, rMm: 0, fill: "#cccccc", stroke: "none" },
            { kind: "rect", xMm: 57.45, yMm: 40.3, wMm: 10.2, hMm: 1.5, rMm: 0, fill: "#cccccc", stroke: "none" },
            { kind: "rect", xMm: 18.3, yMm: 78, wMm: 10.2, hMm: 1.5, rMm: 0, fill: "#cccccc", stroke: "none" },
            { kind: "rect", xMm: 57.45, yMm: 78, wMm: 10.2, hMm: 1.5, rMm: 0, fill: "#cccccc", stroke: "none" },
        ],
        buttons: [
            { id: "top_left", xMm: 3.8, yMm: 3.9, wMm: 39.2, hMm: 37.9, r: { tl: 4, tr: 0, br: 0, bl: 0 } },
            { id: "top_right", xMm: 43, yMm: 3.9, wMm: 39.1, hMm: 37.9, r: { tl: 0, tr: 4, br: 0, bl: 0 } },
            { id: "bottom_left", xMm: 3.8, yMm: 41.8, wMm: 39.2, hMm: 37.7, r: { tl: 0, tr: 0, br: 0, bl: 4 } },
            { id: "bottom_right", xMm: 43, yMm: 41.8, wMm: 39.1, hMm: 37.7, r: { tl: 0, tr: 0, br: 4, bl: 0 } },
        ],
        examples: [
            {
                id: "default",
                name: "Groups & Scene",
                description: "Single tap: group on/off on the left, scene on the right.",
                tapsEnabled: ["single"],
                buttonIcons: {
                    top_left: { single: "mdi:lightbulb-group" },
                    bottom_left: { single: "mdi:lightbulb-group-off-outline" },
                    top_right: { single: "mdi:palette" },
                    bottom_right: { single: "mdi:lightbulb-outline" },
                },
                options: {
                    showTapMarkersAlways: false,
                    showTapDividers: true,
                    showRemoteOutline: true,
                    showButtonOutlines: true,
                    showGuides: false,
                    autoIconSizing: true,
                    fixedIconMm: 6.5,
                    tapMarkerFill: "outline",
                    labelOutlineColor: "#464646",
                    labelOutlineStrokeMm: 0.2,
                    // showScaleBar: false, // meist nicht als Example speichern
                },
            },
        ],
        defaultExampleId: "default",
    },
    {
        id: "enocean_ptm_215ze",
        name: "EnOcean PTM 215ZE (module)",
        isDraft: true,
        productIds: ["PTM 215ZE", "PTM 215Z"],
        links: [{ label: "Zigbee2MQTT", url: "https://www.zigbee2mqtt.io/devices/PTM_215ZE.html" }],
        // Placeholder measurements — depends on the chosen rocker/faceplate
        widthMm: 86,
        heightMm: 86,
        cornerMm: 4,
        buttons: [
            { id: "top_left", xMm: 8, yMm: 8, wMm: 32, hMm: 32, rMm: 2 },
            { id: "bottom_left", xMm: 8, yMm: 46, wMm: 32, hMm: 32, rMm: 2 },
            { id: "top_right", xMm: 46, yMm: 8, wMm: 32, hMm: 32, rMm: 2 },
            { id: "bottom_right", xMm: 46, yMm: 46, wMm: 32, hMm: 32, rMm: 2 },
        ],
        examples: [
            {
                id: "default",
                name: "Module placeholder",
                description: "Layout depends on the chosen rocker/cover.",
                tapsEnabled: ["single", "double", "long"],
                buttonIcons: {
                    top_left: { single: "mdi:roller-shade" },
                    bottom_left: { single: "mdi:roller-shade-closed" },
                    top_right: { single: "mdi:arrow-up" },
                    bottom_right: { single: "mdi:arrow-down" },
                },
                options: {
                    showTapMarkersAlways: false,
                    showTapDividers: true,
                    showRemoteOutline: true,
                    showButtonOutlines: true,
                    showGuides: false,
                    autoIconSizing: true,
                    fixedIconMm: 6.5,
                    tapMarkerFill: "outline",
                    labelOutlineColor: "#464646",
                    labelOutlineStrokeMm: 0.2,
                    // showScaleBar: false, // meist nicht als Example speichern
                },
            },
        ],
        defaultExampleId: "default",
    },
];
