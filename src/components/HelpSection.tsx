import { useTranslation } from "react-i18next";

export function HelpSection() {
    const { t } = useTranslation();

    return (
        <section className="help" aria-label={t("helpSection.iconHelpLabel")}>
            <details className="help__details">
                <summary>{t("helpSection.iconSourcesSummary")}</summary>
                <div className="help__content">
                    <p>
                        {t("helpSection.mdiBody")}{" "}
                        <a href="https://pictogrammers.com/library/mdi/" target="_blank" rel="noopener noreferrer">
                            pictogrammers.com/library/mdi
                        </a>
                        .
                    </p>

                    <p>
                        {t("helpSection.hueBody")}{" "}
                        <a href="https://github.com/arallsopp/hass-hue-icons" target="_blank" rel="noopener noreferrer">
                            github.com/arallsopp/hass-hue-icons
                        </a>
                        .
                    </p>

                    <p className="help__note">{t("helpSection.tip")}</p>
                </div>
            </details>

            <details className="help__details">
                <summary>{t("helpSection.savedSummary")}</summary>
                <div className="help__content">
                    <p>{t("helpSection.savedBody1")}</p>
                    <p>{t("helpSection.savedBody2")}</p>
                    <p className="help__note">{t("helpSection.savedNote")}</p>
                </div>
            </details>
        </section>
    );
}
