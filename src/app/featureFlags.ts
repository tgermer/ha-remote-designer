export const FEATURES = {
    HUE_ICONS: import.meta.env.VITE_ENABLE_HUE_ICONS === "true",
    PHU_ICONS: import.meta.env.VITE_ENABLE_PHU_ICONS === "true",
    WATERMARK: import.meta.env.VITE_ENABLE_WATERMARK === "true",
} as const;
