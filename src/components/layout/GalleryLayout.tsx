import type { ReactNode } from "react";

type GalleryLayoutProps = {
    children: ReactNode;
};

export function GalleryLayout(props: GalleryLayoutProps) {
    const { children } = props;

    return <div className="workspace workspace--gallery">{children}</div>;
}
