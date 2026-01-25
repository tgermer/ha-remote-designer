import styles from "./SiteHeader.module.css";

type SiteHeaderProps = {
    isAdmin?: boolean;
    title?: string;
};

export function SiteHeader({ isAdmin = false, title = "Remote Label Designer for Home Automation" }: SiteHeaderProps) {
    return (
        <header className={styles.header}>
            <div className={styles.title}>
                <img className={styles.logo} src="/dimmer-switch.svg" alt="" aria-hidden="true" />
                <h1>{title}</h1>
                <a className={styles.tipLink} href="https://www.buymeacoffee.com/tgermer" target="_blank" rel="noopener noreferrer">
                    <img className={styles.tipImage} src="/buyMeACoffee.png" alt="Buy Me A Coffee" />
                </a>
            </div>
            {isAdmin && <span className={styles.badge}>Admin</span>}
        </header>
    );
}
