import { useMemo } from "react";
import { IconAdjustments, IconPhoto } from "@tabler/icons-react";
import { useTranslation } from "react-i18next";
import type { RemoteTemplate } from "../app/remotes";
import type { DesignState } from "../app/types";
// import { RemoteSvg } from "../render/RemoteSvg";
import { UiIcon } from "../components/UiIcon";
import { LinkButton } from "../components/ui/LinkButton";
import "./StoryPage.css";

type StoryPageProps = {
    configureHref: string;
    galleryHref?: string;
    onGoConfigure: (event: React.MouseEvent<HTMLAnchorElement>) => void;
    onGoGallery?: (event: React.MouseEvent<HTMLAnchorElement>) => void;
    problemRemote?: RemoteTemplate | null;
    problemFactoryState?: DesignState | null;
    problemLayoutState?: DesignState | null;
};

type StorySection = {
    eyebrow?: string;
    title: string;
    blocks: string[];
};

const STORY_BLOCK_GROUPS: number[][][] = [
    [[0, 1], [2], [3, 4, 5, 6], [7, 8, 9, 10], [11, 12]],
    [[0, 1, 2, 3, 4], [5]],
    [
        [0, 1, 2],
        [3, 4, 5, 6],
    ],
    [[0], [1], [2, 3], [4, 5, 6]],
    [[0, 1]],
];

function groupStoryBlocks(blocks: string[], sectionIndex: number) {
    const pattern = STORY_BLOCK_GROUPS[sectionIndex];
    if (!pattern) return blocks.map((line) => [line]);

    return pattern.map((group) => group.map((blockIndex) => blocks[blockIndex]).filter((line) => typeof line === "string")).filter((group) => group.length > 0);
}

