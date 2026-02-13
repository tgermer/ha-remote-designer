import i18n from "i18next";
import LanguageDetector from "i18next-browser-languagedetector";
import { initReactI18next } from "react-i18next";
import { resources } from "./resources";

const SUPPORTED_LANGUAGES = ["en", "de"] as const;

void i18n
    .use(LanguageDetector)
    .use(initReactI18next)
    .init({
        resources,
        fallbackLng: "en",
        supportedLngs: [...SUPPORTED_LANGUAGES],
        nonExplicitSupportedLngs: true,
        detection: {
            order: ["localStorage", "navigator", "htmlTag"],
            caches: ["localStorage"],
            lookupLocalStorage: "ha-remote-designer:lang",
        },
        interpolation: {
            escapeValue: false,
        },
    });

function syncHtmlLang(lng: string) {
    document.documentElement.lang = lng;
}

syncHtmlLang(i18n.resolvedLanguage ?? i18n.language ?? "en");
i18n.on("languageChanged", syncHtmlLang);

export { i18n };
