import { useRef } from "react";
import { UiIcon } from "../UiIcon";
import { Button } from "../ui/Button";
import type { SavedDesign } from "../../app/savedDesigns";

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
            <legend>Saved remotes</legend>

            <label className="modelRow__label">
                Name
                <input
                    type="text"
                    value={saveName}
                    onChange={(e) => onChangeSaveName(e.target.value)}
                    onBlur={onBlurSaveName}
                    placeholder="e.g. Living room dimmer"
                />
            </label>
            {saveNameError ? <p style={{ margin: 0, fontSize: "0.85rem", color: "#b00020" }}>{saveNameError}</p> : null}

            <div className="row row--spaced">
                <Button type="button" onClick={onSaveActive} disabled={!activeSavedId || !hasUnsavedChanges || !saveName.trim() || !!saveNameError}>
                    <UiIcon name="mdi:content-save" className="icon" />
                    Save
                </Button>
                <Button type="button" onClick={onSaveAsNew} disabled={!saveName.trim()}>
                    <UiIcon name="mdi:content-save-plus-outline" className="icon" />
                    Save as
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
                    {hasUnsavedChanges ? "Unsaved changes" : "All changes saved"}
                </p>
            ) : null}

            <label className="modelRow__label" style={{ marginTop: "0.5rem" }}>
                Your saved remotes
                <select value={selectedSavedId} onChange={(e) => onSelectSavedId(e.target.value)} onFocus={onRefreshSavedDesigns}>
                    <option value="">(none)</option>
                    {savedDesigns.map((d) => (
                        <option key={d.id} value={d.id}>
                            {d.name} — {remoteNameById.get(d.state.remoteId) ?? d.state.remoteId}
                        </option>
                    ))}
                </select>
            </label>

            <div className="row row--spaced">
                <Button type="button" onClick={onLoadSelected} disabled={!selectedSavedId}>
                    <UiIcon name="mdi:folder-open-outline" className="icon" />
                    Load
                </Button>
                <Button variant="danger" type="button" onClick={onDeleteSelected} disabled={!selectedSavedId} aria-label="Delete saved remote" title="Delete saved remote">
                    <UiIcon name="mdi:delete-outline" className="icon" />
                </Button>
            </div>

            <div className="savedDesigns__io">
                <div className="savedDesigns__ioTitle">Backup (Export/Import)</div>
                <div className="row row--spaced" style={{ marginTop: "0.25rem" }}>
                    <Button type="button" onClick={onExportAll} disabled={!savedDesigns.length}>
                        <UiIcon name="mdi:file-export-outline" className="icon" />
                        Export all
                    </Button>
                    <Button type="button" onClick={() => importInputRef.current?.click()}>
                        <UiIcon name="mdi:file-import-outline" className="icon" />
                        Import
                    </Button>
                    <input
                        ref={importInputRef}
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
                    Export creates a JSON backup you can import later (or on another device). Import merges with your existing saved remotes.
                </p>
            </div>

            {importExportStatus ? (
                <p style={{ margin: "0.5rem 0 0", fontSize: "0.85rem", color: importExportStatus.type === "error" ? "#b00020" : "#1b5e20" }}>{importExportStatus.message}</p>
            ) : null}

            <p style={{ margin: "0.5rem 0 0", fontSize: "0.85rem", opacity: 0.85 }}>
                Saved in your browser (localStorage). It remains after reloads, but will be removed if you clear site data.
            </p>
        </fieldset>
    );
}
