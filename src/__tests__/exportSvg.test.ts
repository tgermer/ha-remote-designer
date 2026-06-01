import { describe, expect, it } from "vitest";
import { createSvgExportFontCss } from "../app/exportSvg";

describe("exportSvg", () => {
    it("creates portable SVG font CSS with embedded IBM Plex Sans and sans-serif fallback", () => {
        const css = createSvgExportFontCss("data:font/woff2;base64,AAA=");

        expect(css).toContain("@font-face");
        expect(css).toContain('font-family: "IBM Plex Sans";');
        expect(css).toContain("font-weight: 600;");
        expect(css).toContain('src: url("data:font/woff2;base64,AAA=") format("woff2");');
        expect(css).toContain('font-family: "IBM Plex Sans", Arial, sans-serif;');
    });
});

