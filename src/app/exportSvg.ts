import ibmPlexSans600Url from "@fontsource/ibm-plex-sans/files/ibm-plex-sans-latin-600-normal.woff2?url";
import { SVG_TEXT_FONT_FAMILY, SVG_TEXT_FONT_NAME } from "../render/fonts";

const SVG_NS = "http://www.w3.org/2000/svg";
const FONT_FACE_STYLE_ID = "ha-remote-labeler-export-fonts";

let exportFontCssPromise: Promise<string> | null = null;

export function downloadTextFile(filename: string, content: string, mime = "text/plain") {
    const blob = new Blob([content], { type: mime });
    const url = URL.createObjectURL(blob);

    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    a.remove();

    URL.revokeObjectURL(url);
}

function arrayBufferToBase64(buffer: ArrayBuffer) {
    const bytes = new Uint8Array(buffer);
    const chunkSize = 0x8000;
    let binary = "";

    for (let i = 0; i < bytes.length; i += chunkSize) {
        binary += String.fromCharCode(...bytes.subarray(i, i + chunkSize));
    }

    return btoa(binary);
}

async function loadFontDataUrl(fontUrl: string) {
    const response = await fetch(fontUrl);
    if (!response.ok) {
        throw new Error(`Failed to load SVG export font (${response.status})`);
    }

    const base64 = arrayBufferToBase64(await response.arrayBuffer());
    return `data:font/woff2;base64,${base64}`;
}

export function createSvgExportFontCss(fontDataUrl: string) {
    return [
        "@font-face {",
        `  font-family: "${SVG_TEXT_FONT_NAME}";`,
        "  font-style: normal;",
        "  font-weight: 600;",
        `  src: url("${fontDataUrl}") format("woff2");`,
        "}",
        "text {",
        `  font-family: ${SVG_TEXT_FONT_FAMILY};`,
        "}",
    ].join("\n");
}

async function getExportFontCss() {
    exportFontCssPromise ??= loadFontDataUrl(ibmPlexSans600Url).then(createSvgExportFontCss);

    return exportFontCssPromise;
}

async function injectSvgExportStyles(svg: SVGSVGElement) {
    const style = document.createElementNS(SVG_NS, "style");
    style.setAttribute("id", FONT_FACE_STYLE_ID);
    style.textContent = await getExportFontCss();

    const defs = document.createElementNS(SVG_NS, "defs");
    defs.appendChild(style);

    svg.insertBefore(defs, svg.firstChild);
}

export async function serializeSvg(svg: SVGSVGElement): Promise<string> {
    // clone to avoid modifying on-screen svg
    const clone = svg.cloneNode(true) as SVGSVGElement;

    // Ensure xmlns
    if (!clone.getAttribute("xmlns")) {
        clone.setAttribute("xmlns", SVG_NS);
    }

    await injectSvgExportStyles(clone);

    // Optional: remove React/data attributes if any (usually none)
    const serializer = new XMLSerializer();
    let xml = serializer.serializeToString(clone);

    // XML header helps some tools
    if (!xml.startsWith("<?xml")) {
        xml = `<?xml version="1.0" encoding="UTF-8"?>\n` + xml;
    }

    return xml;
}
