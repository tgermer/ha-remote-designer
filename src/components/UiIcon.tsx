import { getMdiPath } from "../app/mdi";

type UiIconProps = {
    name: string;
    size?: number;
    className?: string;
    title?: string;
};

export function UiIcon({ name, size = 18, className, title }: UiIconProps) {
    const d = getMdiPath(name);
    if (!d) return null;

    return (
        <svg width={size} height={size} viewBox="0 0 24 24" className={className} aria-label={title ?? name} role="img">
            <path d={d} fill="currentColor" />
        </svg>
    );
}
