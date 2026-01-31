import { describe, it, expect } from "vitest";
import { buildCommunityPayload, buildCommunityTemplate, createCommunityDraft } from "../app/communityUtils";

describe("communityUtils", () => {
    it("creates drafts with defaults and respects overrides", () => {
        const draft = createCommunityDraft();
        expect(draft.buttons).toHaveLength(2);
        expect(draft.tags).toContain("community");

        const override = createCommunityDraft({ name: "Custom", tags: ["custom"] });
        expect(override.name).toBe("Custom");
        expect(override.tags).toEqual(["custom"]);
    });

    it("builds templates that clamp measurements and clean IDs", () => {
        const draft = createCommunityDraft({
            name: "  Fancy Remote ",
            widthMm: 600,
            heightMm: -2,
            cornerMm: 150,
            manufacturerUrl: "https://example.com",
            imageUrl: "https://example.com/image.png",
            buttons: [
                { id: "  button_one  ", xMm: -10, yMm: -10, wMm: 1000, hMm: 5, rMm: 10 },
                { id: "button_two", xMm: 100, yMm: 100, wMm: 20, hMm: 20, r: { tl: 5 } },
            ],
            cutouts: [
                { kind: "rect", xMm: -5, yMm: -5, wMm: 600, hMm: 600, rMm: 0 },
                { kind: "circle", cxMm: 50, cyMm: 50, rMm: 30 },
            ],
        });

        const template = buildCommunityTemplate(draft);
        expect(template.widthMm).toBe(500);
        expect(template.heightMm).toBe(1);
        expect(template.cornerMm).toBe(100);
        expect(template.buttons[0].id).toBe("button_one");
        expect(template.buttons[0].xMm).toBe(0);
        expect(template.buttons[0].wMm).toBe(500);
        expect(template.buttons[0].hMm).toBe(1);
        expect(template.buttons[1].r).toBeDefined();
        expect(template.cutoutElements).toHaveLength(2);
        expect(template.links).toEqual(
            expect.arrayContaining([
                { label: "Manufacturer", url: "https://example.com" },
                { label: "Image", url: "https://example.com/image.png" },
            ]),
        );
    });

    it("builds payloads that trim notes and include metadata", () => {
        const draft = createCommunityDraft({
            notes: "  ",
            tags: ["community", "test"],
            manufacturerUrl: "https://example.com",
            imageUrl: "",
        });
        const template = buildCommunityTemplate(draft);
        const payload = buildCommunityPayload(draft, template, "v1");

        expect(payload.notes).toBe(null);
        expect(payload.tags).toEqual(["community", "test"]);
        expect(payload.manufacturerUrl).toBe("https://example.com");
        expect(payload.imageUrl).toBe(null);
        expect(payload.appVersion).toBe("v1");
    });
});
