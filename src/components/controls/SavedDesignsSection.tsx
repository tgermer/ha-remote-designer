import { useRef } from "react";
import type { SavedDesign } from "../../app/savedDesigns";

type SavedDesignsSectionProps = {
    saveName: string;
    saveNameError: string;
    onChangeSaveName: (name: string) => void;
    onBlurSaveName: () => void;
    activeSavedId: string | null;
    hasUnsavedChanges: boolean;
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
                <button type="button" onClick={onSaveActive} disabled={!activeSavedId || !hasUnsavedChanges || !saveName.trim() || !!saveNameError}>
                    Save
                </button>
                <button type="button" onClick={onSaveAsNew} disabled={!saveName.trim()}>
                    Save as
                </button>
            </div>
            {activeSavedId && <p style={{ margin: 0, fontSize: "0.85rem", opacity: 0.85 }}>{hasUnsavedChanges ? "Unsaved changes" : "All changes saved"}</p>}

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
                <button type="button" onClick={onLoadSelected} disabled={!selectedSavedId}>
                    Load
                </button>
                <button type="button" onClick={onDeleteSelected} disabled={!selectedSavedId}>
                    Delete
                </button>
            </div>

            <div className="savedDesigns__io">
                <div className="savedDesigns__ioTitle">Backup (Export/Import)</div>
                <div className="row row--spaced" style={{ marginTop: "0.25rem" }}>
                    <button type="button" onClick={onExportAll} disabled={!savedDesigns.length}>
                        Export all
                    </button>
                </div>

                <div className="row row--spaced">
                    <button type="button" onClick={() => importInputRef.current?.click()}>
                        Import
                    </button>
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
