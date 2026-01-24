type ShareStatus = "idle" | "copied" | "failed";

type ShareExportSectionProps = {
    shareStatus: ShareStatus;
    onCopyShareLink: () => void;
    shareUrl: string;
    isAdmin: boolean;
    onExportRemoteSvg: () => void;
    onExportZip: () => void;
    isZipping: boolean;
    dpi: number;
    onChangeDpi: (dpi: number) => void;
};

export function ShareExportSection(props: ShareExportSectionProps) {
    const { shareStatus, onCopyShareLink, shareUrl, isAdmin, onExportRemoteSvg, onExportZip, isZipping, dpi, onChangeDpi } = props;

    return (
        <fieldset>
            <legend>Share & Export</legend>

            <p className="share">
                <button type="button" onClick={onCopyShareLink}>
                    Copy share link
                </button>
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
                <button onClick={onExportRemoteSvg}>Export as SVG</button>
            </p>

            {isAdmin ? (
                <div className="exportRow">
                    <button onClick={onExportZip} disabled={isZipping}>
                        {isZipping ? "Creating ZIP…" : "Export Button PNGs"}
                    </button>

                    <label className="exportRow__label">
                        DPI
                        <select value={dpi} onChange={(e) => onChangeDpi(Number(e.target.value))}>
                            <option value={203}>203</option>
                            <option value={300}>300</option>
                        </select>
                    </label>
                </div>
            ) : null}
        </fieldset>
    );
}
