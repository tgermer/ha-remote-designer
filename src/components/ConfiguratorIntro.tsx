import { UiIcon } from "./UiIcon";
import { Button } from "./ui/Button";
import { LinkButton } from "./ui/LinkButton";
import { useTranslation } from "react-i18next";

type ConfiguratorIntroProps = {
    helpHref: string;
    onGoHelp: (event: React.MouseEvent<HTMLAnchorElement>) => void;
    onSendConfig: () => void;
};

export function ConfiguratorIntro({ helpHref, onGoHelp, onSendConfig }: ConfiguratorIntroProps) {
    const { t } = useTranslation();

    return (
        <div className="configIntro" role="region" aria-label={t("configIntro.regionLabel")}>
            <div>
                <h3>{t("configIntro.title")}</h3>
                <p>{t("configIntro.body")}</p>
            </div>
            <div className="configIntro__actions">
                <Button variant="primary" type="button" onClick={onSendConfig}>
                    <UiIcon name="mdi:email-fast-outline" className="icon" />
                    {t("configIntro.send")}
                </Button>
                <LinkButton href={helpHref} onClick={onGoHelp}>
                    <UiIcon name="mdi:lifebuoy" className="icon" />
                    {t("configIntro.openHelp")}
                </LinkButton>
            </div>
        </div>
    );
}
