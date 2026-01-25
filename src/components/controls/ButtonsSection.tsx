import type { DesignState, TapType } from "../../app/types";
import { TAP_ORDER } from "../../app/types";
import { IconPicker } from "../IconPicker";

type ButtonsSectionProps = {
    buttonIds: string[];
    state: DesignState;
    tapLabel: (tap: TapType) => string;
    onSetIcon: (buttonId: string, tap: TapType, icon?: string) => void;
    onToggleStrike: (buttonId: string, tap: TapType, checked: boolean) => void;
    onSetIconColor: (buttonId: string, tap: TapType, color?: string) => void;
    onSetButtonFill: (buttonId: string, color?: string) => void;
    highlightedButtonId?: string | null;
};

export function ButtonsSection(props: ButtonsSectionProps) {
    const { buttonIds, state, tapLabel, onSetIcon, onToggleStrike, onSetIconColor, onSetButtonFill, highlightedButtonId } = props;
    const defaultButtonFill = "#e6e6e6";

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
                    {(() => {
                        const buttonFill = state.buttonConfigs[id]?.buttonFill;
                        const hasButtonFill = typeof buttonFill === "string" && buttonFill.length > 0;

                        return (
                            <div className="option-row">
                                <label className="option">
                                    <input
                                        type="checkbox"
                                        checked={hasButtonFill}
                                        onChange={(e) => onSetButtonFill(id, e.target.checked ? buttonFill || defaultButtonFill : undefined)}
                                    />
                                    Custom button background
                                </label>
                                {hasButtonFill && (
                                    <label className="option option--inline">
                                        Background color
                                        <input type="color" value={buttonFill} onChange={(e) => onSetButtonFill(id, e.target.value)} />
                                    </label>
                                )}
                            </div>
                        );
                    })()}
                    {TAP_ORDER.map((tap) => (
                        <div key={tap}>
                            <h4>{tapLabel(tap)}</h4>
                            <IconPicker value={state.buttonConfigs[id]?.icons?.[tap]} onChange={(v) => onSetIcon(id, tap, v)} />
                            <div className="option-row">
                                {(() => {
                                    const iconName = state.buttonConfigs[id]?.icons?.[tap];
                                    if (!iconName) return null;

                                    const isOffIcon = typeof iconName === "string" && iconName.toLowerCase().includes("off");
                                    const iconColor = state.buttonConfigs[id]?.iconColors?.[tap];
                                    const hasIconColor = typeof iconColor === "string" && iconColor.length > 0;

                                    return (
                                        <>
                                            {!isOffIcon && (
                                                <label className="option">
                                                    <input
                                                        type="checkbox"
                                                        checked={state.buttonConfigs[id]?.strike?.[tap] ?? false}
                                                        onChange={(e) => onToggleStrike(id, tap, e.target.checked)}
                                                    />
                                                    Strikethrough (manual “off”)
                                                </label>
                                            )}
                                            <label className="option">
                                                <input
                                                    type="checkbox"
                                                    checked={hasIconColor}
                                                    onChange={(e) => onSetIconColor(id, tap, e.target.checked ? iconColor || state.options.iconColor || "#000000" : undefined)}
                                                />
                                                Custom icon color
                                            </label>
                                            {hasIconColor && (
                                                <label className="option option--inline">
                                                    Icon color
                                                    <input type="color" value={iconColor} onChange={(e) => onSetIconColor(id, tap, e.target.value)} />
                                                </label>
                                            )}
                                        </>
                                    );
                                })()}
                            </div>
                        </div>
                    ))}
                </section>
            ))}
        </section>
    );
}
