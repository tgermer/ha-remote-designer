import type { RemoteExample } from "../../app/remotes";
import { UiIcon } from "../UiIcon";
import { Button } from "../ui/Button";

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
                <select name="selectedExampleId" value={selectedExampleId} onChange={(e) => onSelectExampleId(e.target.value)}>
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
                    <Button type="button" disabled={!selectedExample} onClick={onTogglePreview}>
                        <UiIcon name={previewExampleOn ? "mdi:eye-off-outline" : "mdi:eye-outline"} className="icon" />
                        {previewExampleOn ? "Stop preview" : "Preview"}
                    </Button>

                    <Button type="button" disabled={!selectedExample} onClick={onApplyExample}>
                        <UiIcon name="mdi:check-bold" className="icon" />
                        Apply
                    </Button>
                </div>
            </div>
        </fieldset>
    );
}
