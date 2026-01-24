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

                    <p className="help__note">Tip: Copy the icon name from the MDI library (e.g. <code>mdi:lightbulb</code>) and paste it into the picker.</p>
                </div>
            </details>
        </section>
    );
}
