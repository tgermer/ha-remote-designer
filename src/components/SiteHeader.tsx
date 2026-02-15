import styles from "./SiteHeader.module.css";
import { useTranslation } from "react-i18next";

type SiteHeaderProps = {
    isAdmin?: boolean;
};

export function SiteHeader({ isAdmin = false }: SiteHeaderProps) {
    const { t } = useTranslation();
    const titleLead = t("header.titleLead", { defaultValue: "" }).trim();
    const titleAccent = t("header.titleAccent", { defaultValue: "" }).trim();
    const hasSplitTitle = titleLead.length > 0 && titleAccent.length > 0;

    return (
        <header className={styles.header}>
            <div className={styles.title}>
                <div className={styles.brandTitle} role="heading" aria-level={1}>
                    {hasSplitTitle ? (
                        <>
                            <span>{titleLead}</span>
                            <span className={styles.brandAccent}>{titleAccent}</span>
                        </>
                    ) : (
                        t("header.title")
                    )}
                </div>
                <p className={styles.claim}>{t("header.claim")}</p>
            </div>
            {isAdmin && <span className={styles.badge}>{t("header.admin")}</span>}
        </header>
    );
}
