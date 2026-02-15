import type { Icon } from "@tabler/icons-react";

type UiIconProps = {
    icon: Icon;
    size?: number;
    className?: string;
    title?: string;
};
export function UiIcon({ icon: IconComponent, size = 18, className, title }: UiIconProps) {

    return (
        <IconComponent
            size={size}
            stroke="currentColor"
            strokeWidth={2.1}
            className={className}
            aria-label={title}
            role="img"
        />
    );
}