export const StoryPage: React.FC<StoryPageProps> = ({ configureHref, galleryHref, onGoConfigure, onGoGallery, problemRemote, problemFactoryState, problemLayoutState }) => {
    const { t } = useTranslation();

    const sections = useMemo<StorySection[]>(() => {
        const translated = t("storyPage.sections", { returnObjects: true }) as StorySection[];
        return translated;
    }, [t]);

    const hasGalleryLink = Boolean(galleryHref && onGoGallery);
    const titleLine1 = t("storyPage.titleLine1");
    const titleLine2 = t("storyPage.titleLine2");
    let autoHighlightIndex = 0;
    const renderInlineMarkup = (text: string) => {
        const parts = text.split(/(<hl2>.*?<\/hl2>|<hl>.*?<\/hl>)/g).filter(Boolean);
        return parts.map((part, index) => {
            const matchDefault = part.match(/^<hl>(.*?)<\/hl>$/);
            const matchAlt = part.match(/^<hl2>(.*?)<\/hl2>$/);
            if (matchDefault || matchAlt) {
                const content = (matchDefault?.[1] ?? matchAlt?.[1] ?? "").trim();
                const useAlt = matchAlt ? true : autoHighlightIndex % 2 === 1;
                autoHighlightIndex += 1;
                return (
                    <span key={`hl-${index}`} className={useAlt ? "text-highlight text-highlight--alt" : "text-highlight"}>
                        {content}
                    </span>
                );
            }
            return <span key={`txt-${index}`}>{part}</span>;
        });
    };

    return (
        <section className="page storyPage" aria-label={t("storyPage.pageLabel")}>
            <div className="storyPage__container">
                <header className="page__hero page__hero--compact storyHero">
                    <h1 className="page__title">{t("storyPage.pageLabel")}</h1>
                    <h2 className="storyHero__title">
                        <span>{renderInlineMarkup(titleLine1)}</span>
                        <span>{renderInlineMarkup(titleLine2)}</span>
                    </h2>
                    <p className="page__lead storyHero__lead">{t("storyPage.lead")}</p>
                </header>

                <div className="storyPage__sections" aria-label={t("storyPage.pageLabel")}>
                    {sections.map((section, index) => (
                        <section className="storySection" key={`${section.title}-${index}`}>
                            <div className="storySection__rail">
                                <span className="storySection__index" aria-hidden="true">
                                    {String(index + 1).padStart(2, "0")}
                                </span>
                                {section.eyebrow ? <p className="storySection__eyebrow">{section.eyebrow}</p> : null}
                                <h2 className="storySection__title">{section.title}</h2>
                            </div>

                            <div className="storySection__content">
                                <div className="storySection__blocks">
                                    {groupStoryBlocks(section.blocks, index).map((group, groupIndex) => (
                                        <div key={`${index}-group-${groupIndex}`} className={`storySection__group${group.every((line) => line.trim().length <= 24) ? " storySection__group--compact" : ""}`}>
                                            {group.map((line, lineIndex) => (
                                                <p key={`${index}-${groupIndex}-${lineIndex}`} className="storySection__line">
                                                    {renderInlineMarkup(line)}
                                                </p>
                                            ))}
                                        </div>
                                    ))}
                                </div>

                                {/* {index === 0 && problemRemote && problemFactoryState && problemLayoutState ? (
                                    <aside className="storySection__compare" aria-label={t("storyPage.beforeAfter.ariaLabel")}>
                                        <div className="storyPreviewCard storyPreviewCard--factory">
                                            <h3 className="storyCompareCard__title">{t("storyPage.beforeAfter.factory")}</h3>
                                            <p className="storyCompareCard__body">{t("storyPage.beforeAfter.factoryHint")}</p>
                                            <div className="storyPreviewCard__remote">
                                                <RemoteSvg
                                                    template={problemRemote}
                                                    state={problemFactoryState}
                                                    background="remote"
                                                    showMissingIconPlaceholder
                                                    overrides={{
                                                        showScaleBar: false,
                                                        showGuides: false,
                                                        showRemoteOutline: true,
                                                        showButtonOutlines: true,
                                                    }}
                                                />
                                            </div>
                                        </div>
                                        <div className="storyPreviewCard storyPreviewCard--clarified">
                                            <h3 className="storyCompareCard__title">{t("storyPage.beforeAfter.clarified")}</h3>
                                            <p className="storyCompareCard__body">{t("storyPage.beforeAfter.clarifiedHint")}</p>
                                            <div className="storyPreviewCard__remote">
                                                <RemoteSvg
                                                    template={problemRemote}
                                                    state={problemLayoutState}
                                                    background="remote"
                                                    showMissingIconPlaceholder
                                                    overrides={{
                                                        showScaleBar: false,
                                                        showGuides: false,
                                                        showRemoteOutline: true,
                                                        showButtonOutlines: true,
                                                    }}
                                                />
                                            </div>
                                        </div>
                                    </aside>
                                ) : null} */}

                                {index === 4 && problemRemote && problemFactoryState && problemLayoutState ? (
                                    <aside className="storyPage__cta" aria-label={t("storyPage.cta.title")}>
                                        <p className="storyPage__ctaTitle">{t("storyPage.cta.title")}</p>
                                        <div className="page__cta storyPage__ctaActions">
                                            <LinkButton variant="primary" href={configureHref} onClick={onGoConfigure}>
                                                <UiIcon icon={IconAdjustments} className="icon" />
                                                {t("storyPage.cta.primary")}
                                            </LinkButton>
                                            {hasGalleryLink ? (
                                                <LinkButton href={galleryHref} onClick={onGoGallery}>
                                                    <UiIcon icon={IconPhoto} className="icon" />
                                                    {t("storyPage.cta.secondary")}
                                                </LinkButton>
                                            ) : null}
                                        </div>
                                    </aside>
                                ) : null}
                            </div>
                        </section>
                    ))}
                </div>

                {/* <section className="storyPage__cta" aria-label={t("storyPage.cta.title")}>
                    <p className="storyPage__ctaTitle">{t("storyPage.cta.title")}</p>
                    <div className="page__cta storyPage__ctaActions">
                        <LinkButton variant="primary" href={configureHref} onClick={onGoConfigure}>
                            <UiIcon icon={IconAdjustments} className="icon" />
                            {t("storyPage.cta.primary")}
                        </LinkButton>
                        {hasGalleryLink ? (
                            <LinkButton href={galleryHref} onClick={onGoGallery}>
                                <UiIcon icon={IconPhoto} className="icon" />
                                {t("storyPage.cta.secondary")}
                            </LinkButton>
                        ) : null}
                    </div>
                </section> */}
            </div>
        </section>
    );
};
