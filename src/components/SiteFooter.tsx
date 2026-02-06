import styles from "./Footer.module.css";

type LegalPageKind = "impressum" | "datenschutz";

type Props = {
    impressumHref: string;
    datenschutzHref: string;
    onOpenLegal?: (page: LegalPageKind, event: React.MouseEvent<HTMLAnchorElement>) => void;
};

export function SiteFooter({ impressumHref, datenschutzHref, onOpenLegal }: Props) {
    return (
        <footer className={styles.footer} aria-label="Legal and credits">
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
                    Open source · Code on GitHub
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
                    Licenses: MIT (this app), Apache-2.0 (MDI & Hue icons).{" "}
                    <a href="https://github.com/tgermer/ha-remote-designer/blob/main/NOTICE" target="_blank" rel="noopener noreferrer">
                        See NOTICE
                    </a>
                </span>
                <p>“Philips” and “Philips Hue” are trademarks of Koninklijke Philips N.V. and/or Signify. The use of the Philips brand for Philips Hue is licensed to Signify. “Home Assistant” and the Home Assistant logo are trademarks of Home Assistant and/or its licensors. This project is not affiliated with, endorsed by, or sponsored by Philips, Signify, or Home Assistant.</p>
            </div>

            <div className={`${styles.row} ${styles.small}`}>
                <span>Some links on this page are affiliate links. If you purchase through them, we may earn a small commission at no extra cost to you.</span>
            </div>
        </footer>
    );
}
