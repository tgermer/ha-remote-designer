import type { RemoteTemplate } from "../app/remotes";
import type { DesignState } from "../app/types";
import type { ReactNode } from "react";
import { RemoteSvg } from "../render/RemoteSvg";
import { UiIcon } from "./UiIcon";

type HomePageProps = {
    configureHref: string;
    galleryHref: string;
    helpHref: string;
    onGoConfigure: (event: React.MouseEvent<HTMLAnchorElement>) => void;
    onGoGallery: (event: React.MouseEvent<HTMLAnchorElement>) => void;
    onGoHelp: (event: React.MouseEvent<HTMLAnchorElement>) => void;
    problemRemote?: RemoteTemplate | null;
    problemFactoryState?: DesignState | null;
    problemLayoutState?: DesignState | null;
    heroRemote?: RemoteTemplate | null;
    factoryState?: DesignState | null;
    automationState?: DesignState | null;
};

const HOME_STORY_SECTIONS = [
    {
        id: "1",
        label: "",
        title: "What you design",
        description: "Design custom button labels based on your actual smart-home setup — icons, text, grouping, and layout.",
    },
    {
        id: "2",
        label: "",
        title: "How it works",
        description: "Choose a remote template, customize each button, and export perfectly sized labels — ready to print.",
    },
    {
        id: "3",
        label: "",
        title: "Who it’s for",
        description: "Built for Home Automation users, tinkerers, and anyone who wants their smart-home remote to finally make sense.",
    },
] as const;

type HeroSection = {
    id: string;
    title: ReactNode;
    lead: string;
    factorySubtitle: string;
    layoutSubtitle: string;
    remote: RemoteTemplate | null;
    factoryState: DesignState | null;
    layoutState: DesignState | null;
    note?: string;
};

export function HomePage({ configureHref, galleryHref, helpHref, onGoConfigure, onGoGallery, onGoHelp, problemRemote, problemFactoryState, problemLayoutState, heroRemote, factoryState, automationState }: HomePageProps) {
    const heroSections: HeroSection[] = [
        {
            id: "problem",
            title: (
                <>
                    <span>Too many buttons.</span>
                    <br />
                    <span>No idea what they do.</span>
                </>
            ),
            lead: "Create clear, printable labels for your smart-home remote — readable at a glance.",
            factorySubtitle: problemRemote?.name ?? "tuya_ts0044 (factory)",
            layoutSubtitle: problemRemote?.name ?? "tuya_ts0044 (custom)",
            remote: problemRemote ?? null,
            factoryState: problemFactoryState ?? null,
            layoutState: problemLayoutState ?? null,
        },
        // {
        //     id: "problem",
        //     title: "You set up automations, scenes, and overrides — but your remote doesn’t reflect any of that.",
        //     lead: "Create custom labels that match how you actually use your smart-home remote.",
        //     factorySubtitle: problemRemote?.name ?? "tuya_ts0044 (factory)",
        //     layoutSubtitle: "tuya_ts0044 default",
        //     remote: problemRemote ?? null,
        //     factoryState: problemFactoryState ?? null,
        //     layoutState: problemLayoutState ?? null,
        // },
        // {
        //     id: "solution",
        //     title: "Most smart-home remotes aren’t designed to be labeled — and it shows.",
        //     lead: "Generate perfectly sized, printable labels made specifically for your remote.",
        //     factorySubtitle: heroRemote?.name ?? "Factory remote",
        //     layoutSubtitle: "Labeled + grouped",
        //     remote: heroRemote ?? null,
        //     factoryState: factoryState ?? null,
        //     layoutState: automationState ?? null,
        //     // note: "Your remotes stay local unless you choose to share a configuration.",
        // },
    ];

    const heroCta = (
        <div className="page__cta">
            <a className="btn btn--primary" href={configureHref} onClick={onGoConfigure}>
                <UiIcon name="mdi:tune-variant" className="icon" />
                Start configuring
            </a>
            <a className="btn" href={galleryHref} onClick={onGoGallery}>
                <UiIcon name="mdi:image-multiple-outline" className="icon" />
                View gallery
            </a>
            {/* <a className="btn" href={helpHref} onClick={onGoHelp}>
                <UiIcon name="mdi:lifebuoy" className="icon" />
                Get help
            </a> */}
        </div>
    );

    const renderRemoteStack = (remote: RemoteTemplate | null, factoryState: DesignState | null, layoutState: DesignState | null, factorySubtitle: string, layoutSubtitle: string) => {
        const hasPreview = !!(remote && factoryState && layoutState);
        return (
            <div className="homeHero__visual" aria-hidden="true">
                <div className="homeRemoteStack">
                    <div className="homeRemoteCard homeRemoteCard--factory">
                        <div className="homeRemoteCard__title">{factorySubtitle}</div>
                        <div className="homeRemoteCard__subtitle">Plain factory remote</div>
                        <div className={`homeRemoteMock homeRemoteMock--factory${hasPreview ? " homeRemoteMock--preview" : ""}`}>
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
                        <div className="homeRemoteCard__title">{layoutSubtitle}</div>
                        <div className="homeRemoteCard__subtitle">Your future layout</div>
                        <div className={`homeRemoteMock homeRemoteMock--custom${hasPreview ? " homeRemoteMock--preview" : ""}`}>
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
        );
    };

    return (
        <section className="page" aria-label="Welcome">
            <header className="page__hero homeHero">
                {heroSections.map((section, index) => {
                    const isReversed = index % 2 === 1;
                    return (
                        <div key={section.id} className={`homeHero__section${isReversed ? " homeHero__section--reverse" : ""}`}>
                            <div className="homeHero__copy">
                                <p className="page__kicker">Remote Label Designer</p>
                                <h2 className="page__title">{section.title}</h2>
                                <p className="page__lead">{section.lead}</p>
                                {heroCta}
                                {section.note ? <p className="page__note">{section.note}</p> : null}
                            </div>
                            {renderRemoteStack(section.remote, section.factoryState, section.layoutState, section.factorySubtitle, section.layoutSubtitle)}
                        </div>
                    );
                })}
            </header>

            <section className="homeStory">
                {HOME_STORY_SECTIONS.map((section) => (
                    <div className="homeStatement" key={section.id}>
                        <p className="homeStatement__label">{section.label}</p>
                        <h3>{section.title}</h3>
                        <p>{section.description}</p>
                    </div>
                ))}
            </section>
        </section>
    );
}
