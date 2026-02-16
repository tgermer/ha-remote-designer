import styles from "./Footer.module.css";
import { useTranslation } from "react-i18next";

type LegalPageKind = "impressum" | "datenschutz";
type FooterViewKind = "home" | "configure" | "gallery" | "help" | "community" | "story";

type Props = {
    homeHref: string;
    configureHref: string;
    galleryHref: string;
    helpHref: string;
    communityHref: string;
    storyHref: string;
    impressumHref: string;
    datenschutzHref: string;
    onOpenView?: (view: FooterViewKind, event: React.MouseEvent<HTMLAnchorElement>) => void;
    onOpenLegal?: (page: LegalPageKind, event: React.MouseEvent<HTMLAnchorElement>) => void;
};

export function SiteFooter({
    homeHref,
    configureHref,
    galleryHref,
    helpHref,
    communityHref,
    storyHref,
    impressumHref,
    datenschutzHref,
    onOpenView,
    onOpenLegal,
}: Props) {
    const { t } = useTranslation();

    return (
        <footer className={styles.footer} aria-label={t("footer.label")}>
            <div className={styles.grid}>
                <section className={styles.brandColumn} aria-label={t("footer.brandTitle")}>
                    <a
                        href={homeHref}
                        className={styles.brand}
                        onClick={(event) => {
                            if (!onOpenView) return;
                            event.preventDefault();
                            onOpenView("home", event);
                        }}
                    >
                        <span className={styles.brandLead}>Clear</span>
                        <span className={styles.brandAccent}>Control.</span>
                    </a>
                    <p className={styles.claim}>{t("header.claim")}</p>
                    <p className={styles.copy}>© {new Date().getFullYear()} Tristan Germer</p>
                </section>

                <nav className={styles.linkColumn} aria-label={t("footer.navTitle")}>
                    <h3>{t("footer.navTitle")}</h3>
                    <a
                        href={homeHref}
                        onClick={(event) => {
                            if (!onOpenView) return;
                            event.preventDefault();
                            onOpenView("home", event);
                        }}
                    >
                        {t("nav.home")}
                    </a>
                    <a
                        href={configureHref}
                        onClick={(event) => {
                            if (!onOpenView) return;
                            event.preventDefault();
                            onOpenView("configure", event);
                        }}
                    >
                        {t("nav.configure")}
                    </a>
                    <a
                        href={galleryHref}
                        onClick={(event) => {
                            if (!onOpenView) return;
                            event.preventDefault();
                            onOpenView("gallery", event);
                        }}
                    >
                        {t("nav.gallery")}
                    </a>
                    <a
                        href={helpHref}
                        onClick={(event) => {
                            if (!onOpenView) return;
                            event.preventDefault();
                            onOpenView("help", event);
                        }}
                    >
                        {t("nav.help")}
                    </a>
                    <a
                        href={communityHref}
                        onClick={(event) => {
                            if (!onOpenView) return;
                            event.preventDefault();
                            onOpenView("community", event);
                        }}
                    >
                        {t("nav.community")}
                    </a>
                    <a
                        href={storyHref}
                        onClick={(event) => {
                            if (!onOpenView) return;
                            event.preventDefault();
                            onOpenView("story", event);
                        }}
                    >
                        {t("nav.story")}
                    </a>
                </nav>

                <nav className={styles.linkColumn} aria-label={t("footer.legalTitle")}>
                    <h3>{t("footer.legalTitle")}</h3>
                    <a
                        href={impressumHref}
                        onClick={(event) => {
                            if (!onOpenLegal) return;
                            event.preventDefault();
                            onOpenLegal("impressum", event);
                        }}
                    >
                        {t("footer.impressum")}
                    </a>
                    <a
                        href={datenschutzHref}
                        onClick={(event) => {
                            if (!onOpenLegal) return;
                            event.preventDefault();
                            onOpenLegal("datenschutz", event);
                        }}
                    >
                        {t("footer.privacy")}
                    </a>
                    <a href="https://github.com/tgermer/ha-remote-designer/blob/main/NOTICE" target="_blank" rel="noopener noreferrer">
                        {t("footer.notice")}
                    </a>
                    <a href="https://github.com/tgermer/ha-remote-designer" target="_blank" rel="noopener noreferrer">
                        {t("footer.openSource")}
                    </a>
                </nav>

                <nav className={styles.linkColumn} aria-label={t("footer.resourcesTitle")}>
                    <h3>{t("footer.resourcesTitle")}</h3>
                    <a href="https://github.com/tgermer/ha-remote-designer/issues" target="_blank" rel="noopener noreferrer">
                        {t("footer.issues")}
                    </a>
                    <a href="https://pictogrammers.com/library/mdi/" target="_blank" rel="noopener noreferrer">
                        {t("footer.mdi")}
                    </a>
                    <a href="https://github.com/arallsopp/hass-hue-icons" target="_blank" rel="noopener noreferrer">
                        {t("footer.hueIcons")}
                    </a>
                    <a href="mailto:info@clearcontrol.de">{t("footer.contact")}</a>
                </nav>
            </div>

            <div className={styles.metaRow}>
                <span>{t("footer.licenses")}</span>
            </div>

            <div className={styles.metaRow}>
                <p>{t("footer.trademarks")}</p>
            </div>

            <div className={styles.metaRow}>
                <span>{t("footer.affiliate")}</span>
            </div>
        </footer>
    );
}
