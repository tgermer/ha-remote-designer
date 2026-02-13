import { forwardRef, type ButtonHTMLAttributes } from "react";
import { BUTTON_VARIANT_CLASSES, type ButtonVariant } from "./buttonVariants";
import "./Button.css";

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
    variant?: ButtonVariant;
}

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
