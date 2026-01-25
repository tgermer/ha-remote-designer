import type { RemoteExample } from "../../app/remotes";
import { UiIcon } from "../UiIcon";

type ExamplesSectionProps = {
    examples: RemoteExample[];
    selectedExampleId: string;
    onSelectExampleId: (id: string) => void;
    selectedExample?: RemoteExample;
    previewExampleOn: boolean;
    onTogglePreview: () => void;
    onApplyExample: () => void;
};

export function ExamplesSection(props: ExamplesSectionProps) {
    const { examples, selectedExampleId, onSelectExampleId, selectedExample, previewExampleOn, onTogglePreview, onApplyExample } = props;

    if (!examples.length) return null;

    return (
        <fieldset>
            <legend>Examples</legend>

            <label className="modelRow__label">
                Choose an example for this remote
                <select value={selectedExampleId} onChange={(e) => onSelectExampleId(e.target.value)}>
                    {examples.map((ex) => (
                        <option key={ex.id} value={ex.id}>
                            {ex.name}
                        </option>
                    ))}
                </select>
            </label>

            {selectedExample?.description ? <p>{selectedExample.description}</p> : null}

            <div className="row">
                <div className="row">
                    <button type="button" className="btn" disabled={!selectedExample} onClick={onTogglePreview}>
                        <UiIcon name={previewExampleOn ? "mdi:eye-off-outline" : "mdi:eye-outline"} className="icon" />
                        {previewExampleOn ? "Stop preview" : "Preview"}
                    </button>

                    <button type="button" className="btn" disabled={!selectedExample} onClick={onApplyExample}>
                        <UiIcon name="mdi:check-bold" className="icon" />
                        Apply
                    </button>
                </div>
            </div>
        </fieldset>
    );
}
