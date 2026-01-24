import type { DesignState } from "../app/types";
import type { RemoteTemplate } from "../app/remotes";
import { RemoteSvg } from "../render/RemoteSvg";

type PreviewPaneProps = {
    template: RemoteTemplate;
    state: DesignState;
    showWatermark: boolean;
    watermarkText: string;
    watermarkOpacity: number;
};

export function PreviewPane(props: PreviewPaneProps) {
    const { template, state, showWatermark, watermarkText, watermarkOpacity } = props;

    return (
        <aside className="preview">
            <RemoteSvg
                template={template}
                state={state}
                background="white"
                showWatermark={showWatermark}
                watermarkText={watermarkText}
                watermarkOpacity={watermarkOpacity}
                overrides={{ showScaleBar: false }}
            />
        </aside>
    );
}
