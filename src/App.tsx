import React, { useMemo, useState, useEffect, useRef } from "react";
import "./index.css";
import type { DesignState, TapType } from "./app/types";
import { REMOTES } from "./app/remotes";
import { RemoteSvg } from "./render/RemoteSvg";
import { IconPicker } from "./components/IconPicker";
import { loadFromHash, saveToHash } from "./app/urlState";
import { serializeSvg, downloadTextFile } from "./app/exportSvg";
import JSZip from "jszip";
import { svgTextToPngBlobMm, downloadBlob } from "./app/exportPng";
import { ButtonLabelSvg } from "./render/buttonLabelSvg";

const initial: DesignState = {
    remoteId: "hue_dimmer_v1",
    tapsEnabled: ["single", "double", "long"],
    buttonConfigs: {
        on: { icons: { single: "mdi:lightbulb-on-outline" } },
        up: { icons: { single: "mdi:brightness-5" } },
        down: { icons: { single: "mdi:brightness-4" } },
        off: { icons: { single: "mdi:lightbulb-off-outline" } },
    },
    options: {
        showTapMarkersAlways: true,
        showTapDividers: true,
        showRemoteOutline: true,
        showButtonOutlines: true,
        showGuides: false,
        autoIconSizing: true,
        fixedIconMm: 8,
        tapMarkerFill: "outline",
    },
};

function tapLabel(t: TapType) {
    if (t === "single") return "Tap";
    if (t === "double") return "Double Tap";
    return "Long Press";
}

function nextFrame() {
    return new Promise<void>((resolve) => requestAnimationFrame(() => resolve()));
}

