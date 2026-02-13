import { enTranslation } from "./locales/en";
import { deTranslation } from "./locales/de";

export const resources = {
    en: { translation: enTranslation },
    de: { translation: deTranslation },
} as const;

export type AppLanguage = keyof typeof resources;
