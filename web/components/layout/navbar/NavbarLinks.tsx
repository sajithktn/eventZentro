"use client";

import Link from "next/link";
import { ReactNode } from "react";

export function NavbarLink({ href, children, }: {
    href: string;
    children: ReactNode;
}) {
    return (<Link href={href} className="flex items-center gap-1.5 rounded-lg px-3 py-2.5 text-sm font-semibold text-zinc-800 transition hover:bg-zinc-100">
      {children}
    </Link>);
}

export function DropdownLink({ href, icon, children, onClick, }: {
    href: string;
    icon: ReactNode;
    children: ReactNode;
    onClick: () => void;
}) {
    return (<Link href={href} onClick={onClick} className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-semibold text-zinc-700 transition hover:bg-zinc-100 hover:text-zinc-950">
      <span className="text-zinc-500">
        {icon}
      </span>

      {children}
    </Link>);
}

export function MobileLink({ href, icon, children, }: {
    href: string;
    icon: ReactNode;
    children: ReactNode;
}) {
    return (<Link href={href} className="flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-semibold text-zinc-800 transition hover:bg-zinc-100">
      <span className="text-zinc-500">
        {icon}
      </span>

      {children}
    </Link>);
}
