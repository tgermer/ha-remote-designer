import type { ReactNode } from "react";

type EditorLayoutProps = {
    controls: ReactNode;
    preview: ReactNode;
    help: ReactNode;
    title?: string;
    subtitle?: string;
    intro?: ReactNode;
};

export function EditorLayout(props: EditorLayoutProps) {
    const { controls, preview, help, title = "Editor", subtitle = "Configure labels, icons, and export options.", intro } = props;

    return (
        <div className="workspace">
            <section className="controls">
                <header className="editor__header">
                    <h1 className="editor__title">{title}</h1>
                    {subtitle ? <p className="editor__subtitle">{subtitle}</p> : null}
                </header>
                {intro}
                {controls}
            </section>
            <div className="rightRail">
                {preview}
                {help}
            </div>
        </div>
    );
}
