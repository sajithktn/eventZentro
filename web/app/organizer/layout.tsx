"use client";

import { useState } from "react";
import type { ReactNode } from "react";
import { usePathname } from "next/navigation";
import { CalendarDays, Menu } from "lucide-react";

import OrganizerRoute from "@/features/auth/components/OrganizerRoute";
import OrganizerSidebar from "@/features/dashboard/organizer/OrganizerSidebar";

export default function OrganizerLayout({
  children,
}: {
  children: ReactNode;
}) {
  const pathname = usePathname();
  const [isMobileNavOpen, setIsMobileNavOpen] = useState(false);

  if (pathname === "/organizer/apply") {
    return <>{children}</>;
  }

  return (
    <OrganizerRoute>
      <div className="flex min-h-screen bg-slate-100">
        <OrganizerSidebar
          isMobileOpen={isMobileNavOpen}
          onClose={() => setIsMobileNavOpen(false)}
        />

        <div className="flex min-w-0 flex-1 flex-col">
          <header className="sticky top-0 z-30 flex h-16 items-center justify-between border-b border-zinc-200 bg-white/95 px-4 backdrop-blur-xl lg:hidden sm:px-6">
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => setIsMobileNavOpen(true)}
                className="flex h-10 w-10 items-center justify-center rounded-xl border border-zinc-200 bg-zinc-50 text-zinc-700 hover:bg-zinc-100"
                aria-label="Open sidebar menu"
              >
                <Menu size={20} />
              </button>
              <div className="flex items-center gap-2">
                <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#f05537] text-white">
                  <CalendarDays size={16} />
                </span>
                <span className="text-base font-black tracking-tight text-[#f05537]">
                  Organizer Panel
                </span>
              </div>
            </div>
          </header>

          <main className="flex-1 p-4 sm:p-6 lg:p-8">
            {children}
          </main>
        </div>
      </div>
    </OrganizerRoute>
  );
}
