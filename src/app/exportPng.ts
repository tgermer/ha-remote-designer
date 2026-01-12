export type PngSize = {
    widthMm: number;
    heightMm: number;
    dpi: number;
};

export function mmToPx(mm: number, dpi: number) {
    return Math.round((mm / 25.4) * dpi);
}

export async function svgTextToPngBlob(svgText: string, widthPx: number, heightPx: number): Promise<Blob> {
    const svgBlob = new Blob([svgText], { type: "image/svg+xml" });
    const url = URL.createObjectURL(svgBlob);

    try {
        const img = new Image();
        img.decoding = "async";

        await new Promise<void>((resolve, reject) => {
            img.onload = () => resolve();
            img.onerror = () => reject(new Error("Failed to load SVG into Image()"));
            img.src = url;
        });

        const canvas = document.createElement("canvas");
        canvas.width = widthPx;
        canvas.height = heightPx;

        const ctx = canvas.getContext("2d");
        if (!ctx) throw new Error("Canvas 2D context not available");

        // white background
        ctx.fillStyle = "white";
        ctx.fillRect(0, 0, widthPx, heightPx);

        ctx.drawImage(img, 0, 0, widthPx, heightPx);

        const blob: Blob = await new Promise((resolve, reject) => {
            canvas.toBlob((b) => (b ? resolve(b) : reject(new Error("canvas.toBlob returned null"))), "image/png");
        });

        return blob;
    } finally {
        URL.revokeObjectURL(url);
    }
}

export async function svgTextToPngBlobMm(opts: { svgText: string; size: PngSize }): Promise<Blob> {
    const widthPx = mmToPx(opts.size.widthMm, opts.size.dpi);
    const heightPx = mmToPx(opts.size.heightMm, opts.size.dpi);
    return svgTextToPngBlob(opts.svgText, widthPx, heightPx);
}

export function downloadBlob(filename: string, blob: Blob) {
    const url = URL.createObjectURL(blob);

    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    a.remove();

    URL.revokeObjectURL(url);
}
