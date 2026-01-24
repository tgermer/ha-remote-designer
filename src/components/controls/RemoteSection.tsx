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

    return (
        <fieldset>
            <legend>Remote</legend>
            <div className="modelRow">
                <label className="modelRow__label">
                    Model
                    <select value={remoteId} onChange={(e) => onChangeRemote(e.target.value as RemoteTemplate["id"])}>
                        {remotes.map((r) => (
                            <option key={r.id} value={r.id}>
                                {r.name}
                            </option>
                        ))}
                    </select>
                </label>
                <div className="modelRow__thumb" aria-label="Selected remote preview">
                    {remoteImageUrl ? <img src={remoteImageUrl} alt={`${remoteId} preview`} /> : <span className="modelRow__thumbFallback">No image</span>}
                </div>
            </div>
            <div className="row">
                <button type="button" onClick={onResetRemote}>
                    Reset current remote
                </button>
            </div>
        </fieldset>
    );
}
