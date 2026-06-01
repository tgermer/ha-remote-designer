import { useEffect, useRef, useState, useSyncExternalStore } from "react";
import { useTranslation } from "react-i18next";

type TopNavProps = {
    view: "home" | "configure" | "gallery" | "help" | "community" | "story" | null;
    homeHref: string;
    configureHref: string;
    galleryHref: string;
    helpHref: string;
    communityHref: string;
    storyHref: string;
    onGoHome: (event: React.MouseEvent<HTMLAnchorElement>) => void;
    onGoConfigure: (event: React.MouseEvent<HTMLAnchorElement>) => void;
    onGoGallery: (event: React.MouseEvent<HTMLAnchorElement>) => void;
    onGoHelp: (event: React.MouseEvent<HTMLAnchorElement>) => void;
    onGoCommunity: (event: React.MouseEvent<HTMLAnchorElement>) => void;
    onGoStory: (event: React.MouseEvent<HTMLAnchorElement>) => void;
};

type ActiveMetrics = {
    left: number;
    width: number;
    ready: boolean;
};

const INACTIVE_METRICS: ActiveMetrics = { left: 0, width: 0, ready: false };

function getActiveMetrics(nav: HTMLElement | null, activeLink: HTMLAnchorElement | null | undefined): ActiveMetrics {
    if (!nav || !activeLink) return INACTIVE_METRICS;

    const navRect = nav.getBoundingClientRect();
    const linkRect = activeLink.getBoundingClientRect();
    return { left: linkRect.left - navRect.left, width: linkRect.width, ready: true };
}

export function TopNav(props: TopNavProps) {
    const { t, i18n } = useTranslation();
    const { view, homeHref, configureHref, galleryHref, helpHref, communityHref, storyHref, onGoHome, onGoConfigure, onGoGallery, onGoHelp, onGoCommunity, onGoStory } = props;
    const currentLanguage = (i18n.resolvedLanguage ?? i18n.language ?? "en").startsWith("de") ? "de" : "en";
    const items = [
        { id: "home", label: t("nav.home"), href: homeHref, onClick: onGoHome },
        { id: "configure", label: t("nav.configure"), href: configureHref, onClick: onGoConfigure },
        { id: "gallery", label: t("nav.gallery"), href: galleryHref, onClick: onGoGallery },
        { id: "help", label: t("nav.help"), href: helpHref, onClick: onGoHelp },
        { id: "community", label: t("nav.community"), href: communityHref, onClick: onGoCommunity },
        { id: "story", label: t("nav.story"), href: storyHref, onClick: onGoStory },
    ] as const;
    const activeIndex = items.findIndex((item) => item.id === view);
    const [menuOpen, setMenuOpen] = useState(false);
    const navRef = useRef<HTMLElement | null>(null);
    const linkRefs = useRef<(HTMLAnchorElement | null)[]>([]);
    const previousView = useRef(view);
    const metricsCache = useRef<{ key: string; value: ActiveMetrics }>({ key: "0:0:false", value: INACTIVE_METRICS });

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

    const activeMetrics = useSyncExternalStore(
        (onStoreChange) => {
            let animationFrame = 0;
            const update = () => {
                window.cancelAnimationFrame(animationFrame);
                animationFrame = window.requestAnimationFrame(onStoreChange);
            };

            const nav = navRef.current;
            const observer = nav && typeof ResizeObserver !== "undefined" ? new ResizeObserver(update) : null;
            if (nav) observer?.observe(nav);
            window.addEventListener("resize", update);
            update();

            return () => {
                window.cancelAnimationFrame(animationFrame);
                observer?.disconnect();
                window.removeEventListener("resize", update);
            };
        },
        () => {
            const activeLink = activeIndex >= 0 ? linkRefs.current[activeIndex] : null;
            const nextMetrics = getActiveMetrics(navRef.current, activeLink);
            const nextKey = `${nextMetrics.left}:${nextMetrics.width}:${nextMetrics.ready}`;
            if (metricsCache.current.key !== nextKey) {
                metricsCache.current = { key: nextKey, value: nextMetrics };
            }
            return metricsCache.current.value;
        },
        () => INACTIVE_METRICS,
    );

    useEffect(() => {
        const nav = navRef.current;
        if (!nav) return;
        const update = () => window.dispatchEvent(new Event("resize"));
        const observer = typeof ResizeObserver !== "undefined" ? new ResizeObserver(update) : null;
        const activeLink = activeIndex >= 0 ? linkRefs.current[activeIndex] : null;
        if (activeLink) observer?.observe(activeLink);
        return () => {
            observer?.disconnect();
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
