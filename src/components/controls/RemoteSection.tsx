import type { RemoteTemplate } from "../../app/remotes";
import { UiIcon } from "../UiIcon";

type RemoteSectionProps = {
    remotes: RemoteTemplate[];
    remoteId: RemoteTemplate["id"];
    remoteImageUrl?: string;
    onChangeRemote: (nextRemoteId: RemoteTemplate["id"]) => void;
    onResetRemote: () => void;
};

export function RemoteSection(props: RemoteSectionProps) {
    const { remotes, remoteId, remoteImageUrl, onChangeRemote, onResetRemote } = props;
    const activeRemote = remotes.find((r) => r.id === remoteId);

    return (
        <fieldset>
            <legend>Remote</legend>
            <div className="modelRow">
                <label className="modelRow__label">
                    <span className="modelRow__labelTitle">
                        Model
                        {activeRemote?.isDraft ? <span className="badge badge--draft">Draft</span> : null}
                        {activeRemote?.isCommunity ? <span className="badge badge--community">Community</span> : null}
                    </span>
                    <select value={remoteId} onChange={(e) => onChangeRemote(e.target.value as RemoteTemplate["id"])}>
                        {remotes.map((r) => (
                            <option key={r.id} value={r.id}>
                                {r.id === "community_preview" ? `${r.name} (Editing)` : r.name}
                                {r.isDraft && r.id !== "community_preview" ? " (Draft)" : ""}
                            </option>
                        ))}
                    </select>
                </label>
                <div className="modelRow__thumb" aria-label="Selected remote preview">
                    {remoteImageUrl ? <img src={remoteImageUrl} alt={`${remoteId} preview`} /> : <span className="modelRow__thumbFallback">No image</span>}
                </div>
            </div>
            {activeRemote?.productIds?.length ? <p className="modelRow__meta">Product IDs: {activeRemote.productIds.join(", ")}</p> : null}
            {activeRemote?.description ? <p className="modelRow__meta">{activeRemote.description}</p> : null}
            {activeRemote?.links?.length ? (
                <p className="modelRow__meta">
                    Links:{" "}
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
                <button type="button" className="btn" onClick={onResetRemote}>
                    <UiIcon name="mdi:backup-restore" className="icon" />
                    Reset current remote
                </button>
            </div>
        </fieldset>
    );
}
