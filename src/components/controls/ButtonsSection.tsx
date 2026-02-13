import { useState } from "react";
import type { DesignState, StrikeStyle, TapType } from "../../app/types";
import { TAP_ORDER } from "../../app/types";
import { IconPicker } from "../IconPicker";
import { useTranslation } from "react-i18next";
type ButtonsSectionProps = {
    buttonIds: string[];
    state: DesignState;
    tapLabel: (tap: TapType) => string;
    onSetIcon: (buttonId: string, tap: TapType, icon?: string) => void;
    onSetButtonText: (buttonId: string, tap: TapType, text?: string) => void;
    onToggleStrike: (buttonId: string, tap: TapType, checked: boolean) => void;
    onSetStrikeStyle: (buttonId: string, tap: TapType, style: StrikeStyle) => void;
    onSetIconColor: (buttonId: string, tap: TapType, color?: string) => void;
    onSetButtonFill: (buttonId: string, color?: string) => void;
    highlightedButtonId?: string | null;
};

export function ButtonsSection(props: ButtonsSectionProps) {
    const { t } = useTranslation();
    const { buttonIds, state, tapLabel, onSetIcon, onSetButtonText, onToggleStrike, onSetStrikeStyle, onSetIconColor, onSetButtonFill, highlightedButtonId } = props;
    const defaultButtonFill = "#e6e6e6";
    const [contentModeOverrides, setContentModeOverrides] = useState<Record<string, "icon" | "text">>({});

    return (
        <section>
            <h2>{t("controls.buttons.title")}</h2>
            {buttonIds.map((id) => (
                <section
                    key={id}
                    id={`button-config-${id}`}
                    data-button-id={id}
                    className={`button-config${highlightedButtonId === id ? " button-config--flash" : ""}`}
                >
                    <h3>{id.startsWith("label_") ? t("controls.buttons.sticker", { index: id.slice("label_".length) }) : t("controls.buttons.button", { id: id.toUpperCase() })}</h3>
                    {(() => {
                        const buttonFill = state.buttonConfigs[id]?.buttonFill;
                        const hasButtonFill = typeof buttonFill === "string" && buttonFill.length > 0;

                        return (
                            <div className="option-row">
                                <label className="option">
                                    <input
                                        name={`buttonFillEnabled-${id}`}
                                        type="checkbox"
                                        checked={hasButtonFill}
                                        onChange={(e) => onSetButtonFill(id, e.target.checked ? buttonFill || defaultButtonFill : undefined)}
                                    />
                                    {t("controls.buttons.customBackground")}
                                </label>
                                {hasButtonFill && (
                                    <label className="option option--inline">
                                        {t("controls.buttons.backgroundColor")}
                                        <input name={`buttonFillColor-${id}`} type="color" value={buttonFill} onChange={(e) => onSetButtonFill(id, e.target.value)} />
                                    </label>
                                )}
                            </div>
                        );
                    })()}
                    {TAP_ORDER.map((tap) => (
                        <div key={tap}>
                            <h4>{tapLabel(tap)}</h4>
                            {(() => {
                                const iconValue = state.buttonConfigs[id]?.icons?.[tap];
                                const textValue = state.buttonConfigs[id]?.texts?.[tap] ?? "";
                                const modeKey = `${id}:${tap}`;
                                const mode: "icon" | "text" = contentModeOverrides[modeKey] ?? (textValue ? "text" : "icon");

                                return (
                                    <>
                                        <div className="buttonContentMode" role="radiogroup" aria-label={`${tapLabel(tap)} content mode`}>
                                            <label className="option">
                                                <input
                                                    name={`buttonContentMode-${id}-${tap}`}
                                                    type="radio"
                                                    checked={mode === "icon"}
                                                    onChange={() => {
                                                        setContentModeOverrides((prev) => ({ ...prev, [modeKey]: "icon" }));
                                                        onSetButtonText(id, tap, undefined);
                                                    }}
                                                />
                                                {t("controls.buttons.icon")}
                                            </label>
                                            <label className="option">
                                                <input
                                                    name={`buttonContentMode-${id}-${tap}`}
                                                    type="radio"
                                                    checked={mode === "text"}
                                                    onChange={() => {
                                                        setContentModeOverrides((prev) => ({ ...prev, [modeKey]: "text" }));
                                                        onSetIcon(id, tap, undefined);
                                                    }}
                                                />
                                                {t("controls.buttons.text")}
                                            </label>
                                        </div>

                                        {mode === "icon" ? (
                                            <IconPicker
                                                value={iconValue}
                                                onChange={(v) => {
                                                    setContentModeOverrides((prev) => ({ ...prev, [modeKey]: "icon" }));
                                                    onSetIcon(id, tap, v);
                                                }}
                                            />
                                        ) : (
                                            <div className="buttonTextInputWrap">
                                                <textarea
                                                    name={`buttonText-${id}-${tap}`}
                                                    className="buttonTextInput"
                                                    value={textValue}
                                                    onChange={(e) => {
                                                        setContentModeOverrides((prev) => ({ ...prev, [modeKey]: "text" }));
                                                        onSetButtonText(id, tap, e.target.value);
                                                    }}
                                                    placeholder={t("controls.buttons.textPlaceholder")}
                                                    rows={2}
                                                />
                                                <p className="option__note">{t("controls.buttons.textHint")}</p>
                                            </div>
                                        )}
                                    </>
                                );
                            })()}
                            <div className="option-row">
                                {(() => {
                                    const iconName = state.buttonConfigs[id]?.icons?.[tap];
                                    const textValue = state.buttonConfigs[id]?.texts?.[tap];
                                    const hasContent = Boolean(iconName || (textValue && textValue.trim()));
                                    if (!hasContent) return null;

                                    const isOffIcon = typeof iconName === "string" && iconName.toLowerCase().includes("off");
                                    const canStrike = !!textValue || (!!iconName && !isOffIcon);
                                    const strikeStyle = state.buttonConfigs[id]?.strikeStyle?.[tap] ?? "diagonal";
                                    const iconColor = state.buttonConfigs[id]?.iconColors?.[tap];
                                    const hasIconColor = typeof iconColor === "string" && iconColor.length > 0;

                                    return (
                                        <>
                                            {canStrike && (
                                                <label className="option">
                                                    <input
                                                        name={`buttonStrike-${id}-${tap}`}
                                                        type="checkbox"
                                                        checked={state.buttonConfigs[id]?.strike?.[tap] ?? false}
                                                        onChange={(e) => onToggleStrike(id, tap, e.target.checked)}
                                                    />
                                                    {t("controls.buttons.strikethrough")}
                                                </label>
                                            )}
                                            {textValue && (
                                                <label className="option option--inline">
                                                    {t("controls.buttons.strikeStyle")}
                                                    <select name={`buttonStrikeStyle-${id}-${tap}`} value={strikeStyle} onChange={(e) => onSetStrikeStyle(id, tap, e.target.value as StrikeStyle)}>
                                                        <option value="diagonal">{t("controls.buttons.diagonal")}</option>
                                                        <option value="straight">{t("controls.buttons.straight")}</option>
                                                    </select>
                                                </label>
                                            )}
                                            <label className="option">
                                                    <input
                                                        name={`buttonIconColorEnabled-${id}-${tap}`}
                                                        type="checkbox"
                                                        checked={hasIconColor}
                                                        onChange={(e) => onSetIconColor(id, tap, e.target.checked ? iconColor || state.options.iconColor || "#000000" : undefined)}
                                                    />
                                                {t("controls.buttons.customContentColor")}
                                            </label>
                                            {hasIconColor && (
                                                <label className="option option--inline">
                                                    {t("controls.buttons.contentColor")}
                                                    <input name={`buttonIconColor-${id}-${tap}`} type="color" value={iconColor} onChange={(e) => onSetIconColor(id, tap, e.target.value)} />
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
