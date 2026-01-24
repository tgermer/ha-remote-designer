import type { DesignState } from "../app/types";
import type { RemoteExample, RemoteTemplate } from "../app/remotes";
import { RemoteSvg } from "../render/RemoteSvg";

type GalleryViewProps = {
    remotes: RemoteTemplate[];
    buildStateFromExample: (params: { remoteId: RemoteTemplate["id"]; example: RemoteExample }) => DesignState;
    onOpenExample: (params: { exampleId: string; state: DesignState }) => void;
    showWatermark: boolean;
    watermarkText: string;
    watermarkOpacity: number;
};

export function GalleryView(props: GalleryViewProps) {
    const { remotes, buildStateFromExample, onOpenExample, showWatermark, watermarkText, watermarkOpacity } = props;

    return (
        <section className="gallery" aria-label="Gallery">
            <header className="gallery__header">
                <h2 className="gallery__title">Gallery</h2>
                <p className="gallery__subtitle">Click a preset to open it in the editor as a starting point.</p>
            </header>

            <div className="galleryGrid">
                {remotes.flatMap((r) => {
                    const exs = r.examples ?? [];
                    return exs.map((ex) => {
                        const exState = buildStateFromExample({ remoteId: r.id, example: ex });

                        return (
                            <button
                                key={`${r.id}__${ex.id}`}
                                type="button"
                                className="galleryCard"
                                data-remote-id={r.id}
                                onClick={() => onOpenExample({ exampleId: ex.id, state: exState })}
                            >
                                <div className="galleryCard__media">
                                    <div className="galleryThumb">
                                        <RemoteSvg
                                            template={r}
                                            state={exState}
                                            background="remote"
                                            showWatermark={showWatermark}
                                            watermarkText={watermarkText}
                                            watermarkOpacity={watermarkOpacity}
                                            overrides={{
                                                showScaleBar: false,
                                                showGuides: false,
                                                showRemoteOutline: true,
                                                showButtonOutlines: true,
                                            }}
                                        />
                                    </div>
                                </div>

                                <div className="galleryCard__meta">
                                    <div className="galleryCard__title">{ex.name}</div>
                                    <div className="galleryCard__model">{r.name}</div>
                                    {ex.description ? <div className="galleryCard__desc">{ex.description}</div> : null}
                                </div>
                            </button>
                        );
                    });
                })}
            </div>
        </section>
    );
}
