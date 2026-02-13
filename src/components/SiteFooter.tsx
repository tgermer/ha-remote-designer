import styles from "./Footer.module.css";
import { useTranslation } from "react-i18next";

type LegalPageKind = "impressum" | "datenschutz";

type Props = {
    impressumHref: string;
    datenschutzHref: string;
    onOpenLegal?: (page: LegalPageKind, event: React.MouseEvent<HTMLAnchorElement>) => void;
};

export function SiteFooter({ impressumHref, datenschutzHref, onOpenLegal }: Props) {
    const { t } = useTranslation();

    return (
        <footer className={styles.footer} aria-label={t("footer.label")}>
            <div className={styles.row}>
                <span>© {new Date().getFullYear()} Tristan Germer</span>

                <span className={styles.sep}>•</span>
                <a
                    href={impressumHref}
                    onClick={(event) => {
                        if (!onOpenLegal) return;
                        event.preventDefault();
                        onOpenLegal("impressum", event);
                    }}
                >
                    Impressum
                </a>

                <span className={styles.sep}>•</span>
                <a
                    href={datenschutzHref}
                    onClick={(event) => {
                        if (!onOpenLegal) return;
                        event.preventDefault();
                        onOpenLegal("datenschutz", event);
                    }}
                >
                    Datenschutz
                </a>

                <span className={styles.sep}>•</span>
                <a href="https://github.com/tgermer/ha-remote-designer" target="_blank" rel="noopener noreferrer">
                    {t("footer.openSource")}
                </a>

                <span className={styles.sep}>•</span>
                <a href="https://pictogrammers.com/library/mdi/" target="_blank" rel="noopener noreferrer">
                    MDI
                </a>

                <span className={styles.sep}>•</span>
                <a href="https://github.com/arallsopp/hass-hue-icons" target="_blank" rel="noopener noreferrer">
                    hass-hue-icons
                </a>
            </div>

            <div className={`${styles.row} ${styles.small}`}>
                <span>
                    {t("footer.licenses")}{" "}
                    <a href="https://github.com/tgermer/ha-remote-designer/blob/main/NOTICE" target="_blank" rel="noopener noreferrer">
                        {t("footer.notice")}
                    </a>
                </span>
                <p>{t("footer.trademarks")}</p>
            </div>

            <div className={`${styles.row} ${styles.small}`}>
                <span>{t("footer.affiliate")}</span>
            </div>
        </footer>
    );
}
