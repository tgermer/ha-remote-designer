import { useEffect, useLayoutEffect, useRef, useState } from "react";

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
    const { view, homeHref, configureHref, galleryHref, helpHref, communityHref, onGoHome, onGoConfigure, onGoGallery, onGoHelp, onGoCommunity } = props;
    const items = [
        { id: "home", label: "Home", href: homeHref, onClick: onGoHome },
        { id: "configure", label: "Configure", href: configureHref, onClick: onGoConfigure },
        { id: "gallery", label: "Gallery", href: galleryHref, onClick: onGoGallery },
        { id: "help", label: "Help", href: helpHref, onClick: onGoHelp },
        { id: "community", label: "Community", href: communityHref, onClick: onGoCommunity },
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
            aria-label="Primary navigation"
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
                Menu
            </button>
            <div id="topnav-menu" className="topnav__links" aria-hidden={!menuOpen}>
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
        </nav>
    );
}
