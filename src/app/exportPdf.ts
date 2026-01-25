import { jsPDF } from "jspdf";
import { svg2pdf } from "svg2pdf.js";
import { downloadBlob } from "./exportPng";

type PdfSvgsParams = {
    filename: string;
    svgTexts: string[];
    widthMm: number;
    heightMm: number;
};

function parseSvg(svgText: string) {
    const parser = new DOMParser();
    const doc = parser.parseFromString(svgText, "image/svg+xml");
    const svg = doc.querySelector("svg");
    if (!svg) throw new Error("SVG element not found");
    return svg;
}

export async function downloadPdfFromSvgs(params: PdfSvgsParams) {
    const { filename, svgTexts, widthMm, heightMm } = params;
    if (!svgTexts.length) return;

    const orientation = widthMm > heightMm ? "landscape" : "portrait";
    const pdf = new jsPDF({
        unit: "mm",
        format: [widthMm, heightMm],
        orientation,
        compress: true,
    });

    for (let i = 0; i < svgTexts.length; i += 1) {
        if (i > 0) {
            pdf.addPage([widthMm, heightMm], orientation);
        }
        const svg = parseSvg(svgTexts[i]);
        await svg2pdf(svg, pdf, { x: 0, y: 0, width: widthMm, height: heightMm });
    }

    const blob = pdf.output("blob");
    downloadBlob(`${filename}.pdf`, blob);
}

export async function downloadPdfFromSvg(params: { filename: string; svgText: string; widthMm: number; heightMm: number }) {
    return downloadPdfFromSvgs({ ...params, svgTexts: [params.svgText] });
}
