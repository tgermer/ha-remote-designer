import { UiIcon } from "./UiIcon";
import { Button } from "./ui/Button";
import { LinkButton } from "./ui/LinkButton";

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
                <Button variant="primary" type="button" onClick={onSendConfig}>
                    <UiIcon name="mdi:email-fast-outline" className="icon" />
                    Send configuration
                </Button>
                <LinkButton href={helpHref} onClick={onGoHelp}>
                    <UiIcon name="mdi:lifebuoy" className="icon" />
                    Open help
                </LinkButton>
            </div>
        </div>
    );
}
