import type { RemoteTemplate } from "../app/remotes";
import type { DesignState } from "../app/types";
import { RemoteSvg } from "../render/RemoteSvg";
import { UiIcon } from "./UiIcon";

type HomePageProps = {
    configureHref: string;
    galleryHref: string;
    helpHref: string;
    onGoConfigure: (event: React.MouseEvent<HTMLAnchorElement>) => void;
    onGoGallery: (event: React.MouseEvent<HTMLAnchorElement>) => void;
    onGoHelp: (event: React.MouseEvent<HTMLAnchorElement>) => void;
    heroRemote?: RemoteTemplate | null;
    factoryState?: DesignState | null;
    automationState?: DesignState | null;
};

export function HomePage({ configureHref, galleryHref, helpHref, onGoConfigure, onGoGallery, onGoHelp, heroRemote, factoryState, automationState }: HomePageProps) {
    const hasHeroPreview = !!(heroRemote && factoryState && automationState);
    return (
        <section className="page" aria-label="Welcome">
            <header className="page__hero homeHero">
                <div className="homeHero__copy">
                    <p className="page__kicker">Remote Label Designer</p>
                    <h2 className="page__title">Make every button readable, at a glance.</h2>
                    <p className="page__lead">Design clear, printable labels that match how you actually use your smart-home remote.</p>
                    <div className="page__cta">
                        <a className="btn btn--primary" href={configureHref} onClick={onGoConfigure}>
                            <UiIcon name="mdi:tune-variant" className="icon" />
                            Start configuring
                        </a>
                        <a className="btn" href={galleryHref} onClick={onGoGallery}>
                            <UiIcon name="mdi:image-multiple-outline" className="icon" />
                            View gallery
                        </a>
                        <a className="btn" href={helpHref} onClick={onGoHelp}>
                            <UiIcon name="mdi:lifebuoy" className="icon" />
                            Get help
                        </a>
                    </div>
                    <p className="page__note">Your remotes stay local unless you choose to share a configuration.</p>
                </div>
                <div className="homeHero__visual" aria-hidden="true">
                    <div className="homeRemoteStack">
                        <div className="homeRemoteCard homeRemoteCard--factory">
                            <div className="homeRemoteCard__title">Factory remote</div>
                            <div className="homeRemoteCard__subtitle">Hue Dimmer Switch</div>
                            <div className={`homeRemoteMock homeRemoteMock--factory${hasHeroPreview ? " homeRemoteMock--preview" : ""}`}>
                                {hasHeroPreview ? (
                                    <RemoteSvg
                                        template={heroRemote}
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
                            <div className="homeRemoteCard__title">Your layout</div>
                            <div className="homeRemoteCard__subtitle">Labeled + grouped</div>
                            <div className={`homeRemoteMock homeRemoteMock--custom${hasHeroPreview ? " homeRemoteMock--preview" : ""}`}>
                                {hasHeroPreview ? (
                                    <RemoteSvg
                                        template={heroRemote}
                                        state={automationState}
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
            </header>

            <section className="homeStory">
                <div className="homeStatement">
                    <h3>Stop guessing.</h3>
                    <p>Group actions by room, label scenes, and make the remote yours.</p>
                </div>
                <div className="homeStatement">
                    <h3>Test before printing.</h3>
                    <p>Preview sizes and placement so every label lines up.</p>
                </div>
                <div className="homeStatement">
                    <h3>Print. Stick. Done.</h3>
                    <p>Export SVG/PDF sheets and update anytime.</p>
                </div>
            </section>
        </section>
    );
}
