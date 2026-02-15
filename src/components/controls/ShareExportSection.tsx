import { IconBraces, IconCopy, IconFileTypePdf, IconFileZip, IconLink, IconMail, IconPhoto } from "@tabler/icons-react";
import { UiIcon } from "../UiIcon";
import { Button } from "../ui/Button";
import { useTranslation } from "react-i18next";

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
    const { t } = useTranslation();
    const { shareStatus, onCopyShareLink, shareUrl, onSendConfig, isAdmin, onExportRemoteSvg, onExportRemoteJson, onExportAllPagesSvgZip, showSvgAllPages, onExportA4Pdf, showA4Pdf, onCopyRemoteExample, remoteExampleStatus, onExportZip, isZipping, dpi, onChangeDpi } = props;

    return (
        <fieldset>
            <legend>{t("controls.shareExport.legend")}</legend>

            <p className="share">
                <Button type="button" onClick={onCopyShareLink}>
                    <UiIcon icon={IconLink} className="icon" />
                    {t("controls.shareExport.copyLink")}
                </Button>
                {shareStatus === "copied" && (
                    <span className="share__status" role="status">
                        {t("controls.shareExport.copied")}
                    </span>
                )}
            </p>

            {shareStatus === "failed" && (
                <div className="share__fallback">
                    <p className="share__hint">{t("controls.shareExport.clipboardBlocked")}</p>
                    <input name="shareExportUrlFallback" className="share__input" type="text" readOnly value={shareUrl} onFocus={(e) => e.currentTarget.select()} />
                </div>
            )}

            {onSendConfig ? (
                <p className="share">
                    <Button type="button" onClick={onSendConfig}>
                        <UiIcon icon={IconMail} className="icon" />
                        {t("controls.shareExport.sendToDeveloper")}
                    </Button>
                </p>
            ) : null}

            {onExportRemoteJson ? (
                <div className="row row--spaced">
                    <Button onClick={onExportRemoteJson}>
                        <UiIcon icon={IconBraces} className="icon" />
                        {t("controls.shareExport.exportJson")}
                    </Button>
                </div>
            ) : null}

            <div className="row row--spaced">
                <Button onClick={onExportRemoteSvg}>
                    <UiIcon icon={IconPhoto} className="icon" />
                    {t("controls.shareExport.exportSvg")}
                </Button>
                {showSvgAllPages && onExportAllPagesSvgZip ? (
                    <Button onClick={onExportAllPagesSvgZip}>
                        <UiIcon icon={IconFileZip} className="icon" />
                        {t("controls.shareExport.exportAllSvgZip")}
                    </Button>
                ) : null}
            </div>

            {showA4Pdf && onExportA4Pdf ? (
                <p>
                    <Button onClick={onExportA4Pdf}>
                        <UiIcon icon={IconFileTypePdf} className="icon" />
                        {t("controls.shareExport.exportPdf")}
                    </Button>
                </p>
            ) : null}

            {isAdmin ? (
                <>
                    {onCopyRemoteExample ? (
                        <div className="exportRow">
                            <Button onClick={onCopyRemoteExample}>
                                <UiIcon icon={IconCopy} className="icon" />
                                {t("controls.shareExport.copyRemoteExample")}
                            </Button>
                            {remoteExampleStatus === "copied" && <span className="exportRow__status">{t("controls.shareExport.copied")}</span>}
                            {remoteExampleStatus === "failed" && <span className="exportRow__status exportRow__status--error">{t("controls.shareExport.copyFailed")}</span>}
                        </div>
                    ) : null}
                    <div className="exportRow">
                        <Button onClick={onExportZip} disabled={isZipping}>
                            <UiIcon icon={IconFileZip} className="icon" />
                            {isZipping ? t("controls.shareExport.creatingZip") : t("controls.shareExport.exportPngs")}
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
