import { useState } from "react";
import { useTranslation } from "react-i18next";

const LEGACY_MIGRATE_URL = "https://ha-remote-designer.netlify.app/migrate";
const LEGACY_QUERY_KEY = "from";
const LEGACY_QUERY_VALUE = "legacy";
const LEGACY_SESSION_KEY = "clearcontrol:legacy-session:v1";

type MigrationNoticeProps = {
    variant?: "default" | "page" | "hero";
    className?: string;
};

function getInitialVisible() {
    const url = new URL(window.location.href);
    const fromLegacy = url.searchParams.get(LEGACY_QUERY_KEY) === LEGACY_QUERY_VALUE;

    if (fromLegacy) {
        try {
            window.sessionStorage.setItem(LEGACY_SESSION_KEY, "1");
        } catch {
            // ignore sessionStorage errors
        }
        url.searchParams.delete(LEGACY_QUERY_KEY);
        const nextUrl = `${url.pathname}${url.search}${url.hash}`;
        window.history.replaceState(null, "", nextUrl);
        return true;
    }

    try {
        return window.sessionStorage.getItem(LEGACY_SESSION_KEY) === "1";
    } catch {
        return false;
    }
}

export function MigrationNotice({ variant = "default", className }: MigrationNoticeProps) {
    const { t } = useTranslation();
    const [visible] = useState(getInitialVisible);
    const classes = ["migrationNotice", variant !== "default" ? `migrationNotice--${variant}` : "", className].filter(Boolean).join(" ");

    if (!visible) return null;

    return (
        <div className={classes} role="status" aria-live="polite">
            <p className="migrationNotice__title">{t("migration.noticeTitle")}</p>
            <p className="migrationNotice__body">{t("migration.noticeBody")}</p>
            <a href={LEGACY_MIGRATE_URL} target="_blank" rel="noopener noreferrer">
                {t("migration.noticeCta")}
            </a>
        </div>
    );
}
