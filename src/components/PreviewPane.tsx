import type { DesignState } from "../app/types";
import type { RemoteTemplate } from "../app/remotes";
import { RemoteSvg } from "../render/RemoteSvg";
import { UiIcon } from "./UiIcon";

type PreviewPaneProps = {
    template: RemoteTemplate;
    state: DesignState;
    showWatermark: boolean;
    watermarkText: string;
    watermarkOpacity: number;
    isStickerSheet?: boolean;
    pageIndex?: number;
    pages?: number;
    onChangePage?: (next: number) => void;
    className?: string;
};

export function PreviewPane(props: PreviewPaneProps) {
    const { template, state, showWatermark, watermarkText, watermarkOpacity, isStickerSheet, pageIndex = 0, pages = 0, onChangePage, className } = props;
    const showPager = isStickerSheet && pages > 1 && !!onChangePage;
    const currentPage = Math.min(Math.max(0, pageIndex), Math.max(0, pages - 1));

    return (
        <aside className={`preview ${isStickerSheet ? "preview--sheet" : ""} ${className ?? ""}`.trim()}>
            {showPager && (
                <div className="preview__pager">
                    <button type="button" className="preview__pagerBtn" onClick={() => onChangePage?.(Math.max(0, currentPage - 1))} disabled={currentPage <= 0}>
                        <UiIcon name="mdi:chevron-left" className="icon" />
                        <span>Prev</span>
                    </button>
                    <span>
                        Page{" "}
                        <select value={currentPage} onChange={(e) => onChangePage?.(Number(e.target.value))}>
                            {Array.from({ length: pages }, (_, i) => (
                                <option key={i} value={i}>
                                    {i + 1}
                                </option>
                            ))}
                        </select>{" "}
                        of {pages}
                    </span>
                    <button type="button" className="preview__pagerBtn" onClick={() => onChangePage?.(Math.min(pages - 1, currentPage + 1))} disabled={currentPage >= pages - 1}>
                        <span>Next</span>
                        <UiIcon name="mdi:chevron-right" className="icon" />
                    </button>
                </div>
            )}
            <RemoteSvg template={template} state={state} background="white" showWatermark={showWatermark} watermarkText={watermarkText} watermarkOpacity={watermarkOpacity} overrides={{ showScaleBar: false }} />
        </aside>
    );
}
