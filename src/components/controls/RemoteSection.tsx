import type { RemoteTemplate } from "../../app/remotes";

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
                    </span>
                    <select value={remoteId} onChange={(e) => onChangeRemote(e.target.value as RemoteTemplate["id"])}>
                        {remotes.map((r) => (
                            <option key={r.id} value={r.id}>
                                {r.name}
                                {r.isDraft ? " (Draft)" : ""}
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
                <button type="button" onClick={onResetRemote}>
                    Reset current remote
                </button>
            </div>
        </fieldset>
    );
}
