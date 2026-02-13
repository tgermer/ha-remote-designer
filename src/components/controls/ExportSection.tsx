import { useTranslation } from "react-i18next";

type ExportSectionProps = {
    isAdmin: boolean;
    onExportRemoteSvg: () => void;
    onExportZip: () => void;
    isZipping: boolean;
    dpi: number;
    onChangeDpi: (dpi: number) => void;
};

export function ExportSection(props: ExportSectionProps) {
    const { t } = useTranslation();
    const { isAdmin, onExportRemoteSvg, onExportZip, isZipping, dpi, onChangeDpi } = props;

    return (
        <>
            <fieldset>
                <legend>{t("controls.export.legend")}</legend>

                <p>
                    <button onClick={onExportRemoteSvg}>{t("controls.export.exportSvg")}</button>
                </p>
            </fieldset>

            {isAdmin ? (
                <fieldset>
                    <legend>{t("controls.export.adminLegend")}</legend>

                    <p>
                        <button onClick={onExportRemoteSvg}>{t("controls.export.exportSvg")}</button>
                    </p>

                    <div className="exportRow">
                        <button onClick={onExportZip} disabled={isZipping}>
                            {isZipping ? t("controls.export.creatingZip") : t("controls.export.exportPngs")}
                        </button>

                        <label className="exportRow__label">
                            DPI
                            <select name="adminExportDpi" value={dpi} onChange={(e) => onChangeDpi(Number(e.target.value))}>
                                <option value={203}>203</option>
                                <option value={300}>300</option>
                            </select>
                        </label>
                    </div>
                </fieldset>
            ) : null}
        </>
    );
}
