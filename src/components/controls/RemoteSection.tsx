import type { RemoteTemplate } from "../../app/remotes";
import { UiIcon } from "../UiIcon";
import { Button } from "../ui/Button";
import { useTranslation } from "react-i18next";

const COMMUNITY_PREVIEW_ID = "community_preview";

type RemoteSectionProps = {
    remotes: RemoteTemplate[];
    remoteId: RemoteTemplate["id"];
    remoteImageUrl?: string;
    onChangeRemote: (nextRemoteId: RemoteTemplate["id"]) => void;
    onResetRemote: () => void;
};

function formatRemoteOption(remote: RemoteTemplate, labels: { editing: string; communityDraft: string; draft: string }) {
    if (remote.id === COMMUNITY_PREVIEW_ID) {
        return `${remote.name} (${labels.editing})`;
    }
    if (remote.isCommunity) {
        return `${remote.name} (${labels.communityDraft})`;
    }
    if (remote.isDraft) {
        return `${remote.name} (${labels.draft})`;
    }
    return remote.name;
}

export function RemoteSection(props: RemoteSectionProps) {
    const { t } = useTranslation();
    const { remotes, remoteId, remoteImageUrl, onChangeRemote, onResetRemote } = props;
    const activeRemote = remotes.find((r) => r.id === remoteId);

    return (
        <fieldset>
            <legend>{t("controls.remote.legend")}</legend>
            <div className="modelRow">
                <label className="modelRow__label">
                    <span className="modelRow__labelTitle">
                        {t("controls.remote.model")}
                        {activeRemote?.isDraft ? <span className="badge badge--draft">{t("controls.remote.draft")}</span> : null}
                        {activeRemote?.isCommunity ? <span className="badge badge--community">{t("controls.remote.community")}</span> : null}
                    </span>
                    <select name="remoteId" value={remoteId} onChange={(e) => onChangeRemote(e.target.value as RemoteTemplate["id"])}>
                        {remotes.map((r) => (
                            <option key={r.id} value={r.id}>
                                {formatRemoteOption(r, {
                                    editing: t("controls.remote.editing"),
                                    communityDraft: t("controls.remote.communityDraft"),
                                    draft: t("controls.remote.draft"),
                                })}
                            </option>
                        ))}
                    </select>
                </label>
                <div className="modelRow__thumb" aria-label={t("controls.remote.selectedPreview")}>
                    {remoteImageUrl ? <img src={remoteImageUrl} alt={t("controls.remote.previewAlt", { remoteId })} /> : <span className="modelRow__thumbFallback">{t("controls.remote.noImage")}</span>}
                </div>
            </div>
            {activeRemote?.productIds?.length ? <p className="modelRow__meta">{t("controls.remote.productIds")}: {activeRemote.productIds.join(", ")}</p> : null}
            {activeRemote?.description ? <p className="modelRow__meta">{activeRemote.description}</p> : null}
            {activeRemote?.notes ? (
                <p className="modelRow__meta">
                    <strong>{t("controls.remote.notes")}:</strong> {activeRemote.notes}
                </p>
            ) : null}
            {activeRemote?.links?.length ? (
                <p className="modelRow__meta">
                    {t("controls.remote.links")}:{" "}
                    {activeRemote.links.map((link, index) => (
                        <span key={link.url}>
                            {index > 0 ? ", " : ""}
                            <a href={link.url} target="_blank" rel="noreferrer">
                                {link.label}
                            </a>
                        </span>
                    ))}
                </p>
            ) : null}
            <div className="row row--spaced">
                <Button type="button" onClick={onResetRemote}>
                    <UiIcon name="mdi:backup-restore" className="icon" />
                    {t("controls.remote.reset")}
                </Button>
            </div>
        </fieldset>
    );
}
