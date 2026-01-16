import styles from "./SiteHeader.module.css";

type SiteHeaderProps = {
    isAdmin?: boolean;
    title?: string;
};

export function SiteHeader({ isAdmin = false, title = "Remote Label Designer for Home Automation" }: SiteHeaderProps) {
    return (
        <header className={styles.header}>
            <h1>{title}</h1>
            {isAdmin && <span className={styles.badge}>Admin</span>}
        </header>
    );
}
