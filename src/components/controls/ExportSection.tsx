type ExportSectionProps = {
    isAdmin: boolean;
    onExportRemoteSvg: () => void;
    onExportZip: () => void;
    isZipping: boolean;
    dpi: number;
    onChangeDpi: (dpi: number) => void;
};

export function ExportSection(props: ExportSectionProps) {
    const { isAdmin, onExportRemoteSvg, onExportZip, isZipping, dpi, onChangeDpi } = props;

    return (
        <>
            <fieldset>
                <legend>Export</legend>

                <p>
                    <button onClick={onExportRemoteSvg}>Export as SVG</button>
                </p>
            </fieldset>

            {isAdmin ? (
                <fieldset>
                    <legend>Admin Export</legend>

                    <p>
                        <button onClick={onExportRemoteSvg}>Export as SVG</button>
                    </p>

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
                </fieldset>
            ) : null}
        </>
    );
}