export default function App() {
    const [state, setState] = useState<DesignState>(() => {
        const fromUrl = loadFromHash<DesignState>();
        if (fromUrl && !(fromUrl.options as any)?.tapMarkerFill) {
            return { ...fromUrl, options: { ...fromUrl.options, tapMarkerFill: "outline" } };
        }
        return fromUrl ?? initial;
    });

    useEffect(() => {
        const t = window.setTimeout(() => saveToHash(state), 150);
        return () => window.clearTimeout(t);
    }, [state]);

    const template = useMemo(() => REMOTES.find((r) => r.id === state.remoteId) ?? REMOTES[0], [state.remoteId]);

    // Ensure buttonConfigs exist for current remote
    useEffect(() => {
        setState((s) => {
            const next = { ...s, buttonConfigs: { ...s.buttonConfigs } };
            for (const b of template.buttons) {
                if (!next.buttonConfigs[b.id]) next.buttonConfigs[b.id] = { icons: {} };
            }
            return next;
        });
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [template.id]);

    const buttonIds = template.buttons.map((b) => b.id);
    const o = state.options;

    const setIcon = (buttonId: string, tap: TapType, icon: string | undefined) => {
        setState((s) => {
            const prev = s.buttonConfigs[buttonId]?.icons ?? {};
            const nextIcons: Partial<Record<TapType, string>> = { ...prev };
            if (icon) nextIcons[tap] = icon;
            else delete (nextIcons as any)[tap];

            return {
                ...s,
                buttonConfigs: {
                    ...s.buttonConfigs,
                    [buttonId]: { icons: nextIcons },
                },
            };
        });
    };

    // ---------------- SVG Export (Remote) ----------------
    const exportRemoteHostRef = useRef<HTMLDivElement | null>(null);

    const exportRemoteSvg = () => {
        const svg = exportRemoteHostRef.current?.querySelector("svg");
        if (!svg) return;

        const xml = serializeSvg(svg);
        downloadTextFile(`${state.remoteId}-remote-buttons-only.svg`, xml, "image/svg+xml");
    };

    // ---------------- ZIP Export (Buttons PNG 40x30) ----------------
    const [dpi, setDpi] = useState<number>(203);
    const [exportButtonId, setExportButtonId] = useState<string | null>(null);
    const exportButtonHostRef = useRef<HTMLDivElement | null>(null);
    const [isZipping, setIsZipping] = useState(false);

    const exportZipAllButtonsPng = async () => {
        if (isZipping) return;
        setIsZipping(true);

        const labelW = 40;
        const labelH = 30;

        const zip = new JSZip();
        const folder = zip.folder(state.remoteId) ?? zip;

        for (const id of buttonIds) {
            setExportButtonId(id);
            await nextFrame();
            await nextFrame();

            const svg = exportButtonHostRef.current?.querySelector("svg");
            if (!svg) continue;

            const svgText = serializeSvg(svg);

            const pngBlob = await svgTextToPngBlobMm({
                svgText,
                size: { widthMm: labelW, heightMm: labelH, dpi },
            });

            folder.file(`${id}.png`, pngBlob);
        }

        setExportButtonId(null);

        const zipBlob = await zip.generateAsync({ type: "blob" });
        downloadBlob(`${state.remoteId}-buttons-${labelW}x${labelH}mm-${dpi}dpi.zip`, zipBlob);

        setIsZipping(false);
    };

    const currentExportButton = exportButtonId ? template.buttons.find((b) => b.id === exportButtonId) : null;

    return (
        <div style={{ padding: 16, display: "grid", gridTemplateColumns: "420px 1fr", gap: 16 }}>
            {/* Left */}
            <div style={{ display: "grid", gap: 12 }}>
                <div style={{ border: "1px solid #ddd", borderRadius: 12, padding: 12, background: "white" }}>
                    <div style={{ display: "grid", gap: 10 }}>
                        <div style={{ fontWeight: 700 }}>Optionen</div>

                        <label style={{ display: "grid", gap: 6 }}>
                            Remote
                            <select value={state.remoteId} onChange={(e) => setState((s) => ({ ...s, remoteId: e.target.value as any }))} style={{ padding: 8, borderRadius: 8, border: "1px solid #ccc" }}>
                                {REMOTES.map((r) => (
                                    <option key={r.id} value={r.id}>
                                        {r.name}
                                    </option>
                                ))}
                            </select>
                        </label>

                        <div style={{ display: "flex", gap: 8, flexWrap: "wrap", alignItems: "center" }}>
                            <button onClick={() => setState((s) => ({ ...s, tapsEnabled: ["single"] }))}>Single</button>
                            <button onClick={() => setState((s) => ({ ...s, tapsEnabled: ["single", "double"] }))}>Single + Double</button>
                            <button onClick={() => setState((s) => ({ ...s, tapsEnabled: ["single", "double", "long"] }))}>All</button>

                            <button
                                onClick={async () => {
                                    try {
                                        await navigator.clipboard.writeText(window.location.href);
                                    } catch {}
                                }}
                            >
                                Share-Link kopieren
                            </button>

                            <button onClick={exportRemoteSvg}>Export SVG (Remote)</button>

                            <label style={{ display: "flex", alignItems: "center", gap: 8, marginLeft: 8 }}>
                                PNG DPI:
                                <select value={dpi} onChange={(e) => setDpi(Number(e.target.value))}>
                                    <option value={203}>203</option>
                                    <option value={300}>300</option>
                                </select>
                            </label>

                            <button onClick={exportZipAllButtonsPng} disabled={isZipping}>
                                {isZipping ? "ZIP wird erstellt…" : "Export ZIP (PNGs 40×30)"}
                            </button>
                        </div>

                        <label>
                            <input type="checkbox" checked={o.showTapMarkersAlways} onChange={(e) => setState((s) => ({ ...s, options: { ...s.options, showTapMarkersAlways: e.target.checked } }))} /> Tap-Marker auch bei Einzel-Icon
                        </label>

                        <label>
                            <input type="checkbox" checked={o.showTapDividers} onChange={(e) => setState((s) => ({ ...s, options: { ...s.options, showTapDividers: e.target.checked } }))} /> Trennlinien bei Multi-Icons
                        </label>

                        <label style={{ display: "flex", alignItems: "center", gap: 8 }}>
                            Tap-Marker Stil:
                            <select value={o.tapMarkerFill} onChange={(e) => setState((s) => ({ ...s, options: { ...s.options, tapMarkerFill: e.target.value as any } }))}>
                                <option value="outline">Outline</option>
                                <option value="filled">Filled</option>
                            </select>
                        </label>

                        <label>
                            <input type="checkbox" checked={o.showRemoteOutline} onChange={(e) => setState((s) => ({ ...s, options: { ...s.options, showRemoteOutline: e.target.checked } }))} /> Remote-Umriss
                        </label>

                        <label>
                            <input type="checkbox" checked={o.showButtonOutlines} onChange={(e) => setState((s) => ({ ...s, options: { ...s.options, showButtonOutlines: e.target.checked } }))} /> Button-Umrandung
                        </label>

                        <label>
                            <input type="checkbox" checked={o.autoIconSizing} onChange={(e) => setState((s) => ({ ...s, options: { ...s.options, autoIconSizing: e.target.checked } }))} /> Auto-Icon-Sizing
                        </label>

                        {!o.autoIconSizing && (
                            <label style={{ display: "flex", alignItems: "center", gap: 6 }}>
                                Icon-Größe (mm):
                                <input
                                    type="number"
                                    min={4}
                                    max={14}
                                    step={0.5}
                                    value={o.fixedIconMm}
                                    onChange={(e) =>
                                        setState((s) => ({
                                            ...s,
                                            options: { ...s.options, fixedIconMm: Number(e.target.value) || 8 },
                                        }))
                                    }
                                    style={{ width: 80 }}
                                />
                            </label>
                        )}
                    </div>
                </div>

                <div style={{ border: "1px solid #ddd", borderRadius: 12, padding: 12, background: "white" }}>
                    <div style={{ fontWeight: 700, marginBottom: 10 }}>Tasten</div>

                    <div style={{ display: "grid", gap: 16 }}>
                        {buttonIds.map((buttonId) => (
                            <div key={buttonId} style={{ borderTop: "1px solid #eee", paddingTop: 12 }}>
                                <div style={{ fontWeight: 700, marginBottom: 8 }}>{buttonId.toUpperCase()}</div>

                                {(["single", "double", "long"] as TapType[]).map((tap) => (
                                    <div key={tap} style={{ marginBottom: 14 }}>
                                        <div style={{ fontSize: 12, fontWeight: 700, marginBottom: 6 }}>{tapLabel(tap)}</div>
                                        <IconPicker value={state.buttonConfigs[buttonId]?.icons?.[tap]} onChange={(v) => setIcon(buttonId, tap, v)} />
                                    </div>
                                ))}
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* Right */}
            <div
                style={{
                    position: "sticky",
                    top: 16,
                    alignSelf: "start",
                    height: "fit-content",
                    maxHeight: "calc(100vh - 32px)",
                    overflow: "auto",
                }}
            >
                <div style={{ border: "1px dashed #bbb", padding: 12, width: "fit-content", background: "white" }}>
                    <RemoteSvg template={template} state={state} />
                </div>
            </div>

            {/* Hidden: full remote export preset */}
            <div ref={exportRemoteHostRef} style={{ position: "absolute", left: -100000, top: 0, width: 0, height: 0, overflow: "hidden" }}>
                <RemoteSvg template={template} state={state} overrides={{ showRemoteOutline: false, showGuides: false, showButtonOutlines: true }} exportMode={{ squareButtons: true }} />
            </div>

            {/* Hidden: per-button label renderer */}
            <div ref={exportButtonHostRef} style={{ position: "absolute", left: -100000, top: 0, width: 0, height: 0, overflow: "hidden" }}>
                {currentExportButton ? <ButtonLabelSvg state={state} button={currentExportButton} labelWidthMm={40} labelHeightMm={30} /> : null}
            </div>
        </div>
    );
}
