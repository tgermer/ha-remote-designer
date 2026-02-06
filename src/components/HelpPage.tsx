import { HelpSection } from "./HelpSection";
import { UiIcon } from "./UiIcon";

type HelpPageProps = {
    configureHref: string;
    galleryHref: string;
    onGoConfigure: (event: React.MouseEvent<HTMLAnchorElement>) => void;
    onGoGallery: (event: React.MouseEvent<HTMLAnchorElement>) => void;
};

export function HelpPage({ configureHref, galleryHref, onGoConfigure, onGoGallery }: HelpPageProps) {
    return (
        <section className="page" aria-label="Help and onboarding">
            <header className="page__hero">
                <p className="page__kicker">Help & onboarding</p>
                <h2 className="page__title">Everything you need to build a great remote layout.</h2>
                <p className="page__lead">Follow the quick start below, then dive into tips for exporting, sharing, and troubleshooting.</p>
                <div className="page__cta">
                    <a className="btn btn--primary" href={configureHref} onClick={onGoConfigure}>
                        <UiIcon name="mdi:tune-variant" className="icon" />
                        Start configuring
                    </a>
                    <a className="btn" href={galleryHref} onClick={onGoGallery}>
                        <UiIcon name="mdi:image-multiple-outline" className="icon" />
                        View gallery
                    </a>
                </div>
            </header>

            <div className="page__grid">
                <article className="page__card">
                    <h3>Quick start</h3>
                    <ol className="page__list">
                        <li>Select your remote model.</li>
                        <li>Assign icons to each button and tap type.</li>
                        <li>Check the preview and export when ready.</li>
                    </ol>
                </article>
                <article className="page__card">
                    <h3>Export & print</h3>
                    <p>Use SVG for highest quality and PDF for quick printing. Sticker sheets are optimized for A4/Letter paper.</p>
                </article>
                <article className="page__card">
                    <h3>Share a configuration</h3>
                    <p>Generate a share link or send your configuration to the developer to help improve remote coverage.</p>
                </article>
            </div>

            <div className="page__split">
                <div className="page__card">
                    <h3>Troubleshooting</h3>
                    <ul className="page__list">
                        <li>Icons not loading? Check your connection and try reloading.</li>
                        <li>Missing button? Confirm the correct remote model is selected.</li>
                        <li>Lost designs? Use Export to back up your saved remotes.</li>
                    </ul>
                </div>
                <div className="page__card">
                    <h3>Icon sources</h3>
                    <HelpSection />
                </div>
            </div>

            <article className="page__card page__highlight">
                <h3>Printing & Sticker Recommendations</h3>
                <p>Use vinyl or polyester labels instead of paper – film-based stickers stay cleaner, resist smudges, and handle normal wear without peeling.</p>

                <div className="page__badge-group">
                    <span>Durable surface</span>
                    <span>Smudge resistant</span>
                    <span>Cleaner edges</span>
                </div>

                <section className="page__section">
                    <h4>Inkjet vs. Laser Printers</h4>
                    <div className="page__printer-grid">
                        <article className="page__printer-card">
                            <div className="page__printer-card-icon page__printer-card-icon--inkjet">
                                <UiIcon name="mdi:water" className="icon" />
                            </div>
                            <h5>Inkjet</h5>
                            <ul className="page__list">
                                <li>Use only inkjet-compatible vinyl labels.</li>
                                <li>Inkjet prints are not automatically waterproof.</li>
                                <li>Let ink dry completely before handling the sheet.</li>
                                <li>Optionally add a protective layer for better durability.</li>
                            </ul>
                        </article>
                        <article className="page__printer-card">
                            <div className="page__printer-card-icon page__printer-card-icon--laser">
                                <UiIcon name="mdi:printer" className="icon" />
                            </div>
                            <h5>Laser</h5>
                            <ul className="page__list">
                                <li>Choose laser-compatible polyester or vinyl labels.</li>
                                <li>Prints come out immediately smudge- and water-resistant.</li>
                                <li>Great for frequently used buttons and high-touch areas.</li>
                            </ul>
                        </article>
                    </div>
                </section>

                <section className="page__section">
                    <h4>Recommended Label Types (A4)</h4>
                    <ul className="page__list">
                        <li>
                            Inkjet printer – white vinyl labels –{" "}
                            <a href="https://www.amazon.de/dp/B000KJRDJM/" target="_blank" rel="noopener noreferrer">
                                Herma 4866 (affiliate link)
                            </a>
                        </li>
                        <li>
                            Inkjet printer – transparent vinyl labels –{" "}
                            <a href="https://www.amazon.de/dp/B000KJPFME/" target="_blank" rel="noopener noreferrer">
                                Herma 8964 (affiliate link)
                            </a>
                        </li>
                        <li>
                            Laser printer – white polyester labels –{" "}
                            <a href="https://www.amazon.de/dp/B000M24DJ0/" target="_blank" rel="noopener noreferrer">
                                Herma 9500 (affiliate link)
                            </a>
                        </li>
                        <li>
                            Laser printer – transparent labels –{" "}
                            <a href="https://www.amazon.de/dp/B079N763P5/" target="_blank" rel="noopener noreferrer">
                                Herma 4585 (affiliate link)
                            </a>
                        </li>
                    </ul>
                    <p>
                        <a href="https://www.herma-fachshop.de/Folien-Etiketten-kg478.aspx?filter-Etikettengröße=210+x+297+mm&filter-Besondere+Eigenschaften=Folienetiketten" target="_blank" rel="noopener noreferrer">
                            Browse Herma’s film label filters for A4 film-based stickers (Folienetiketten, 210 × 297 mm).
                        </a>
                    </p>
                </section>
            </article>
        </section>
    );
}
