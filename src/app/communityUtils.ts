import type { ButtonDef, CornerRadiiMm, CutoutElement, RemoteTemplate } from "./remotes";
import { clampNumber } from "./stateUtils";

export type CommunityButtonDraft = ButtonDef & { r?: CornerRadiiMm };

export type CommunityDraft = {
    id?: string;
    name: string;
    widthMm: number;
    heightMm: number;
    cornerMm: number;
    manufacturerUrl: string;
    imageUrl: string;
    notes: string;
    tags: string[];
    buttons: CommunityButtonDraft[];
    cutouts: CutoutElement[];
};

export type CommunityDraftEntry = {
    id: string;
    name: string;
    draft: CommunityDraft;
    updatedAt: number;
};

export function createCommunityDraft(overrides?: Partial<CommunityDraft>): CommunityDraft {
    return {
        name: "",
        widthMm: 40,
        heightMm: 120,
        cornerMm: 4,
        manufacturerUrl: "",
        imageUrl: "",
        notes: "",
        tags: ["community"],
        buttons: [
            { id: "button_1", xMm: 4, yMm: 8, wMm: 32, hMm: 18, rMm: 2 },
            { id: "button_2", xMm: 4, yMm: 30, wMm: 32, hMm: 18, rMm: 2 },
        ],
        cutouts: [],
        ...overrides,
    };
}

export type CommunityPayload = {
    template: RemoteTemplate;
    notes: string | null;
    tags: string[];
    manufacturerUrl: string | null;
    imageUrl: string | null;
    appVersion: string;
};

export function buildCommunityTemplate(draft: CommunityDraft, id: RemoteTemplate["id"] = "community_preview"): RemoteTemplate {
    const widthMm = clampNumber(draft.widthMm, 40, 1, 500);
    const heightMm = clampNumber(draft.heightMm, 120, 1, 500);
    const cornerMm = clampNumber(draft.cornerMm, 0, 0, 100);
    const buttons = draft.buttons.map((button, index) => {
        const idValue = button.id.trim() || `button_${index + 1}`;
        const corners = button.r ?? {};
        const hasCorner = [corners.tl, corners.tr, corners.br, corners.bl].some((value) => typeof value === "number" && value > 0);
        return {
            id: idValue,
            xMm: clampNumber(button.xMm, 0, 0, widthMm),
            yMm: clampNumber(button.yMm, 0, 0, heightMm),
            wMm: clampNumber(button.wMm, 10, 1, widthMm),
            hMm: clampNumber(button.hMm, 10, 1, heightMm),
            rMm: hasCorner ? undefined : clampNumber(button.rMm ?? 0, 0, 0, Math.min(widthMm, heightMm)),
            r: hasCorner
                ? {
                      tl: clampNumber(corners.tl ?? 0, 0, 0, Math.min(widthMm, heightMm)),
                      tr: clampNumber(corners.tr ?? 0, 0, 0, Math.min(widthMm, heightMm)),
                      br: clampNumber(corners.br ?? 0, 0, 0, Math.min(widthMm, heightMm)),
                      bl: clampNumber(corners.bl ?? 0, 0, 0, Math.min(widthMm, heightMm)),
                  }
                : undefined,
        };
    });

    const cutouts = draft.cutouts.map((cutout) => {
        if (cutout.kind === "circle") {
            return {
                kind: "circle",
                cxMm: clampNumber(cutout.cxMm, 0, 0, widthMm),
                cyMm: clampNumber(cutout.cyMm, 0, 0, heightMm),
                rMm: clampNumber(cutout.rMm, 1, 0, Math.min(widthMm, heightMm)),
                fill: cutout.fill,
                stroke: cutout.stroke,
                strokeWidthMm: clampNumber(cutout.strokeWidthMm ?? 0.2, 0.2, 0, 5),
                opacity: cutout.opacity,
            } satisfies CutoutElement;
        }
        const corners = cutout.r ?? {};
        const hasCorner = [corners.tl, corners.tr, corners.br, corners.bl].some((value) => typeof value === "number" && value > 0);
        return {
            kind: "rect",
            xMm: clampNumber(cutout.xMm, 0, 0, widthMm),
            yMm: clampNumber(cutout.yMm, 0, 0, heightMm),
            wMm: clampNumber(cutout.wMm, 1, 0, widthMm),
            hMm: clampNumber(cutout.hMm, 1, 0, heightMm),
            rMm: hasCorner ? undefined : clampNumber(cutout.rMm ?? 0, 0, 0, Math.min(widthMm, heightMm)),
            r: hasCorner
                ? {
                      tl: clampNumber(corners.tl ?? 0, 0, 0, Math.min(widthMm, heightMm)),
                      tr: clampNumber(corners.tr ?? 0, 0, Math.min(widthMm, heightMm)),
                      br: clampNumber(corners.br ?? 0, 0, Math.min(widthMm, heightMm)),
                      bl: clampNumber(corners.bl ?? 0, 0, Math.min(widthMm, heightMm)),
                  }
                : undefined,
            fill: cutout.fill,
            stroke: cutout.stroke,
            strokeWidthMm: clampNumber(cutout.strokeWidthMm ?? 0.2, 0.2, 0, 5),
            opacity: cutout.opacity,
        } satisfies CutoutElement;
    });

    const name = draft.name.trim() || "Community Remote";
    const links = [
        ...(draft.manufacturerUrl ? [{ label: "Manufacturer", url: draft.manufacturerUrl }] : []),
        ...(draft.imageUrl ? [{ label: "Image", url: draft.imageUrl }] : []),
    ];

    return {
        id,
        name,
        description: "Community submission (draft)",
        isDraft: true,
        isCommunity: true,
        widthMm,
        heightMm,
        cornerMm,
        buttons,
        cutoutElements: cutouts,
        previewElements: [],
        links,
    } as RemoteTemplate;
}

export function buildCommunityPayload(draft: CommunityDraft, template: RemoteTemplate, appVersion: string): CommunityPayload {
    return {
        template,
        notes: draft.notes.trim() || null,
        tags: draft.tags,
        manufacturerUrl: draft.manufacturerUrl || null,
        imageUrl: draft.imageUrl || null,
        appVersion,
    };
}
