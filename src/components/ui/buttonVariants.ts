export type ButtonVariant = "default" | "primary" | "danger";

export const BUTTON_VARIANT_CLASSES: Record<ButtonVariant, string | undefined> = {
    default: undefined,
    primary: "btn--primary",
    danger: "btn--danger",
};
