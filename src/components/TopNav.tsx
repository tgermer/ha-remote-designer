type TopNavProps = {
    view: "editor" | "gallery";
    editorHref: string;
    galleryHref: string;
    onGoEditor: (event: React.MouseEvent<HTMLAnchorElement>) => void;
    onGoGallery: (event: React.MouseEvent<HTMLAnchorElement>) => void;
};

export function TopNav(props: TopNavProps) {
    const { view, editorHref, galleryHref, onGoEditor, onGoGallery } = props;
    const activeIndex = view === "editor" ? 0 : 1;

    return (
        <nav className="topnav" aria-label="Primary navigation" style={{ ["--active-index" as string]: String(activeIndex) }}>
            <a href={editorHref} className={view === "editor" ? "topnav__link topnav__link--active" : "topnav__link"} onClick={onGoEditor}>
                Editor
            </a>
            <a href={galleryHref} className={view === "gallery" ? "topnav__link topnav__link--active" : "topnav__link"} onClick={onGoGallery}>
                Gallery
            </a>
        </nav>
    );
}
