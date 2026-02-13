import { UiIcon } from "../UiIcon";
import { Button } from "../ui/Button";
import { useTranslation } from "react-i18next";

type ShareStatus = "idle" | "copied" | "failed";

type ShareSectionProps = {
    shareStatus: ShareStatus;
    onCopyShareLink: () => void;
    shareUrl: string;
    onReset: () => void;
};

export function ShareSection(props: ShareSectionProps) {
    const { t } = useTranslation();
    const { shareStatus, onCopyShareLink, shareUrl, onReset } = props;

    return (
        <fieldset>
            <legend>{t("controls.share.legend")}</legend>

            <p className="share">
                <Button type="button" onClick={onCopyShareLink}>
                    <UiIcon name="mdi:link-variant" className="icon" />
                    {t("controls.share.copyLink")}
                </Button>
                {shareStatus === "copied" && (
                    <span className="share__status" role="status">
                        {t("controls.share.copied")}
                    </span>
                )}
            </p>

            {shareStatus === "failed" && (
                <div className="share__fallback">
                    <p className="share__hint">{t("controls.share.clipboardBlocked")}</p>
                    <input name="shareUrlFallback" className="share__input" type="text" readOnly value={shareUrl} onFocus={(e) => e.currentTarget.select()} />
                </div>
            )}

            <p>
                <Button type="button" onClick={onReset}>
                    <UiIcon name="mdi:backup-restore" className="icon" />
                    {t("controls.share.startFromScratch")}
                </Button>
            </p>
        </fieldset>
    );
}
