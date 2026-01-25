import type { DesignState, TapType } from "../../app/types";
import { TAP_ORDER } from "../../app/types";
import { IconPicker } from "../IconPicker";

type ButtonsSectionProps = {
    buttonIds: string[];
    state: DesignState;
    tapLabel: (tap: TapType) => string;
    onSetIcon: (buttonId: string, tap: TapType, icon?: string) => void;
    onToggleStrike: (buttonId: string, tap: TapType, checked: boolean) => void;
    highlightedButtonId?: string | null;
};

export function ButtonsSection(props: ButtonsSectionProps) {
    const { buttonIds, state, tapLabel, onSetIcon, onToggleStrike, highlightedButtonId } = props;

    return (
        <section>
            <h2>Buttons</h2>
            {buttonIds.map((id) => (
                <section
                    key={id}
                    id={`button-config-${id}`}
                    data-button-id={id}
                    className={`button-config${highlightedButtonId === id ? " button-config--flash" : ""}`}
                >
                    <h3>{id.startsWith("label_") ? `Sticker ${id.slice("label_".length)}` : `${id.toUpperCase()} Button`}</h3>
                    {TAP_ORDER.map((tap) => (
                        <div key={tap}>
                            <h4>{tapLabel(tap)}</h4>
                            <IconPicker value={state.buttonConfigs[id]?.icons?.[tap]} onChange={(v) => onSetIcon(id, tap, v)} />
                            <p>
                                {(() => {
                                    const iconName = state.buttonConfigs[id]?.icons?.[tap];
                                    if (!iconName) return null;

                                    // Hide strikethrough toggle if the icon already represents an "off" state
                                    if (typeof iconName === "string" && iconName.toLowerCase().includes("off")) return null;

                                    return (
                                        <label className="option">
                                            <input
                                                type="checkbox"
                                                checked={state.buttonConfigs[id]?.strike?.[tap] ?? false}
                                                onChange={(e) => onToggleStrike(id, tap, e.target.checked)}
                                            />
                                            Strikethrough (manual “off”)
                                        </label>
                                    );
                                })()}
                            </p>
                        </div>
                    ))}
                </section>
            ))}
        </section>
    );
}
