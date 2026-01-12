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

export function serializeSvg(svg: SVGSVGElement): string {
    // clone to avoid modifying on-screen svg
    const clone = svg.cloneNode(true) as SVGSVGElement;

    // Ensure xmlns
    if (!clone.getAttribute("xmlns")) {
        clone.setAttribute("xmlns", "http://www.w3.org/2000/svg");
    }

    // Optional: remove React/data attributes if any (usually none)
    const serializer = new XMLSerializer();
    let xml = serializer.serializeToString(clone);

    // XML header helps some tools
    if (!xml.startsWith("<?xml")) {
        xml = `<?xml version="1.0" encoding="UTF-8"?>\n` + xml;
    }

    return xml;
}
