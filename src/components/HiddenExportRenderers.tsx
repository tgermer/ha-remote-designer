import type { RefObject } from "react";
import type { DesignState } from "../app/types";
import type { ButtonDef, RemoteTemplate } from "../app/remotes";
import { RemoteSvg } from "../render/RemoteSvg";
import { ButtonLabelSvg } from "../render/buttonLabelSvg";

type HiddenExportRenderersProps = {
    exportRemoteHostRef: RefObject<HTMLDivElement | null>;
    exportButtonHostRef: RefObject<HTMLDivElement | null>;
    template: RemoteTemplate;
    state: DesignState;
    exportButton: ButtonDef | null;
    labelWidthMm: number;
    labelHeightMm: number;
    showScaleBar: boolean;
    showWatermark: boolean;
    watermarkText: string;
    watermarkOpacity: number;
};

export function HiddenExportRenderers(props: HiddenExportRenderersProps) {
    const { exportRemoteHostRef, exportButtonHostRef, template, state, exportButton, labelWidthMm, labelHeightMm, showScaleBar, showWatermark, watermarkText, watermarkOpacity } = props;

    return (
        <>
            <div ref={exportRemoteHostRef} className="hidden">
                <RemoteSvg
                    key={`${template.id}-${template.widthMm}-${template.heightMm}-${template.cornerMm}`}
                    template={template}
                    state={state}
                    background="white"
                    showWatermark={showWatermark}
                    watermarkText={watermarkText}
                    watermarkOpacity={watermarkOpacity}
                    renderPreviewElements={false}
                    overrides={{
                        showRemoteOutline: state.options.showRemoteOutline,
                        showGuides: false,
                        showButtonOutlines: state.options.showButtonOutlines,
                        showScaleBar,
                    }}
                    exportMode={{ squareButtons: false }}
                />
            </div>

            <div ref={exportButtonHostRef} className="hidden">
                {exportButton && (
                    <ButtonLabelSvg
                        state={state}
                        button={exportButton}
                        labelWidthMm={labelWidthMm}
                        labelHeightMm={labelHeightMm}
                        showWatermark={showWatermark}
                        watermarkText={watermarkText}
                        watermarkOpacity={watermarkOpacity}
                    />
                )}
            </div>
        </>
    );
}
