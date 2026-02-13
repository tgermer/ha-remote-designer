import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";

type TopNavProps = {
    view: "home" | "configure" | "gallery" | "help" | "community";
    homeHref: string;
    configureHref: string;
    galleryHref: string;
    helpHref: string;
    communityHref: string;
    onGoHome: (event: React.MouseEvent<HTMLAnchorElement>) => void;
    onGoConfigure: (event: React.MouseEvent<HTMLAnchorElement>) => void;
    onGoGallery: (event: React.MouseEvent<HTMLAnchorElement>) => void;
    onGoHelp: (event: React.MouseEvent<HTMLAnchorElement>) => void;
    onGoCommunity: (event: React.MouseEvent<HTMLAnchorElement>) => void;
};

export function TopNav(props: TopNavProps) {
    const { t, i18n } = useTranslation();
    const { view, homeHref, configureHref, galleryHref, helpHref, communityHref, onGoHome, onGoConfigure, onGoGallery, onGoHelp, onGoCommunity } = props;
    const currentLanguage = (i18n.resolvedLanguage ?? i18n.language ?? "en").startsWith("de") ? "de" : "en";
    const items = [
        { id: "home", label: t("nav.home"), href: homeHref, onClick: onGoHome },
        { id: "configure", label: t("nav.configure"), href: configureHref, onClick: onGoConfigure },
        { id: "gallery", label: t("nav.gallery"), href: galleryHref, onClick: onGoGallery },
        { id: "help", label: t("nav.help"), href: helpHref, onClick: onGoHelp },
        { id: "community", label: t("nav.community"), href: communityHref, onClick: onGoCommunity },
    ] as const;
    const activeIndex = Math.max(
        0,
        items.findIndex((item) => item.id === view),
    );
    const [menuOpen, setMenuOpen] = useState(false);
    const navRef = useRef<HTMLElement | null>(null);
    const linkRefs = useRef<(HTMLAnchorElement | null)[]>([]);
    const previousView = useRef(view);
    const [activeMetrics, setActiveMetrics] = useState({ left: 0, width: 0, ready: false });

    useEffect(() => {
        if (previousView.current === view) {
            return;
        }
        previousView.current = view;
        if (!menuOpen) {
            return;
        }
        const handle = window.requestAnimationFrame(() => setMenuOpen(false));
        return () => window.cancelAnimationFrame(handle);
    }, [view, menuOpen]);

    useLayoutEffect(() => {
        const nav = navRef.current;
        const activeLink = linkRefs.current[activeIndex];
        if (!nav || !activeLink) return;
        const navRect = nav.getBoundingClientRect();
        const linkRect = activeLink.getBoundingClientRect();
        setActiveMetrics({ left: linkRect.left - navRect.left, width: linkRect.width, ready: true });
    }, [activeIndex]);

    useLayoutEffect(() => {
        const nav = navRef.current;
        if (!nav) return;
        const update = () => {
            const activeLink = linkRefs.current[activeIndex];
            if (!activeLink) return;
            const navRect = nav.getBoundingClientRect();
            const linkRect = activeLink.getBoundingClientRect();
            setActiveMetrics({ left: linkRect.left - navRect.left, width: linkRect.width, ready: true });
        };
        const observer = typeof ResizeObserver !== "undefined" ? new ResizeObserver(update) : null;
        observer?.observe(nav);
        window.addEventListener("resize", update);
        return () => {
            observer?.disconnect();
            window.removeEventListener("resize", update);
        };
    }, [activeIndex]);

    return (
        <nav
            ref={navRef}
            className={`topnav${menuOpen ? " topnav--open" : ""}`}
            aria-label={t("nav.primary")}
            data-view={view}
            style={
                {
                    ["--active-left" as string]: `${activeMetrics.left}px`,
                    ["--active-width" as string]: `${activeMetrics.width}px`,
                    ["--active-ready" as string]: activeMetrics.ready ? "1" : "0",
                } as Record<string, string>
            }
        >
            <button
                type="button"
                className="topnav__toggle"
                aria-expanded={menuOpen}
                aria-controls="topnav-menu"
                onClick={() => setMenuOpen((prev) => !prev)}
            >
                <span className="topnav__toggleIcon" aria-hidden="true">
                    <span />
                    <span />
                    <span />
                </span>
                {t("nav.menu")}
            </button>
            <div id="topnav-menu" className="topnav__links" aria-hidden={!menuOpen}>
                <div className="topnav__items">
                    {items.map((item, index) => (
                        <a
                            key={item.id}
                            href={item.href}
                            className={view === item.id ? "topnav__link topnav__link--active" : "topnav__link"}
                            onClick={(event) => {
                                item.onClick(event);
                                setMenuOpen(false);
                            }}
                            aria-current={view === item.id ? "page" : undefined}
                            ref={(el) => {
                                linkRefs.current[index] = el;
                            }}
                        >
                            {item.label}
                        </a>
                    ))}
                </div>
                <div className="topnav__utilities">
                    <a
                        className="topnav__donate"
                        href="https://www.buymeacoffee.com/tgermer"
                        target="_blank"
                        rel="noopener noreferrer"
                        data-outbound-kind="coffee"
                        data-outbound-placement="topnav"
                        data-outbound-label="donate"
                    >
                        {t("nav.donate")}
                    </a>
                    <div className="topnav__lang">
                        <label className="topnav__langLabel" htmlFor="topnav-language">
                            {t("common.languageLabel")}
                        </label>
                        <select
                            id="topnav-language"
                            className="topnav__langSelect"
                            value={currentLanguage}
                            onChange={(event) => {
                                try {
                                    window.localStorage.setItem("ha-remote-designer:lang-source", "manual");
                                    window.sessionStorage.setItem("ha-remote-designer:lang-change-source", "manual");
                                } catch {
                                    // ignore storage errors
                                }
                                void i18n.changeLanguage(event.target.value);
                                setMenuOpen(false);
                            }}
                            aria-label={t("common.languageLabel")}
                        >
                            <option value="en">{t("common.languages.en")}</option>
                            <option value="de">{t("common.languages.de")}</option>
                        </select>
                    </div>
                </div>
            </div>
        </nav>
    );
}
