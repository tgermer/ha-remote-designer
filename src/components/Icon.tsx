import { getMdiPath } from "../app/mdi";

export function MdiPath({ name }: { name: string }) {
    const d = getMdiPath(name);
    if (!d) return null;
    return <path d={d} />;
}
