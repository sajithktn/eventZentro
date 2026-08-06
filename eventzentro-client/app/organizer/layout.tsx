"use client";

import type { ReactNode } from "react";
import { usePathname } from "next/navigation";

import OrganizerRoute from "@/components/auth/OrganizerRoute";
import OrganizerSidebar from "@/components/organizer/OrganizerSidebar";

export default function OrganizerLayout({
  children,
}: {
  children: ReactNode;
}) {
  const pathname = usePathname();

  if (pathname === "/organizer/apply") {
    return <>{children}</>;
  }

  return (
    <OrganizerRoute>
      <div className="flex min-h-screen bg-slate-100">
        <OrganizerSidebar />

        <main className="flex-1 p-6">
          {children}
        </main>
      </div>
    </OrganizerRoute>
  );
}
