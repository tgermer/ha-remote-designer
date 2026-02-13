import type { RemoteTemplate } from "../app/remotes";
import type { DesignState } from "../app/types";
import type { ReactNode } from "react";
import { RemoteSvg } from "../render/RemoteSvg";
import { UiIcon } from "./UiIcon";
import { LinkButton } from "./ui/LinkButton";
import { useTranslation } from "react-i18next";

type HomePageProps = {
    configureHref: string;
    galleryHref: string;
    onGoConfigure: (event: React.MouseEvent<HTMLAnchorElement>) => void;
    onGoGallery: (event: React.MouseEvent<HTMLAnchorElement>) => void;
    problemRemote?: RemoteTemplate | null;
    problemFactoryState?: DesignState | null;
    problemLayoutState?: DesignState | null;
};

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

export function HomePage({ configureHref, galleryHref, onGoConfigure, onGoGallery, problemRemote, problemFactoryState, problemLayoutState }: HomePageProps) {
    const { t } = useTranslation();
    const homeStorySections = [
        {
            id: "1",
            label: "",
            title: t("home.story.whatDesignTitle"),
            description: t("home.story.whatDesignDescription"),
        },
        {
            id: "2",
            label: "",
            title: t("home.story.howWorksTitle"),
            description: t("home.story.howWorksDescription"),
        },
        {
            id: "3",
            label: "",
            title: t("home.story.whoForTitle"),
            description: t("home.story.whoForDescription"),
        },
    ] as const;

    const heroSections: HeroSection[] = [
        {
            id: "problem",
            title: (
                <>
                    <span>{t("home.hero.titleLine1")}</span>
                    <br />
                    <span>{t("home.hero.titleLine2")}</span>
                </>
            ),
            lead: t("home.hero.lead"),
            factorySubtitle: problemRemote?.name ?? t("home.hero.factorySubtitleFallback"),
            layoutSubtitle: problemRemote?.name ?? t("home.hero.customSubtitleFallback"),
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
            <LinkButton variant="primary" href={configureHref} onClick={onGoConfigure}>
                <UiIcon name="mdi:tune-variant" className="icon" />
                {t("home.ctaStart")}
            </LinkButton>
            <LinkButton href={galleryHref} onClick={onGoGallery}>
                <UiIcon name="mdi:image-multiple-outline" className="icon" />
                {t("home.ctaGallery")}
            </LinkButton>
            {/* <LinkButton href={helpHref} onClick={onGoHelp}>
                <UiIcon name="mdi:lifebuoy" className="icon" />
                Get help
            </LinkButton> */}
        </div>
    );

    const renderRemoteStack = (remote: RemoteTemplate | null, factoryState: DesignState | null, layoutState: DesignState | null, factorySubtitle: string, layoutSubtitle: string) => {
        const hasPreview = !!(remote && factoryState && layoutState);
        return (
            <div className="homeHero__visual" aria-hidden="true">
                <div className="homeRemoteStack">
                    <div className="homeRemoteCard homeRemoteCard--factory">
                        <div className="homeRemoteCard__title">{factorySubtitle}</div>
                        <div className="homeRemoteCard__subtitle">{t("home.hero.factoryCardSubtitle")}</div>
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
                        <div className="homeRemoteCard__subtitle">{t("home.hero.customCardSubtitle")}</div>
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
        <section className="page" aria-label={t("home.pageLabel")}>
            <header className="page__hero homeHero">
                {heroSections.map((section, index) => {
                    const isReversed = index % 2 === 1;
                    return (
                        <div key={section.id} className={`homeHero__section${isReversed ? " homeHero__section--reverse" : ""}`}>
                            <div className="homeHero__copy">
                                <p className="page__kicker">{t("home.kicker")}</p>
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
                {homeStorySections.map((section) => (
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
