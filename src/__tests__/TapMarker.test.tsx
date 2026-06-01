import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { initial } from "../app/stateUtils";
import { RemoteSvg } from "../render/RemoteSvg";
import { TapMarker } from "../render/TapMarker";

describe("TapMarker", () => {
    it("renders tap counts as circles and long press as a capsule", () => {
        expect(renderToStaticMarkup(<TapMarker tap="single" />).match(/<circle/g)?.length).toBe(1);
        expect(renderToStaticMarkup(<TapMarker tap="double" />).match(/<circle/g)?.length).toBe(2);
        expect(renderToStaticMarkup(<TapMarker tap="triple" />).match(/<circle/g)?.length).toBe(3);

        const longMarkup = renderToStaticMarkup(<TapMarker tap="long" />);
        expect(longMarkup).toContain("<rect");
        expect(longMarkup).not.toContain("<circle");
    });

    it("renders all four tap markers in the remote SVG", () => {
        const markup = renderToStaticMarkup(
            <RemoteSvg
                template={{
                    id: "test",
                    name: "Test",
                    widthMm: 40,
                    heightMm: 20,
                    cornerMm: 0,
                    buttons: [{ id: "button_1", xMm: 1, yMm: 1, wMm: 38, hMm: 18, rMm: 0 }],
                }}
                state={{
                    ...initial,
                    remoteId: "test",
                    tapsEnabled: ["single", "double", "triple", "long"],
                    buttonConfigs: {
                        button_1: {
                            icons: {},
                            texts: {
                                single: "S",
                                double: "D",
                                triple: "T",
                                long: "L",
                            },
                        },
                    },
                    options: {
                        ...initial.options,
                        showRemoteOutline: false,
                        showButtonOutlines: false,
                        showScaleBar: false,
                    },
                }}
            />,
        );

        expect(markup.match(/<circle/g)?.length).toBe(6);
        expect(markup).toContain("<rect");
        expect(markup).toContain(">S<");
        expect(markup).toContain(">D<");
        expect(markup).toContain(">T<");
        expect(markup).toContain(">L<");
    });
});
