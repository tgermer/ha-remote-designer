import type { RemoteExample } from "../../app/remotes";
import { IconCheck, IconEye, IconEyeOff } from "@tabler/icons-react";
import { UiIcon } from "../UiIcon";
import { Button } from "../ui/Button";
import { useTranslation } from "react-i18next";

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
    const { t } = useTranslation();
    const { examples, selectedExampleId, onSelectExampleId, selectedExample, previewExampleOn, onTogglePreview, onApplyExample } = props;

    if (!examples.length) return null;

    return (
        <fieldset>
            <legend>{t("controls.examples.legend")}</legend>

            <label className="modelRow__label">
                {t("controls.examples.choose")}
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
                        <UiIcon icon={previewExampleOn ? IconEyeOff : IconEye} className="icon" />
                        {previewExampleOn ? t("controls.examples.stopPreview") : t("controls.examples.preview")}
                    </Button>

                    <Button type="button" disabled={!selectedExample} onClick={onApplyExample}>
                        <UiIcon icon={IconCheck} className="icon" />
                        {t("controls.examples.apply")}
                    </Button>
                </div>
            </div>
        </fieldset>
    );
}
