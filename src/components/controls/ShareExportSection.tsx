import { UiIcon } from "../UiIcon";
import { Button } from "../ui/Button";

type ShareStatus = "idle" | "copied" | "failed";

type ShareExportSectionProps = {
    shareStatus: ShareStatus;
    onCopyShareLink: () => void;
    shareUrl: string;
    onSendConfig?: () => void;
    isAdmin: boolean;
    onExportRemoteSvg: () => void;
    onExportRemoteJson?: () => void;
    onExportAllPagesSvgZip?: () => void;
    showSvgAllPages?: boolean;
    onExportA4Pdf?: () => void;
    showA4Pdf?: boolean;
    onCopyRemoteExample?: () => void;
    remoteExampleStatus?: ShareStatus;
    onExportZip: () => void;
    isZipping: boolean;
    dpi: number;
    onChangeDpi: (dpi: number) => void;
};

export function ShareExportSection(props: ShareExportSectionProps) {
    const { shareStatus, onCopyShareLink, shareUrl, onSendConfig, isAdmin, onExportRemoteSvg, onExportRemoteJson, onExportAllPagesSvgZip, showSvgAllPages, onExportA4Pdf, showA4Pdf, onCopyRemoteExample, remoteExampleStatus, onExportZip, isZipping, dpi, onChangeDpi } = props;

    return (
        <fieldset>
            <legend>Share & Export</legend>

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
                    <input name="shareExportUrlFallback" className="share__input" type="text" readOnly value={shareUrl} onFocus={(e) => e.currentTarget.select()} />
                </div>
            )}

            {onSendConfig ? (
                <p className="share">
                    <Button type="button" onClick={onSendConfig}>
                        <UiIcon name="mdi:email-outline" className="icon" />
                        Send config to developer
                    </Button>
                </p>
            ) : null}

            {onExportRemoteJson ? (
                <div className="row row--spaced">
                    <Button onClick={onExportRemoteJson}>
                        <UiIcon name="mdi:code-json" className="icon" />
                        Export JSON
                    </Button>
                </div>
            ) : null}

            <div className="row row--spaced">
                <Button onClick={onExportRemoteSvg}>
                    <UiIcon name="mdi:file-image-outline" className="icon" />
                    Export SVG
                </Button>
                {showSvgAllPages && onExportAllPagesSvgZip ? (
                    <Button onClick={onExportAllPagesSvgZip}>
                        <UiIcon name="mdi:folder-zip-outline" className="icon" />
                        Export all pages SVG (ZIP)
                    </Button>
                ) : null}
            </div>

            {showA4Pdf && onExportA4Pdf ? (
                <p>
                    <Button onClick={onExportA4Pdf}>
                        <UiIcon name="mdi:file-pdf-box" className="icon" />
                        Export PDF
                    </Button>
                </p>
            ) : null}

            {isAdmin ? (
                <>
                    {onCopyRemoteExample ? (
                        <div className="exportRow">
                            <Button onClick={onCopyRemoteExample}>
                                <UiIcon name="mdi:content-copy" className="icon" />
                                Copy remote example
                            </Button>
                            {remoteExampleStatus === "copied" && <span className="exportRow__status">Copied!</span>}
                            {remoteExampleStatus === "failed" && <span className="exportRow__status exportRow__status--error">Copy failed</span>}
                        </div>
                    ) : null}
                    <div className="exportRow">
                        <Button onClick={onExportZip} disabled={isZipping}>
                            <UiIcon name="mdi:folder-zip-outline" className="icon" />
                            {isZipping ? "Creating ZIP…" : "Export Button PNGs"}
                        </Button>

                        <label className="exportRow__label">
                            DPI
                            <select name="shareExportAdminDpi" value={dpi} onChange={(e) => onChangeDpi(Number(e.target.value))}>
                                <option value={203}>203</option>
                                <option value={300}>300</option>
                            </select>
                        </label>
                    </div>
                </>
            ) : null}
        </fieldset>
    );
}
