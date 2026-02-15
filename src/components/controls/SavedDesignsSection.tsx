import { useRef } from "react";
import { IconDeviceFloppy, IconFileExport, IconFileImport, IconFolderOpen, IconTrash } from "@tabler/icons-react";
import { UiIcon } from "../UiIcon";
import { Button } from "../ui/Button";
import type { SavedDesign } from "../../app/savedDesigns";
import { useTranslation } from "react-i18next";

type SavedDesignsSectionProps = {
    saveName: string;
    saveNameError: string;
    onChangeSaveName: (name: string) => void;
    onBlurSaveName: () => void;
    activeSavedId: string | null;
    hasUnsavedChanges: boolean;
    showSavedStatus: boolean;
    onSaveActive: () => void;
    onSaveAsNew: () => void;
    savedDesigns: SavedDesign[];
    selectedSavedId: string;
    onSelectSavedId: (id: string) => void;
    onRefreshSavedDesigns: () => void;
    onLoadSelected: () => void;
    onDeleteSelected: () => void;
    onExportAll: () => void;
    onImportFile: (file: File) => void;
    importExportStatus: { type: "success" | "error"; message: string } | null;
    remoteNameById: Map<string, string>;
};

export function SavedDesignsSection(props: SavedDesignsSectionProps) {
    const { t } = useTranslation();
    const {
        saveName,
        saveNameError,
        onChangeSaveName,
        onBlurSaveName,
        activeSavedId,
        hasUnsavedChanges,
        showSavedStatus,
        onSaveActive,
        onSaveAsNew,
        savedDesigns,
        selectedSavedId,
        onSelectSavedId,
        onRefreshSavedDesigns,
        onLoadSelected,
        onDeleteSelected,
        onExportAll,
        onImportFile,
        importExportStatus,
        remoteNameById,
    } = props;

    const importInputRef = useRef<HTMLInputElement | null>(null);

    return (
        <fieldset>
            <legend>{t("controls.saved.legend")}</legend>

            <label className="modelRow__label">
                {t("controls.saved.name")}
                <input
                    name="saveName"
                    type="text"
                    value={saveName}
                    onChange={(e) => onChangeSaveName(e.target.value)}
                    onBlur={onBlurSaveName}
                    placeholder={t("controls.saved.namePlaceholder")}
                />
            </label>
            {saveNameError ? <p style={{ margin: 0, fontSize: "0.85rem", color: "#b00020" }}>{saveNameError}</p> : null}

            <div className="row row--spaced">
                <Button type="button" onClick={onSaveActive} disabled={!activeSavedId || !hasUnsavedChanges || !saveName.trim() || !!saveNameError}>
                    <UiIcon icon={IconDeviceFloppy} className="icon" />
                    {t("controls.saved.save")}
                </Button>
                <Button type="button" onClick={onSaveAsNew} disabled={!saveName.trim()}>
                    <UiIcon icon={IconDeviceFloppy} className="icon" />
                    {t("controls.saved.saveAs")}
                </Button>
            </div>
            {activeSavedId && (hasUnsavedChanges || showSavedStatus) ? (
                <p
                    style={{
                        margin: "0.5rem 0 0",
                        fontSize: "0.85rem",
                        opacity: hasUnsavedChanges ? 0.85 : 1,
                        color: hasUnsavedChanges ? "inherit" : "#1b5e20",
                    }}
                >
                    {hasUnsavedChanges ? t("controls.saved.unsavedChanges") : t("controls.saved.allSaved")}
                </p>
            ) : null}

            <label className="modelRow__label" style={{ marginTop: "0.5rem" }}>
                {t("controls.saved.yourSaved")}
                <select name="selectedSavedId" value={selectedSavedId} onChange={(e) => onSelectSavedId(e.target.value)} onFocus={onRefreshSavedDesigns}>
                    <option value="">{t("controls.saved.none")}</option>
                    {savedDesigns.map((d) => (
                        <option key={d.id} value={d.id}>
                            {d.name} — {remoteNameById.get(d.state.remoteId) ?? d.state.remoteId}
                        </option>
                    ))}
                </select>
            </label>

            <div className="row row--spaced">
                <Button type="button" onClick={onLoadSelected} disabled={!selectedSavedId}>
                    <UiIcon icon={IconFolderOpen} className="icon" />
                    {t("controls.saved.load")}
                </Button>
                <Button variant="danger" type="button" onClick={onDeleteSelected} disabled={!selectedSavedId} aria-label={t("controls.saved.deleteSaved")} title={t("controls.saved.deleteSaved")}>
                    <UiIcon icon={IconTrash} className="icon" />
                </Button>
            </div>

            <div className="savedDesigns__io">
                <div className="savedDesigns__ioTitle">{t("controls.saved.backupTitle")}</div>
                <div className="row row--spaced" style={{ marginTop: "0.25rem" }}>
                    <Button type="button" onClick={onExportAll} disabled={!savedDesigns.length}>
                        <UiIcon icon={IconFileExport} className="icon" />
                        {t("controls.saved.exportAll")}
                    </Button>
                    <Button type="button" onClick={() => importInputRef.current?.click()}>
                        <UiIcon icon={IconFileImport} className="icon" />
                        {t("controls.saved.import")}
                    </Button>
                    <input
                        ref={importInputRef}
                        name="savedDesignImportFile"
                        type="file"
                        accept="application/json,.json"
                        style={{ display: "none" }}
                        onChange={(e) => {
                            const file = e.currentTarget.files?.[0];
                            if (file) onImportFile(file);
                            e.currentTarget.value = "";
                        }}
                    />
                </div>

                <p style={{ margin: "0.5rem 0 0", fontSize: "0.85rem", opacity: 0.85 }}>
                    {t("controls.saved.backupHint")}
                </p>
            </div>

            {importExportStatus ? (
                <p style={{ margin: "0.5rem 0 0", fontSize: "0.85rem", color: importExportStatus.type === "error" ? "#b00020" : "#1b5e20" }}>{importExportStatus.message}</p>
            ) : null}

            <p style={{ margin: "0.5rem 0 0", fontSize: "0.85rem", opacity: 0.85 }}>
                {t("controls.saved.storageHint")}
            </p>
        </fieldset>
    );
}
