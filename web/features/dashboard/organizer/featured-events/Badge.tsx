"use client";

export function Badge({ label, className, }: {
    label: string;
    className: string;
}) {
    return (<span className={`inline-flex rounded-full px-3 py-1.5 text-xs font-black capitalize ${className}`}>
      {label.replace("_", " ")}
    </span>);
}
