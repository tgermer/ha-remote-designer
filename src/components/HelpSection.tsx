import { FEATURES } from "../app/featureFlags";

export function HelpSection() {
    return (
        <section className="help" aria-label="Icon help">
            <details className="help__details">
                <summary>Icon help & sources</summary>
                <div className="help__content">
                    <p>
                        This app supports all Material Design Icons (MDI). Browse and search icons here:{" "}
                        <a href="https://pictogrammers.com/library/mdi/" target="_blank" rel="noopener noreferrer">
                            pictogrammers.com/library/mdi
                        </a>
                        .
                    </p>

                    <p>
                        Hue icon previews are sourced from the <code>hass-hue-icons</code> project:{" "}
                        <a href="https://github.com/arallsopp/hass-hue-icons" target="_blank" rel="noopener noreferrer">
                            github.com/arallsopp/hass-hue-icons
                        </a>
                        .
                    </p>

                    {FEATURES.PHU_ICONS ? (
                        <p>
                            Custom Brand icon previews are sourced from elax46&apos;s <code>custom-brand-icons</code>{" "}
                            collection:{" "}
                            <a href="https://github.com/elax46/custom-brand-icons" target="_blank" rel="noopener noreferrer">
                                github.com/elax46/custom-brand-icons
                            </a>
                            . These glyphs are available under CC BY-NC-SA 4.0, so keep the attribution visible when the icons
                            are enabled.
                        </p>
                    ) : null}

                    {FEATURES.PHU_ICONS ? (
                        <p className="help__note">
                            Tip: Copy the icon name from the MDI or Custom Brand library (e.g. <code>mdi:lightbulb</code> or{" "}
                            <code>phu:wall-switch</code>) and paste it into the picker.
                        </p>
                    ) : (
                        <p className="help__note">
                            Tip: Copy the icon name from the MDI library (e.g. <code>mdi:lightbulb</code>) and paste it into the picker.
                        </p>
                    )}
                </div>
            </details>

            <details className="help__details">
                <summary>Saved remotes: export & import</summary>
                <div className="help__content">
                    <p>Use Export to download a JSON backup of your saved remotes. Import merges the file with your current saved remotes.</p>
                    <p>If a name already exists for the same remote model, it will be auto-renamed with a timestamp to avoid overwriting.</p>
                    <p className="help__note">Note: Saved remotes live in your browser storage. Clearing site data removes them, so keep backups if needed.</p>
                </div>
            </details>
        </section>
    );
}
