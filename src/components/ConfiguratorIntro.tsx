import { UiIcon } from "./UiIcon";

type ConfiguratorIntroProps = {
    helpHref: string;
    onGoHelp: (event: React.MouseEvent<HTMLAnchorElement>) => void;
    onSendConfig: () => void;
};

export function ConfiguratorIntro({ helpHref, onGoHelp, onSendConfig }: ConfiguratorIntroProps) {
    return (
        <div className="configIntro" role="region" aria-label="Configurator guidance">
            <div>
                <h3>Configure, test, and submit your remote</h3>
                <p>
                    Use the controls below to match your real remote, then preview and export. When you are happy with the result, you can send your
                    configuration to help expand the supported library.
                </p>
            </div>
            <div className="configIntro__actions">
                <button type="button" className="btn btn--primary" onClick={onSendConfig}>
                    <UiIcon name="mdi:email-fast-outline" className="icon" />
                    Send configuration
                </button>
                <a className="btn" href={helpHref} onClick={onGoHelp}>
                    <UiIcon name="mdi:lifebuoy" className="icon" />
                    Open help
                </a>
            </div>
        </div>
    );
}
