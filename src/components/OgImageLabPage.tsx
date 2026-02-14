import type { DesignState } from "../app/types";
import type { RemoteTemplate } from "../app/remotes";
import { RemoteSvg } from "../render/RemoteSvg";

type OgImageLabPageProps = {
    remote: RemoteTemplate | null;
    factoryState: DesignState | null;
    layoutState: DesignState | null;
};

export function OgImageLabPage({ remote, factoryState, layoutState }: OgImageLabPageProps) {
    const hasPreview = !!(remote && factoryState && layoutState);

    return (
        <section className="ogLab" aria-label="Open Graph Image Lab">
            <div id="og-image-preview-node" className="ogCanvas" role="img" aria-label="Open Graph Vorschau für ClearControl mit Vorher-Nachher-Remotevergleich">
                <div className="ogCanvas__noise" aria-hidden="true" />

                <div className="ogHero">
                    <div className="ogLogo" aria-label="ClearControl.">
                        <p className="ogLogo__wordmark">
                            <span className="ogLogo__clear">Clear</span>
                            <span className="ogLogo__control">Control.</span>
                        </p>
                        <p className="ogLogo__tagline">Klarheit für Smart-Home-Steuerungen</p>
                    </div>

                    <div className="homeHero__section">
                        <div className="homeHero__copy ogHomeCopy">
                            {/* <p className="page__kicker">ClearControl</p> */}
                            <h2 className="page__title">
                                <span>Zu viele Tasten.</span>
                                <br />
                                <span>Zu wenig Klarheit.</span>
                            </h2>
                            <p className="page__lead">Mach aus unübersichtlichen Smart-Home-Steuerungen klare, strukturierte und druckfertige Beschriftungen.</p>

                            <div className="page__cta ogCanvas__cta">
                                <span className="ogButton ogButton--primary">Jetzt Layout erstellen</span>
                            </div>
                        </div>

                        <div className="homeHero__visual ogHomeVisual" aria-hidden="true">
                            <div className="homeRemoteStack ogHomeStack">
                                <div className="homeRemoteCard homeRemoteCard--factory">
                                    <div className="homeRemoteCard__title">MOES 4 BUTTON SCENE (TS0044)</div>
                                    <div className="homeRemoteCard__subtitle">Unbeschriftetes Standard-Layout</div>
                                    <div className="homeRemoteMock homeRemoteMock--factory homeRemoteMock--preview">
                                        {hasPreview ? (
                                            <RemoteSvg
                                                template={remote}
                                                state={factoryState}
                                                background="remote"
                                                showMissingIconPlaceholder
                                                overrides={{
                                                    showScaleBar: false,
                                                    showGuides: false,
                                                    showRemoteOutline: true,
                                                    showButtonOutlines: true,
                                                }}
                                            />
                                        ) : null}
                                    </div>
                                </div>

                                <div className="homeRemoteCard homeRemoteCard--custom">
                                    <div className="homeRemoteCard__title">MOES 4 BUTTON SCENE (TS0044)</div>
                                    <div className="homeRemoteCard__subtitle">Dein klares Layout</div>
                                    <div className="homeRemoteMock homeRemoteMock--custom homeRemoteMock--preview">
                                        {hasPreview ? (
                                            <RemoteSvg
                                                template={remote}
                                                state={layoutState}
                                                background="remote"
                                                showMissingIconPlaceholder
                                                overrides={{
                                                    showScaleBar: false,
                                                    showGuides: false,
                                                    showRemoteOutline: true,
                                                    showButtonOutlines: true,
                                                }}
                                            />
                                        ) : null}
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </section>
    );
}
