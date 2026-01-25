import { UiIcon } from "../UiIcon";

type ShareStatus = "idle" | "copied" | "failed";

type ShareExportSectionProps = {
    shareStatus: ShareStatus;
    onCopyShareLink: () => void;
    shareUrl: string;
    isAdmin: boolean;
    onExportRemoteSvg: () => void;
    onExportRemoteJson?: () => void;
    onExportAllPagesSvgZip?: () => void;
    showSvgAllPages?: boolean;
    onExportA4Pdf?: () => void;
    showA4Pdf?: boolean;
    onExportZip: () => void;
    isZipping: boolean;
    dpi: number;
    onChangeDpi: (dpi: number) => void;
};

export function ShareExportSection(props: ShareExportSectionProps) {
    const { shareStatus, onCopyShareLink, shareUrl, isAdmin, onExportRemoteSvg, onExportRemoteJson, onExportAllPagesSvgZip, showSvgAllPages, onExportA4Pdf, showA4Pdf, onExportZip, isZipping, dpi, onChangeDpi } = props;

    return (
        <fieldset>
            <legend>Share & Export</legend>

            <p className="share">
                <button type="button" className="btn" onClick={onCopyShareLink}>
                    <UiIcon name="mdi:link-variant" className="icon" />
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

            {onExportRemoteJson ? (
                <div className="row row--spaced">
                    <button className="btn" onClick={onExportRemoteJson}>
                        <UiIcon name="mdi:code-json" className="icon" />
                        Export JSON
                    </button>
                </div>
            ) : null}

            <div className="row row--spaced">
                <button className="btn" onClick={onExportRemoteSvg}>
                    <UiIcon name="mdi:file-image-outline" className="icon" />
                    Export SVG
                </button>
                {showSvgAllPages && onExportAllPagesSvgZip ? (
                    <button className="btn" onClick={onExportAllPagesSvgZip}>
                        <UiIcon name="mdi:folder-zip-outline" className="icon" />
                        Export all pages SVG (ZIP)
                    </button>
                ) : null}
            </div>

            {showA4Pdf && onExportA4Pdf ? (
                <p>
                    <button className="btn" onClick={onExportA4Pdf}>
                        <UiIcon name="mdi:file-pdf-box" className="icon" />
                        Export PDF
                    </button>
                </p>
            ) : null}

            {isAdmin ? (
                <div className="exportRow">
                    <button className="btn" onClick={onExportZip} disabled={isZipping}>
                        <UiIcon name="mdi:folder-zip-outline" className="icon" />
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
