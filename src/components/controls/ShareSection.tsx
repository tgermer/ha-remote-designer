import { UiIcon } from "../UiIcon";
import { Button } from "../ui/Button";

type ShareStatus = "idle" | "copied" | "failed";

type ShareSectionProps = {
    shareStatus: ShareStatus;
    onCopyShareLink: () => void;
    shareUrl: string;
    onReset: () => void;
};

export function ShareSection(props: ShareSectionProps) {
    const { shareStatus, onCopyShareLink, shareUrl, onReset } = props;

    return (
        <fieldset>
            <legend>Share</legend>

            <p className="share">
                <Button type="button" onClick={onCopyShareLink}>
                    <UiIcon name="mdi:link-variant" className="icon" />
                    Copy share link
                </Button>
                {shareStatus === "copied" && (
                    <span className="share__status" role="status">
                        Copied!
                    </span>
                )}
            </p>

            {shareStatus === "failed" && (
                <div className="share__fallback">
                    <p className="share__hint">Clipboard access was blocked. Copy the URL manually:</p>
                    <input className="share__input" type="text" readOnly value={shareUrl} onFocus={(e) => e.currentTarget.select()} />
                </div>
            )}

            <p>
                <Button type="button" onClick={onReset}>
                    <UiIcon name="mdi:backup-restore" className="icon" />
                    Start from scratch
                </Button>
            </p>
        </fieldset>
    );
}
