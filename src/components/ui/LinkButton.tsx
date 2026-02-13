import type { AnchorHTMLAttributes } from "react";
import { BUTTON_VARIANT_CLASSES, type ButtonVariant } from "./buttonVariants";
import "./Button.css";

export interface LinkButtonProps extends AnchorHTMLAttributes<HTMLAnchorElement> {
    variant?: ButtonVariant;
}

export function LinkButton({ variant = "default", className, children, ...rest }: LinkButtonProps) {
    const variantClass = BUTTON_VARIANT_CLASSES[variant];
    const classNames = ["btn", variantClass, className].filter(Boolean).join(" ");

    return (
        <a className={classNames} {...rest}>
            {children}
        </a>
    );
}
