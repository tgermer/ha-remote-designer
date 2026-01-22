import type { RemoteId } from "./remotes";

export type TapType = "single" | "double" | "long";

export type ButtonConfig = {
    icons: Partial<Record<TapType, string>>; // e.g. "mdi:lightbulb-outline"
    strike?: Partial<Record<TapType, boolean>>;
};

export type DesignOptions = {
    showTapMarkersAlways: boolean;
    showTapDividers: boolean;
    showRemoteOutline: boolean;
    showButtonOutlines: boolean;

    showGuides: boolean;

    autoIconSizing: boolean;
    fixedIconMm: number;

    showScaleBar: boolean;

    tapMarkerFill: "outline" | "filled";

    labelOutlineColor: string;
    labelOutlineStrokeMm: number;
};

export type DesignState = {
    remoteId: RemoteId;
    tapsEnabled: TapType[];
    buttonConfigs: Record<string, ButtonConfig>;
    options: DesignOptions;
};
