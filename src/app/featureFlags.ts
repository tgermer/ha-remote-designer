export const FEATURES = {
    // .env: VITE_ENABLE_HUE_ICONS=true|false
    HUE_ICONS: import.meta.env.VITE_ENABLE_HUE_ICONS === "true",
} as const;
