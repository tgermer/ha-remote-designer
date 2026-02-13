import styles from "./SiteHeader.module.css";
import { useTranslation } from "react-i18next";

type SiteHeaderProps = {
    isAdmin?: boolean;
};

export function SiteHeader({ isAdmin = false }: SiteHeaderProps) {
    const { t } = useTranslation();

    return (
        <header className={styles.header}>
            <div className={styles.title}>
                <h1>{t("header.title")}</h1>
            </div>
            {isAdmin && <span className={styles.badge}>{t("header.admin")}</span>}
        </header>
    );
}
