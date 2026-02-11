import { forwardRef, type ButtonHTMLAttributes } from "react";
import "./Button.css";

export type ButtonVariant = "default" | "primary" | "danger";

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
    variant?: ButtonVariant;
}

export const BUTTON_VARIANT_CLASSES: Record<ButtonVariant, string | undefined> = {
    default: undefined,
    primary: "btn--primary",
    danger: "btn--danger",
};

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
    ({ variant = "default", className, children, type = "button", ...rest }, ref) => {
        const variantClass = BUTTON_VARIANT_CLASSES[variant];
        const classNames = ["btn", variantClass, className].filter(Boolean).join(" ");

        return (
            <button ref={ref} className={classNames} type={type} {...rest}>
                {children}
            </button>
        );
    },
);

Button.displayName = "Button";
