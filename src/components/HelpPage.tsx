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
        </section>
    );
}
