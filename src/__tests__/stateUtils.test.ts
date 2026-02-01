import { describe, it, expect } from "vitest";
import type { RemoteExample, RemoteTemplate } from "../app/remotes";
import type { TapType } from "../app/types";
import {
    normalizeState,
    buildStateFromExample,
    stateUsesHueIcons,
    remotesUseHueIcons,
    stateUsesPhuIcons,
    remotesUsePhuIcons,
    stateUsesFullMdi,
    remotesUseFullMdi,
} from "../app/stateUtils";

const minimalRemote: RemoteTemplate = {
    id: "foo",
    name: "Foo",
    widthMm: 10,
    heightMm: 10,
    cornerMm: 0,
    buttons: [],
};

describe("stateUtils", () => {
    it("falls back to the first remote and clamps option values", () => {
        const normalized = normalizeState(
            {
                remoteId: "missing",
                options: {
                    labelCount: -5,
                    sheetSize: "Letter",
                    labelWidthMm: 0,
                },
            },
            [minimalRemote],
        );

        expect(normalized.remoteId).toBe("foo");
        expect(normalized.options.labelCount).toBe(1);
        expect(normalized.options.labelWidthMm).toBe(1);
        expect(normalized.options.sheetSize).toBe("Letter");
    });

    it("builds a state from a remote example and merges icons", () => {
        const example: RemoteExample = {
            id: "example",
            name: "Example",
            tapsEnabled: ["single", "double"] as TapType[],
            buttonIcons: {
                on: { single: "mdi:power", double: "mdi:lightbulb" },
                off: {},
            },
            buttonStrike: {
                off: {
                    single: true,
                },
            },
            buttonIconColors: {
                on: {
                    single: "#ff00ff",
                },
            },
            buttonFill: {
                on: "#111111",
            },
            options: {
                showButtonOutlines: false,
            },
        } as const;

        const state = buildStateFromExample({ remoteId: "foo", example });
        expect(state.buttonConfigs.on.icons.single).toBe("mdi:power");
        expect(state.buttonConfigs.on.iconColors?.single).toBe("#ff00ff");
        expect(state.buttonConfigs.off.strike?.single).toBe(true);
        expect(state.buttonConfigs.on.buttonFill).toBe("#111111");
        expect(state.options.showButtonOutlines).toBe(false);
        expect(state.options.showTapDividers).toBe(true);
    });

    it("detects Hue icons inside a state", () => {
        const state = {
            buttonConfigs: {
                on: {
                    icons: {
                        single: "hue:logo",
                    },
                },
            },
        };
        expect(stateUsesHueIcons(state)).toBe(true);
    });

    it("detects Hue icons inside remote examples", () => {
        const remotes: RemoteTemplate[] = [
            {
                ...minimalRemote,
                examples: [
                    {
                        id: "hue",
                        name: "Hue",
                        tapsEnabled: ["single"],
                        buttonIcons: {
                            on: { single: "hue:logo" },
                        },
                    },
                ],
            },
        ];
        expect(remotesUseHueIcons(remotes)).toBe(true);
    });

    it("detects Custom Brand icons inside a state", () => {
        const state = {
            buttonConfigs: {
                on: {
                    icons: {
                        single: "phu:02tv",
                    },
                },
            },
        };
        expect(stateUsesPhuIcons(state)).toBe(true);
    });

    it("detects Custom Brand icons inside remote examples", () => {
        const remotes: RemoteTemplate[] = [
            {
                ...minimalRemote,
                examples: [
                    {
                        id: "phu",
                        name: "Custom Brand",
                        tapsEnabled: ["single"],
                        buttonIcons: {
                            on: { single: "phu:02tv" },
                        },
                    },
                ],
            },
        ];
        expect(remotesUsePhuIcons(remotes)).toBe(true);
    });

    it("detects non-home mdi icons inside a state", () => {
        const state = {
            buttonConfigs: {
                on: { icons: { single: "mdi:custom-icon" } },
            },
        };
        expect(stateUsesFullMdi(state, () => false)).toBe(true);
        expect(stateUsesFullMdi(state, () => true)).toBe(false);
    });

    it("detects remote examples that need full mdi", () => {
        const remotes: RemoteTemplate[] = [
            {
                ...minimalRemote,
                examples: [
                    {
                        id: "mdi-state",
                        name: "mdi",
                        tapsEnabled: ["single"],
                        buttonIcons: {
                            on: { single: "mdi:custom-icon" },
                        },
                    },
                ],
            },
        ];
        expect(remotesUseFullMdi(remotes, () => false)).toBe(true);
        expect(remotesUseFullMdi(remotes, () => true)).toBe(false);
    });
});
