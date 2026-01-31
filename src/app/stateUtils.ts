import type { DesignOptions, DesignState, TapType } from "./types";
import type { ExampleEntry, RemoteExample, RemoteTemplate } from "./remotes";
import { isUserExample } from "./remotes";
import { isMdiInHomeSet } from "./mdi";

export type NormalizableState = Omit<Partial<DesignState>, "options"> & { options?: Partial<DesignOptions> };

export const initial: DesignState = {
    remoteId: "hue_dimmer_v1",
    tapsEnabled: ["single"],
    buttonConfigs: {},
    options: {
        showTapMarkersAlways: true,
        showTapDividers: true,
        showRemoteOutline: true,
        showButtonOutlines: true,
        showCutouts: true,
        showGuides: false,
        showScaleBar: true,
        autoIconSizing: true,
        fixedIconMm: 8,
        iconColor: "#000000",
        tapMarkerFill: "outline",
        tapMarkerColorMode: "icon",
        labelOutlineColor: "#ccc",
        labelOutlineStrokeMm: 0.1,
        labelWidthMm: 40,
        labelHeightMm: 30,
        labelCornerMm: 2,
        labelCount: 6,
        sheetSize: "A4",
        sheetMarginXMm: 8,
        sheetMarginYMm: 8,
        sheetGapMm: 3,
    },
};

export function clampNumber(value: unknown, fallback: number, min?: number, max?: number) {
    const n = typeof value === "number" ? value : Number(value);
    if (!Number.isFinite(n)) return fallback;
    if (typeof min === "number" && n < min) return min;
    if (typeof max === "number" && n > max) return max;
    return n;
}

export function normalizeState(input: NormalizableState, remotes: RemoteTemplate[]): DesignState {
    const fallbackRemoteId: DesignState["remoteId"] = remotes[0]?.id ?? initial.remoteId;
    const nextRemoteId: DesignState["remoteId"] = input.remoteId && remotes.some((r) => r.id === input.remoteId) ? input.remoteId : fallbackRemoteId;
    const mergedOptions = {
        ...initial.options,
        ...(input.options ?? {}),
    };

    return {
        ...initial,
        ...input,
        remoteId: nextRemoteId,
        tapsEnabled: Array.isArray(input.tapsEnabled) && input.tapsEnabled.length ? input.tapsEnabled : initial.tapsEnabled,
        buttonConfigs: input.buttonConfigs ?? {},
        options: {
            ...mergedOptions,
            fixedIconMm: clampNumber(mergedOptions.fixedIconMm, initial.options.fixedIconMm, 1),
            labelOutlineStrokeMm: clampNumber(mergedOptions.labelOutlineStrokeMm, initial.options.labelOutlineStrokeMm, 0),
            labelWidthMm: clampNumber(mergedOptions.labelWidthMm, initial.options.labelWidthMm, 1),
            labelHeightMm: clampNumber(mergedOptions.labelHeightMm, initial.options.labelHeightMm, 1),
            labelCornerMm: clampNumber(mergedOptions.labelCornerMm, initial.options.labelCornerMm, 0),
            labelCount: Math.max(1, Math.floor(clampNumber(mergedOptions.labelCount, initial.options.labelCount, 1))),
            sheetSize: mergedOptions.sheetSize === "Letter" ? "Letter" : "A4",
            sheetMarginXMm: clampNumber(mergedOptions.sheetMarginXMm, initial.options.sheetMarginXMm, 0),
            sheetMarginYMm: clampNumber(mergedOptions.sheetMarginYMm, initial.options.sheetMarginYMm, 0),
            sheetGapMm: clampNumber(mergedOptions.sheetGapMm, initial.options.sheetGapMm, 0),
            tapMarkerFill: mergedOptions.tapMarkerFill === "filled" ? "filled" : "outline",
            tapMarkerColorMode: mergedOptions.tapMarkerColorMode === "icon" ? "icon" : "black",
            iconColor: typeof mergedOptions.iconColor === "string" ? mergedOptions.iconColor : initial.options.iconColor,
        },
    };
}

export function tapLabel(t: TapType) {
    if (t === "single") return "Tap";
    if (t === "double") return "Double Tap";
    return "Long Press";
}

