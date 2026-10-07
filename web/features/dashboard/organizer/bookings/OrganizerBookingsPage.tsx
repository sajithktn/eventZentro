"use client";

import { Suspense } from "react";
import { OrganizerBookingsView } from "./OrganizerBookingsView";
import { useOrganizerBookingsState } from "./useOrganizerBookingsState";

export function OrganizerBookingsContent() {
  return <OrganizerBookingsView state={useOrganizerBookingsState()} />;
}

export default function OrganizerBookingsPage() {
    return (<Suspense fallback={<main className="min-h-screen bg-[#fffaf5] px-4 pb-16 pt-6 sm:px-6">
          <div className="mx-auto max-w-7xl">
            <div className="mt-6 flex min-h-60 items-center justify-center rounded-[24px] border border-orange-100 bg-white shadow-sm">
              <div className="text-center">
                <div className="mx-auto h-10 w-10 animate-spin rounded-full border-4 border-orange-100 border-t-orange-500"/>

                <p className="mt-4 text-sm font-medium text-slate-500">
                  Loading bookings...
                </p>
              </div>
            </div>
          </div>
        </main>}>
      <OrganizerBookingsContent />
    </Suspense>);
}
