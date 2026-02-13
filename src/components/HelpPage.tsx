import { HelpSection } from "./HelpSection";
import { MigrationNotice } from "./MigrationNotice";
import { UiIcon } from "./UiIcon";
import { LinkButton } from "./ui/LinkButton";
import { useTranslation } from "react-i18next";

type HelpPageProps = {
    configureHref: string;
    galleryHref: string;
    onGoConfigure: (event: React.MouseEvent<HTMLAnchorElement>) => void;
    onGoGallery: (event: React.MouseEvent<HTMLAnchorElement>) => void;
};

export function HelpPage({ configureHref, galleryHref, onGoConfigure, onGoGallery }: HelpPageProps) {
    const { t } = useTranslation();

    return (
        <section className="page" aria-label={t("helpPage.pageLabel")}>
            <header className="page__hero">
                <p className="page__kicker">{t("helpPage.kicker")}</p>
                <h2 className="page__title">{t("helpPage.title")}</h2>
                <p className="page__lead">{t("helpPage.lead")}</p>
                <div className="page__cta">
                    <LinkButton variant="primary" href={configureHref} onClick={onGoConfigure}>
                        <UiIcon name="mdi:tune-variant" className="icon" />
                        {t("helpPage.ctaStart")}
                    </LinkButton>
                    <LinkButton href={galleryHref} onClick={onGoGallery}>
                        <UiIcon name="mdi:image-multiple-outline" className="icon" />
                        {t("helpPage.ctaGallery")}
                    </LinkButton>
                </div>
            </header>

            <MigrationNotice variant="page" />

            <div className="page__grid">
                <article className="page__card">
                    <h3>{t("helpPage.quickStartTitle")}</h3>
                    <ol className="page__list">
                        <li>{t("helpPage.quickStartStep1")}</li>
                        <li>{t("helpPage.quickStartStep2")}</li>
                        <li>{t("helpPage.quickStartStep3")}</li>
                    </ol>
                </article>
                <article className="page__card">
                    <h3>{t("helpPage.exportTitle")}</h3>
                    <p>{t("helpPage.exportBody")}</p>
                </article>
                <article className="page__card">
                    <h3>{t("helpPage.shareTitle")}</h3>
                    <p>{t("helpPage.shareBody")}</p>
                </article>
            </div>

            <div className="page__split">
                <div className="page__card">
                    <h3>{t("helpPage.troubleshootingTitle")}</h3>
                    <ul className="page__list">
                        <li>{t("helpPage.troubleshooting1")}</li>
                        <li>{t("helpPage.troubleshooting2")}</li>
                        <li>{t("helpPage.troubleshooting3")}</li>
                    </ul>
                </div>
                <div className="page__card">
                    <h3>{t("helpPage.iconSourcesTitle")}</h3>
                    <HelpSection />
                </div>
            </div>

            <article className="page__card page__highlight">
                <h3>{t("helpPage.printTitle")}</h3>
                <p>{t("helpPage.printLead")}</p>

                <div className="page__badge-group">
                    <span>{t("helpPage.badgeDurable")}</span>
                    <span>{t("helpPage.badgeSmudge")}</span>
                    <span>{t("helpPage.badgeEdges")}</span>
                </div>

                <section className="page__section">
                    <h4>{t("helpPage.printerTitle")}</h4>
                    <div className="page__printer-grid">
                        <article className="page__printer-card">
                            <div className="page__printer-card-icon page__printer-card-icon--inkjet">
                                <UiIcon name="mdi:water" className="icon" />
                            </div>
                            <h5>{t("helpPage.inkjet")}</h5>
                            <ul className="page__list">
                                <li>{t("helpPage.inkjet1")}</li>
                                <li>{t("helpPage.inkjet2")}</li>
                                <li>{t("helpPage.inkjet3")}</li>
                                <li>{t("helpPage.inkjet4")}</li>
                            </ul>
                        </article>
                        <article className="page__printer-card">
                            <div className="page__printer-card-icon page__printer-card-icon--laser">
                                <UiIcon name="mdi:printer" className="icon" />
                            </div>
                            <h5>{t("helpPage.laser")}</h5>
                            <ul className="page__list">
                                <li>{t("helpPage.laser1")}</li>
                                <li>{t("helpPage.laser2")}</li>
                                <li>{t("helpPage.laser3")}</li>
                            </ul>
                        </article>
                    </div>
                </section>

                <section className="page__section">
                    <h4>{t("helpPage.recommendedTitle")}</h4>
                    <ul className="page__list">
                        <li>
                            {t("helpPage.itemInkjetWhite")} -{" "}
                            <a href="https://www.amazon.de/dp/B000KJRDJM/" target="_blank" rel="noopener noreferrer" data-outbound-kind="amazon_affiliate" data-outbound-placement="help_recommendations" data-outbound-label="herma_4866">
                                Herma 4866 ({t("helpPage.affiliate")})
                            </a>
                        </li>
                        <li>
                            {t("helpPage.itemInkjetTransparent")} -{" "}
                            <a href="https://www.amazon.de/dp/B000KJPFME/" target="_blank" rel="noopener noreferrer" data-outbound-kind="amazon_affiliate" data-outbound-placement="help_recommendations" data-outbound-label="herma_8964">
                                Herma 8964 ({t("helpPage.affiliate")})
                            </a>
                        </li>
                        <li>
                            {t("helpPage.itemLaserWhite")} -{" "}
                            <a href="https://www.amazon.de/dp/B000M24DJ0/" target="_blank" rel="noopener noreferrer" data-outbound-kind="amazon_affiliate" data-outbound-placement="help_recommendations" data-outbound-label="herma_9500">
                                Herma 9500 ({t("helpPage.affiliate")})
                            </a>
                        </li>
                        <li>
                            {t("helpPage.itemLaserTransparent")} -{" "}
                            <a href="https://www.amazon.de/dp/B079N763P5/" target="_blank" rel="noopener noreferrer" data-outbound-kind="amazon_affiliate" data-outbound-placement="help_recommendations" data-outbound-label="herma_4585">
                                Herma 4585 ({t("helpPage.affiliate")})
                            </a>
                        </li>
                    </ul>
                    <p>
                        <a href="https://www.herma-fachshop.de/Folien-Etiketten-kg478.aspx?filter-Etikettengröße=210+x+297+mm&filter-Besondere+Eigenschaften=Folienetiketten" target="_blank" rel="noopener noreferrer" data-outbound-kind="herma_fachshop" data-outbound-placement="help_recommendations" data-outbound-label="folienetiketten">
                            {t("helpPage.browseHerma")}
                        </a>
                    </p>
                </section>
            </article>
        </section>
    );
}
