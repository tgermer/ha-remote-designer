import type { ReactNode } from "react";

type EditorLayoutProps = {
    controls: ReactNode;
    preview: ReactNode;
    help: ReactNode;
};

export function EditorLayout(props: EditorLayoutProps) {
    const { controls, preview, help } = props;

    return (
        <div className="workspace">
            <section className="controls">
                <header className="editor__header">
                    <h2 className="editor__title">Editor</h2>
                    <p className="editor__subtitle">Configure labels, icons, and export options.</p>
                </header>
                {controls}
            </section>
            <div className="rightRail">
                {preview}
                {help}
            </div>
        </div>
    );
}
