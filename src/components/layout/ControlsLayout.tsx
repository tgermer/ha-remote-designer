import type { ReactNode } from "react";

type ControlsLayoutProps = {
    left: ReactNode;
    right: ReactNode;
    full?: ReactNode;
};

export function ControlsLayout(props: ControlsLayoutProps) {
    const { left, right, full } = props;

    return (
        <div className="controlsLayout">
            <div className="controlsLayout__column">{left}</div>
            <div className="controlsLayout__column">{right}</div>
            {full ? <div className="controlsLayout__full">{full}</div> : null}
        </div>
    );
}
