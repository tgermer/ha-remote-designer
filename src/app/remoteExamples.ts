import type { ExampleEntry, RemoteId } from "./remotes";

export const REMOTE_EXAMPLES: Partial<Record<RemoteId, ExampleEntry[]>> = {
    hue_dimmer_v1: [
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
            options: {
                showTapMarkersAlways: false,
            },
        },
        {
            meta: {
                id: "0f91e257-a60a-4892-ae9c-e1050b486e98",
                userExample: true,
                allowGallery: true,
                savedName: "Home Control",
                description: "Text-first home routine layout with morning/evening shortcuts, vacation mode, and awning control.",
                savedId: "50543ce8-a9e7-4146-b409-4a3aa6fe324e",
                exportedAt: "2026-02-11T13:53:32.937Z",
                consentId: "consent_0f91e257-a60a-4892-ae9c-e1050b486e98",
                appVersion: "dev",
                stateSig: '{"remoteId":"hue_dimmer_v1","tapsEnabled":["single","long"],"buttonConfigs":{"on":{"icons":{},"texts":{"single":"Guten \\nMorgen"},"strike":{},"iconColors":{}},"off":{"icons":{},"texts":{"single":"Guten \\nAbend"},"strike":{},"iconColors":{}},"up":{"icons":{},"texts":{"single":"Urlaubs-\\nmodus"},"strike":{},"iconColors":{}},"down":{"icons":{},"texts":{"single":"Markiesen"},"strike":{"single":false},"iconColors":{},"strikeStyle":{"single":"straight"}}},"options":{"showTapMarkersAlways":false,"showTapDividers":true,"showRemoteOutline":true,"showButtonOutlines":true,"showCutouts":true,"showGuides":false,"showScaleBar":true,"autoIconSizing":true,"fixedIconMm":6,"iconColor":"#454545","tapMarkerFill":"outline","tapMarkerColorMode":"icon","labelOutlineColor":"#ccc","labelOutlineStrokeMm":0.1,"labelWidthMm":40,"labelHeightMm":30,"labelCornerMm":2,"labelCount":6,"sheetSize":"A4","sheetMarginXMm":8,"sheetMarginYMm":8,"sheetGapMm":3}}',
            },
            state: {
                remoteId: "hue_dimmer_v1",
                tapsEnabled: ["single", "long"],
                buttonConfigs: {
                    on: {
                        icons: {},
                        texts: {
                            single: "Guten \nMorgen",
                        },
                        strike: {},
                        iconColors: {},
                    },
                    off: {
                        icons: {},
                        texts: {
                            single: "Guten \nAbend",
                        },
                        strike: {},
                        iconColors: {},
                    },
                    up: {
                        icons: {},
                        texts: {
                            single: "Urlaubs-\nmodus",
                        },
                        strike: {},
                        iconColors: {},
                    },
                    down: {
                        icons: {},
                        texts: {
                            single: "Markiesen",
                        },
                        strike: {
                            single: false,
                        },
                        iconColors: {},
                        strikeStyle: {
                            single: "straight",
                        },
                    },
                },
                options: {
                    showTapMarkersAlways: false,
                    showTapDividers: true,
                    showRemoteOutline: true,
                    showButtonOutlines: true,
                    showCutouts: true,
                    showGuides: false,
                    showScaleBar: true,
                    autoIconSizing: true,
                    fixedIconMm: 6,
                    iconColor: "#454545",
                    tapMarkerFill: "outline",
                    tapMarkerColorMode: "icon",
                    labelOutlineColor: "#ccc",
                    labelOutlineStrokeMm: 0.1,
                },
            },
        },
        {
            meta: {
                id: "ecce4eee-3bce-481f-9dac-82a1675eb273",
                userExample: true,
                allowGallery: true,
                savedName: "Alarm Guard",
                description: "High-contrast security preset with clear red/green alarm states and mixed icon/text controls.",
                savedId: "edbe490e-188d-403f-a6d9-0b0c10f09645",
                exportedAt: "2026-02-11T13:53:59.771Z",
                consentId: "consent_ecce4eee-3bce-481f-9dac-82a1675eb273",
                appVersion: "dev",
                stateSig:
                    '{"remoteId":"hue_dimmer_v1","tapsEnabled":["single","double"],"buttonConfigs":{"on":{"icons":{},"strike":{"single":false},"iconColors":{"single":"#ffffff"},"texts":{"single":"Alarm\\n"},"buttonFill":"#ff0000","strikeStyle":{"single":"straight"}},"up":{"icons":{"single":"mdi:lightbulb-outline"},"texts":{},"strike":{"single":false},"iconColors":{}},"off":{"icons":{},"texts":{"single":"Alarm\\n"},"strike":{"single":true},"iconColors":{"single":"#ffffff"},"buttonFill":"#50c304"},"down":{"icons":{"single":"mdi:lightbulb-off-outline"},"texts":{},"strike":{},"iconColors":{}}},"options":{"showTapMarkersAlways":true,"showTapDividers":true,"showRemoteOutline":true,"showButtonOutlines":true,"showCutouts":true,"showGuides":false,"showScaleBar":true,"autoIconSizing":true,"fixedIconMm":6.5,"iconColor":"#454545","tapMarkerFill":"outline","tapMarkerColorMode":"icon","labelOutlineColor":"#ccc","labelOutlineStrokeMm":0.1,"labelWidthMm":40,"labelHeightMm":30,"labelCornerMm":2,"labelCount":6,"sheetSize":"A4","sheetMarginXMm":8,"sheetMarginYMm":8,"sheetGapMm":3}}',
            },
            state: {
                remoteId: "hue_dimmer_v1",
                tapsEnabled: ["single", "double"],
                buttonConfigs: {
                    on: {
                        icons: {},
                        strike: {
                            single: false,
                        },
                        iconColors: {
                            single: "#ffffff",
                        },
                        texts: {
                            single: "Alarm\n",
                        },
                        buttonFill: "#ff0000",
                        strikeStyle: {
                            single: "straight",
                        },
                    },
                    up: {
                        icons: {
                            single: "mdi:lightbulb-outline",
                        },
                        texts: {},
                        strike: {
                            single: false,
                        },
                        iconColors: {},
                    },
                    off: {
                        icons: {},
                        texts: {
                            single: "Alarm\n",
                        },
                        strike: {
                            single: true,
                        },
                        iconColors: {
                            single: "#ffffff",
                        },
                        buttonFill: "#50c304",
                    },
                    down: {
                        icons: {
                            single: "mdi:lightbulb-off-outline",
                        },
                        texts: {},
                        strike: {},
                        iconColors: {},
                    },
                },
                options: {
                    showTapMarkersAlways: false,
                    showTapDividers: true,
                    showRemoteOutline: true,
                    showButtonOutlines: true,
                    showCutouts: true,
                    showGuides: false,
                    showScaleBar: true,
                    autoIconSizing: true,
                    fixedIconMm: 6.5,
                    iconColor: "#454545",
                    tapMarkerFill: "outline",
                    tapMarkerColorMode: "icon",
                    labelOutlineColor: "#ccc",
                    labelOutlineStrokeMm: 0.1,
                },
            },
        },
    ],
    hue_dimmer_v2: [
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
        {
            meta: {
                id: "821d99e7-7436-455a-b359-895ce6e87284",
                userExample: true,
                allowGallery: true,
                savedName: "Pour‑o‑Matic (Kathrin Edition)",
                description: "Just a drink‑ordering remote for wine by the glass or bottle, plus water and snack support.",
                savedId: "cb55ecef-6feb-4f83-a8ed-39214761210e",
                exportedAt: "2026-01-27T13:35:25.587Z",
                consentId: "consent_821d99e7-7436-455a-b359-895ce6e87284",
                appVersion: "dev",
                stateSig:
                    '{"remoteId":"hue_dimmer_v2","tapsEnabled":["single","long","double"],"buttonConfigs":{"on":{"icons":{"single":"mdi:glass-tulip","long":"mdi:glass-wine","double":"mdi:glass-tulip"},"strike":{},"iconColors":{"long":"#990000","single":"#f9cd2f","double":"#f7a6a6"}},"up":{"icons":{"single":"mdi:bottle-wine","double":"mdi:bottle-wine","long":"mdi:bottle-wine"},"strike":{},"iconColors":{"single":"#f9cd2f","double":"#f7a6a6","long":"#990000"}},"down":{"icons":{"single":"mdi:cup-water","double":"mdi:cup"},"strike":{},"iconColors":{"single":"#ffffff","double":"#ffffff"},"buttonFill":"#99caff"},"hue":{"icons":{"single":"mdi:pretzel","long":"mdi:peanut-outline"},"strike":{},"iconColors":{}}},"options":{"showTapMarkersAlways":false,"showTapDividers":true,"showRemoteOutline":true,"showButtonOutlines":true,"showCutouts":true,"showGuides":false,"showScaleBar":true,"autoIconSizing":true,"fixedIconMm":6.5,"iconColor":"#545454","tapMarkerFill":"filled","tapMarkerColorMode":"icon","labelOutlineColor":"#464646","labelOutlineStrokeMm":0.2,"labelWidthMm":40,"labelHeightMm":30,"labelCornerMm":2,"labelCount":6,"sheetSize":"A4","sheetMarginXMm":8,"sheetMarginYMm":8,"sheetGapMm":3}}',
            },
            state: {
                remoteId: "hue_dimmer_v2",
                tapsEnabled: ["single", "long", "double"],
                buttonConfigs: {
                    on: {
                        icons: {
                            single: "mdi:glass-tulip",
                            long: "mdi:glass-wine",
                            double: "mdi:glass-tulip",
                        },
                        strike: {},
                        iconColors: {
                            long: "#990000",
                            single: "#f9cd2f",
                            double: "#f7a6a6",
                        },
                    },
                    up: {
                        icons: {
                            single: "mdi:bottle-wine",
                            double: "mdi:bottle-wine",
                            long: "mdi:bottle-wine",
                        },
                        strike: {},
                        iconColors: {
                            single: "#f9cd2f",
                            double: "#f7a6a6",
                            long: "#990000",
                        },
                    },
                    down: {
                        icons: {
                            single: "mdi:cup-water",
                            double: "mdi:cup",
                        },
                        strike: {},
                        iconColors: {
                            single: "#ffffff",
                            double: "#ffffff",
                        },
                        buttonFill: "#99caff",
                    },
                    hue: {
                        icons: {
                            single: "mdi:pretzel",
                            long: "mdi:peanut-outline",
                        },
                        strike: {},
                        iconColors: {},
                    },
                },
                options: {
                    showTapMarkersAlways: false,
                    showTapDividers: true,
                    showRemoteOutline: true,
                    showButtonOutlines: true,
                    showCutouts: true,
                    showGuides: false,
                    showScaleBar: true,
                    autoIconSizing: true,
                    fixedIconMm: 6.5,
                    iconColor: "#545454",
                    tapMarkerFill: "filled",
                    tapMarkerColorMode: "icon",
                    labelOutlineColor: "#464646",
                    labelOutlineStrokeMm: 0.2,
                },
            },
        },
    ],
    ikea_bilresa_dual_switch: [
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
    aqara_w100: [
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
    "HM-PB-6-WM55": [
        {
            meta: {
                id: "2f6b8d81-2ba3-44d0-835c-821eb81b336e",
                userExample: true,
                allowGallery: true,
                savedName: "Home Automation Master Switch",
                description: "Master switch to control all major home functions: light groups on/off, windows, pool and day/night scenes.",
                savedId: null,
                exportedAt: "2026-01-27T11:15:44.564Z",
                consentId: "consent_2f6b8d81-2ba3-44d0-835c-821eb81b336e",
                appVersion: "dev",
                stateSig:
                    '{"remoteId":"HM-PB-6-WM55","tapsEnabled":["single"],"buttonConfigs":{"top_left":{"icons":{"single":"mdi:lightbulb-group-outline"},"strike":{},"iconColors":{}},"top_right":{"icons":{"single":"mdi:lightbulb-group-off-outline"},"strike":{},"iconColors":{}},"center_left":{"icons":{"single":"mdi:window-closed-variant"},"strike":{},"iconColors":{}},"center_right":{"icons":{"single":"mdi:pool"},"strike":{},"iconColors":{}},"bottom_left":{"icons":{"single":"mdi:weather-sunny"},"strike":{},"iconColors":{}},"bottom_right":{"icons":{"single":"mdi:weather-night"},"strike":{},"iconColors":{}}},"options":{"showTapMarkersAlways":false,"showTapDividers":true,"showRemoteOutline":true,"showButtonOutlines":true,"showCutouts":true,"showGuides":false,"showScaleBar":true,"autoIconSizing":false,"fixedIconMm":6.5,"iconColor":"#000000","tapMarkerFill":"outline","tapMarkerColorMode":"icon","labelOutlineColor":"#464646","labelOutlineStrokeMm":0.2,"labelWidthMm":40,"labelHeightMm":30,"labelCornerMm":2,"labelCount":6,"sheetSize":"A4","sheetMarginXMm":8,"sheetMarginYMm":8,"sheetGapMm":3}}',
            },
            state: {
                remoteId: "HM-PB-6-WM55",
                tapsEnabled: ["single"],
                buttonConfigs: {
                    top_left: {
                        icons: {
                            single: "mdi:lightbulb-group-outline",
                        },
                        strike: {},
                        iconColors: {},
                    },
                    top_right: {
                        icons: {
                            single: "mdi:lightbulb-group-off-outline",
                        },
                        strike: {},
                        iconColors: {},
                    },
                    center_left: {
                        icons: {
                            single: "mdi:window-closed-variant",
                        },
                        strike: {},
                        iconColors: {},
                    },
                    center_right: {
                        icons: {
                            single: "mdi:pool",
                        },
                        strike: {},
                        iconColors: {},
                    },
                    bottom_left: {
                        icons: {
                            single: "mdi:weather-sunny",
                        },
                        strike: {},
                        iconColors: {},
                    },
                    bottom_right: {
                        icons: {
                            single: "mdi:weather-night",
                        },
                        strike: {},
                        iconColors: {},
                    },
                },
                options: {
                    showTapMarkersAlways: false,
                    showTapDividers: true,
                    showRemoteOutline: true,
                    showButtonOutlines: true,
                    showCutouts: true,
                    showGuides: false,
                    showScaleBar: true,
                    autoIconSizing: false,
                    fixedIconMm: 6.5,
                    iconColor: "#000000",
                    tapMarkerFill: "outline",
                    tapMarkerColorMode: "icon",
                    labelOutlineColor: "#464646",
                    labelOutlineStrokeMm: 0.2,
                },
            },
        },
        {
            meta: {
                id: "6d3943c7-6405-4983-82de-eccf39fa1a95",
                userExample: true,
                allowGallery: true,
                savedName: "Home Automation Master Switch Variant Color",
                description: "Master switch to control all major home functions: light groups on/off, windows, pool and day/night scenes.",
                savedId: null,
                exportedAt: "2026-01-27T11:20:37.071Z",
                consentId: "consent_6d3943c7-6405-4983-82de-eccf39fa1a95",
                appVersion: "dev",
                stateSig:
                    '{"remoteId":"HM-PB-6-WM55","tapsEnabled":["single","long"],"buttonConfigs":{"top_left":{"icons":{"single":"mdi:lightbulb-group-outline"},"strike":{},"iconColors":{}},"top_right":{"icons":{"single":"mdi:lightbulb-group-off-outline"},"strike":{},"iconColors":{}},"center_left":{"icons":{"single":"mdi:window-closed-variant"},"strike":{},"iconColors":{},"buttonFill":"#e6e6e6"},"center_right":{"icons":{"single":"mdi:pool"},"strike":{},"iconColors":{"single":"#0033ff"},"buttonFill":"#c7eeff"},"bottom_left":{"icons":{"single":"mdi:weather-sunny"},"strike":{},"iconColors":{"single":"#fab700"}},"bottom_right":{"icons":{"single":"mdi:weather-night"},"strike":{},"iconColors":{"single":"#0933dc"}}},"options":{"showTapMarkersAlways":false,"showTapDividers":true,"showRemoteOutline":true,"showButtonOutlines":true,"showCutouts":true,"showGuides":false,"showScaleBar":true,"autoIconSizing":false,"fixedIconMm":6.5,"iconColor":"#000000","tapMarkerFill":"outline","tapMarkerColorMode":"icon","labelOutlineColor":"#000000","labelOutlineStrokeMm":0.2,"labelWidthMm":40,"labelHeightMm":30,"labelCornerMm":2,"labelCount":6,"sheetSize":"A4","sheetMarginXMm":8,"sheetMarginYMm":8,"sheetGapMm":3}}',
            },
            state: {
                remoteId: "HM-PB-6-WM55",
                tapsEnabled: ["single", "long"],
                buttonConfigs: {
                    top_left: {
                        icons: {
                            single: "mdi:lightbulb-group-outline",
                        },
                        strike: {},
                        iconColors: {},
                    },
                    top_right: {
                        icons: {
                            single: "mdi:lightbulb-group-off-outline",
                        },
                        strike: {},
                        iconColors: {},
                    },
                    center_left: {
                        icons: {
                            single: "mdi:window-closed-variant",
                        },
                        strike: {},
                        iconColors: {},
                        buttonFill: "#e6e6e6",
                    },
                    center_right: {
                        icons: {
                            single: "mdi:pool",
                        },
                        strike: {},
                        iconColors: {
                            single: "#0033ff",
                        },
                        buttonFill: "#c7eeff",
                    },
                    bottom_left: {
                        icons: {
                            single: "mdi:weather-sunny",
                        },
                        strike: {},
                        iconColors: {
                            single: "#fab700",
                        },
                    },
                    bottom_right: {
                        icons: {
                            single: "mdi:weather-night",
                        },
                        strike: {},
                        iconColors: {
                            single: "#0933dc",
                        },
                    },
                },
                options: {
                    showTapMarkersAlways: false,
                    showTapDividers: true,
                    showRemoteOutline: true,
                    showButtonOutlines: true,
                    showCutouts: true,
                    showGuides: false,
                    showScaleBar: true,
                    autoIconSizing: false,
                    fixedIconMm: 6.5,
                    iconColor: "#000000",
                    tapMarkerFill: "outline",
                    tapMarkerColorMode: "icon",
                    labelOutlineColor: "#000000",
                    labelOutlineStrokeMm: 0.2,
                },
            },
        },
        {
            meta: {
                id: "b0dcd967-be5c-49b8-8ae2-deff2f671bcd",
                userExample: true,
                allowGallery: true,
                savedName: "Home Automation Master Switch Variant Text",
                description: "Text-focused master switch to control all major home functions: light groups on/off, windows, pool and day/night scenes.",
                savedId: null,
                exportedAt: "2026-02-11T13:52:33.858Z",
                consentId: "consent_b0dcd967-be5c-49b8-8ae2-deff2f671bcd",
                appVersion: "dev",
                stateSig:
                    '{"remoteId":"HM-PB-6-WM55","tapsEnabled":["single"],"buttonConfigs":{"top_left":{"icons":{},"strike":{},"iconColors":{},"texts":{"single":"Licht\\nAN"}},"top_right":{"icons":{},"strike":{},"iconColors":{},"texts":{"single":"Licht\\nAUS"}},"center_left":{"icons":{},"strike":{},"iconColors":{},"texts":{"single":"Status\\nFens-\\nter"}},"center_right":{"icons":{},"strike":{},"iconColors":{},"texts":{"single":"Pool"}},"bottom_left":{"icons":{"single":"mdi:weather-sunny"},"strike":{},"iconColors":{}},"bottom_right":{"icons":{"single":"mdi:weather-night"},"strike":{},"iconColors":{}}},"options":{"showTapMarkersAlways":false,"showTapDividers":true,"showRemoteOutline":true,"showButtonOutlines":true,"showCutouts":true,"showGuides":false,"showScaleBar":true,"autoIconSizing":false,"fixedIconMm":6.5,"iconColor":"#000000","tapMarkerFill":"outline","tapMarkerColorMode":"icon","labelOutlineColor":"#464646","labelOutlineStrokeMm":0.2,"labelWidthMm":40,"labelHeightMm":30,"labelCornerMm":2,"labelCount":6,"sheetSize":"A4","sheetMarginXMm":8,"sheetMarginYMm":8,"sheetGapMm":3}}',
            },
            state: {
                remoteId: "HM-PB-6-WM55",
                tapsEnabled: ["single"],
                buttonConfigs: {
                    top_left: {
                        icons: {},
                        strike: {},
                        iconColors: {},
                        texts: {
                            single: "Licht\nAN",
                        },
                    },
                    top_right: {
                        icons: {},
                        strike: {},
                        iconColors: {},
                        texts: {
                            single: "Licht\nAUS",
                        },
                    },
                    center_left: {
                        icons: {},
                        strike: {},
                        iconColors: {},
                        texts: {
                            single: "Status\nFens-\nter",
                        },
                    },
                    center_right: {
                        icons: {},
                        strike: {},
                        iconColors: {},
                        texts: {
                            single: "Pool",
                        },
                    },
                    bottom_left: {
                        icons: {
                            single: "mdi:weather-sunny",
                        },
                        strike: {},
                        iconColors: {},
                    },
                    bottom_right: {
                        icons: {
                            single: "mdi:weather-night",
                        },
                        strike: {},
                        iconColors: {},
                    },
                },
                options: {
                    showTapMarkersAlways: false,
                    showTapDividers: true,
                    showRemoteOutline: true,
                    showButtonOutlines: true,
                    showCutouts: true,
                    showGuides: false,
                    showScaleBar: true,
                    autoIconSizing: false,
                    fixedIconMm: 6.5,
                    iconColor: "#000000",
                    tapMarkerFill: "outline",
                    tapMarkerColorMode: "icon",
                    labelOutlineColor: "#464646",
                    labelOutlineStrokeMm: 0.2,
                },
            },
        },
    ],
    tuya_ts0044: [
        {
            id: "factory",
            name: "Factory Remote",
            description: "Single tap: group on/off on the left, scene on the right.",
            tapsEnabled: ["single"],
            buttonIcons: {},
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
        {
            id: "default",
            name: "Groups & Scene",
            description: "Single tap: group on/off on the left, scene on the right.",
            /* tapsEnabled: ["single"],
            buttonIcons: {
                top_left: { single: "mdi:lightbulb-group" },
                bottom_left: { single: "mdi:lightbulb-group-off-outline" },
                top_right: { single: "mdi:palette" },
                bottom_right: { single: "mdi:lightbulb-outline" },
            }, */
            tapsEnabled: ["single", "long"],
            buttonIcons: {
                top_left: { single: "mdi:lightbulb-auto", long: "mdi:lightbulb-on10" },
                bottom_left: { single: "mdi:lightbulb-off" },
                top_right: { single: "mdi:palette" },
                bottom_right: { single: "mdi:roller-shade", long: "mdi:roller-shade-closed" },
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
        {
            id: "b2474432-4a02-4871-a4b2-978528f6f51e",
            name: "Light, scene and cover switch.",
            description: "Light + covers on single tap, scenes on long press.",
            tapsEnabled: ["single", "long"],
            buttonIcons: {
                top_left: {
                    single: "mdi:lightbulb-group",
                    long: "mdi:palette",
                },
                top_right: {
                    single: "mdi:roller-shade",
                },
                bottom_left: {
                    single: "mdi:lightbulb-group-off-outline",
                },
                bottom_right: {
                    single: "mdi:roller-shade-closed",
                },
            },
            buttonIconColors: {
                top_left: {
                    long: "#c933ff",
                },
            },
            options: {
                showTapMarkersAlways: false,
                fixedIconMm: 6.5,
                labelOutlineColor: "#464646",
                labelOutlineStrokeMm: 0.2,
            },
        },
    ],
    enocean_ptm_215ze: [
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
};
