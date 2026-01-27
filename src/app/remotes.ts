import type { TapType, DesignOptions, DesignState } from "./types";
import { REMOTE_EXAMPLES } from "./remoteExamples";

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
    buttonIconColors?: Record<string, Partial<Record<TapType, string>>>;
    buttonFill?: Record<string, string>;
    options?: Partial<DesignOptions>;
};

export type UserExampleMeta = {
    userExample: true;
    allowGallery: boolean;
    id?: string;
    savedName?: string | null;
    savedId?: string | null;
    exportedAt?: string;
    consentId?: string;
    appVersion?: string;
    stateSig?: string;
};

export type UserExampleState = Omit<Partial<DesignState>, "options"> & { options?: Partial<DesignOptions> };

export type UserExample = {
    meta: UserExampleMeta;
    state: UserExampleState;
};

export type ExampleEntry = RemoteExample | UserExample;

export function isUserExample(example: ExampleEntry): example is UserExample {
    return "state" in example;
}

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

    examples?: ExampleEntry[];
    defaultExampleId?: string;
};

// v2: placeholder values – measure and adjust later
const BASE_REMOTES: RemoteTemplate[] = [
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
        defaultExampleId: "default",
    },
];

export const REMOTES: RemoteTemplate[] = BASE_REMOTES.map((remote) => {
    const examples = REMOTE_EXAMPLES[remote.id];
    return examples ? { ...remote, examples } : remote;
});
