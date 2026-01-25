import type { RemoteId } from "./remotes";

export type TapType = "single" | "double" | "long";

export type ButtonConfig = {
    icons: Partial<Record<TapType, string>>; // e.g. "mdi:lightbulb-outline"
    strike?: Partial<Record<TapType, boolean>>;
    iconColors?: Partial<Record<TapType, string>>;
    buttonFill?: string;
};

export type DesignOptions = {
    showTapMarkersAlways: boolean;
    showTapDividers: boolean;
    showRemoteOutline: boolean;
    showButtonOutlines: boolean;
    showCutouts: boolean;

    showGuides: boolean;

    autoIconSizing: boolean;
    fixedIconMm: number;
    iconColor: string;

    showScaleBar: boolean;

    tapMarkerFill: "outline" | "filled";
    tapMarkerColorMode: "black" | "icon";

    labelOutlineColor: string;
    labelOutlineStrokeMm: number;

    labelWidthMm: number;
    labelHeightMm: number;
    labelCornerMm: number;
    labelCount: number;
    sheetSize: "A4" | "Letter";
    sheetMarginXMm: number;
    sheetMarginYMm: number;
    sheetGapMm: number;
};

export type DesignState = {
    remoteId: RemoteId;
    tapsEnabled: TapType[];
    buttonConfigs: Record<string, ButtonConfig>;
    options: DesignOptions;
};

export const TAP_ORDER: TapType[] = ["single", "double", "long"];
