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
            </div>
            {isAdmin && <span className={styles.badge}>Admin</span>}
        </header>
    );
}
