import styles from "./Footer.module.css";

export function SiteFooter() {
    return (
        <footer className={styles.footer} aria-label="Legal and credits">
            <div className={styles.row}>
                <span>© {new Date().getFullYear()} Tristan Germer</span>
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
                <span>Licenses: MIT (this app), Apache-2.0 (MDI & Hue icons). See NOTICE.</span>
                <p>“Philips” and “Philips Hue” are trademarks of Koninklijke Philips N.V. and/or Signify. The use of the Philips brand for Philips Hue is licensed to Signify. “Home Assistant” and the Home Assistant logo are trademarks of Home Assistant and/or its licensors. This project is not affiliated with, endorsed by, or sponsored by Philips, Signify, or Home Assistant.</p>
            </div>
        </footer>
    );
}