export function buildStateFromExample(params: { remoteId: RemoteTemplate["id"]; example: ExampleEntry }): DesignState {
    const { remoteId, example } = params;

    if (isUserExample(example)) {
        return normalizeState({ ...example.state, remoteId }, [
            {
                id: remoteId,
                name: "",
                widthMm: 1,
                heightMm: 1,
                cornerMm: 0,
                buttons: [],
            },
        ]);
    }

    const base: DesignState = {
        ...initial,
        remoteId,
        tapsEnabled: Array.isArray(example?.tapsEnabled) && example.tapsEnabled.length ? example.tapsEnabled : ["single"],
        buttonConfigs: {},
        options: { ...initial.options },
    };

    if (example?.buttonIcons) {
        for (const [buttonId, iconsByTap] of Object.entries(example.buttonIcons) as [string, RemoteExample["buttonIcons"][string]][]) {
            const id = String(buttonId);
            const iconColors = example?.buttonIconColors?.[id] ?? {};
            const buttonFill = example?.buttonFill?.[id];
            base.buttonConfigs[id] = {
                icons: { ...iconsByTap },
                strike: { ...(example?.buttonStrike?.[id] ?? {}) },
                iconColors: { ...iconColors },
                buttonFill,
            };
        }
    }

    if (example?.buttonStrike) {
        for (const [buttonId, strikeByTap] of Object.entries(example.buttonStrike) as [string, NonNullable<RemoteExample["buttonStrike"]>[string]][]) {
            const id = String(buttonId);
            const prev = base.buttonConfigs[id] ?? { icons: {} };
            base.buttonConfigs[id] = {
                ...prev,
                strike: { ...(prev.strike ?? {}), ...strikeByTap },
            };
        }
    }

    if (example?.buttonIconColors) {
        for (const [buttonId, colorsByTap] of Object.entries(example.buttonIconColors) as [string, NonNullable<RemoteExample["buttonIconColors"]>[string]][]) {
            const id = String(buttonId);
            const prev = base.buttonConfigs[id] ?? { icons: {} };
            base.buttonConfigs[id] = {
                ...prev,
                iconColors: { ...(prev.iconColors ?? {}), ...colorsByTap },
            };
        }
    }

    if (example?.buttonFill) {
        for (const [buttonId, fill] of Object.entries(example.buttonFill) as [string, NonNullable<RemoteExample["buttonFill"]>[string]][]) {
            const id = String(buttonId);
            if (typeof fill !== "string" || !fill) continue;
            const prev = base.buttonConfigs[id] ?? { icons: {} };
            base.buttonConfigs[id] = {
                ...prev,
                buttonFill: fill,
            };
        }
    }

    if (example?.options) {
        base.options = { ...base.options, ...example.options };
    }

    if (example?.options?.showTapMarkersAlways === undefined) {
        base.options.showTapMarkersAlways = true;
    }
    if (example?.options?.showTapDividers === undefined) {
        base.options.showTapDividers = (base.tapsEnabled?.length ?? 0) > 1;
    }

    return base;
}

export function stateUsesHueIcons(state: NormalizableState) {
    const buttonConfigs = state.buttonConfigs ?? {};
    for (const cfg of Object.values(buttonConfigs)) {
        const icons = cfg?.icons ?? {};
        for (const icon of Object.values(icons)) {
            if (typeof icon === "string" && icon.startsWith("hue:")) return true;
        }
    }
    return false;
}

export function remotesUseHueIcons(remotes: RemoteTemplate[]) {
    for (const remote of remotes) {
        const examples = remote.examples ?? [];
        for (const ex of examples) {
            if (isUserExample(ex)) {
                if (stateUsesHueIcons(ex.state)) return true;
                continue;
            }
            for (const iconsByTap of Object.values(ex.buttonIcons)) {
                for (const icon of Object.values(iconsByTap)) {
                    if (typeof icon === "string" && icon.startsWith("hue:")) return true;
                }
            }
        }
    }
    return false;
}

export function stateUsesFullMdi(state: NormalizableState, isInHomeSet: (icon: string) => boolean = isMdiInHomeSet) {
    const buttonConfigs = state.buttonConfigs ?? {};
    for (const cfg of Object.values(buttonConfigs)) {
        const icons = cfg?.icons ?? {};
        for (const icon of Object.values(icons)) {
            if (typeof icon === "string" && icon.startsWith("mdi:") && !isInHomeSet(icon)) return true;
        }
    }
    return false;
}

export function remotesUseFullMdi(remotes: RemoteTemplate[], isInHomeSet: (icon: string) => boolean = isMdiInHomeSet) {
    for (const remote of remotes) {
        const examples = remote.examples ?? [];
        for (const ex of examples) {
            if (isUserExample(ex)) {
                if (stateUsesFullMdi(ex.state, isInHomeSet)) return true;
                continue;
            }
            for (const iconsByTap of Object.values(ex.buttonIcons)) {
                for (const icon of Object.values(iconsByTap)) {
                    if (typeof icon === "string" && icon.startsWith("mdi:") && !isInHomeSet(icon)) return true;
                }
            }
        }
    }
    return false;
}
