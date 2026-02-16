import { useEffect } from "react";

function isExternalHttpLink(anchor: HTMLAnchorElement) {
    const href = anchor.getAttribute("href");
    if (!href) return false;
    try {
        const url = new URL(href, window.location.href);
        if (url.protocol !== "http:" && url.protocol !== "https:") return false;
        return url.origin !== window.location.origin;
    } catch {
        return false;
    }
}

function hasReadableText(anchor: HTMLAnchorElement) {
    return (anchor.textContent ?? "").trim().length > 0;
}

function markExternalLinks(root: ParentNode) {
    const anchors = root.querySelectorAll<HTMLAnchorElement>("a[href]");
    anchors.forEach((anchor) => {
        if (!isExternalHttpLink(anchor)) {
            anchor.removeAttribute("data-external-link");
            anchor.removeAttribute("data-external-link-text");
            return;
        }

        anchor.setAttribute("data-external-link", "true");
        if (hasReadableText(anchor)) {
            anchor.setAttribute("data-external-link-text", "true");
        } else {
            anchor.removeAttribute("data-external-link-text");
        }

        if (anchor.target === "_blank") {
            const rel = anchor.getAttribute("rel") ?? "";
            const relParts = rel
                .split(/\s+/)
                .map((part) => part.trim())
                .filter(Boolean);
            let changed = false;
            if (!relParts.includes("noopener")) {
                relParts.push("noopener");
                changed = true;
            }
            if (!relParts.includes("noreferrer")) {
                relParts.push("noreferrer");
                changed = true;
            }
            if (changed) {
                anchor.setAttribute("rel", relParts.join(" "));
            }
        }
    });
}

export function ExternalLinkEnhancer() {
    useEffect(() => {
        const root = document.body;
        markExternalLinks(root);

        const observer = new MutationObserver((mutations) => {
            for (const mutation of mutations) {
                if (mutation.type === "attributes" && mutation.target instanceof HTMLAnchorElement) {
                    markExternalLinks(mutation.target.parentElement ?? root);
                    continue;
                }
                for (const node of mutation.addedNodes) {
                    if (!(node instanceof Element)) continue;
                    if (node.matches("a[href]")) {
                        markExternalLinks(node.parentElement ?? root);
                    } else {
                        markExternalLinks(node);
                    }
                }
            }
        });

        observer.observe(root, {
            subtree: true,
            childList: true,
            attributes: true,
            attributeFilter: ["href", "target", "rel"],
        });

        return () => observer.disconnect();
    }, []);

    return null;
}
