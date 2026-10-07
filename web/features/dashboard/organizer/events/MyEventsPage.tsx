"use client";

import { Suspense } from "react";
import { MyEventsView } from "./MyEventsView";
import { useMyEventsState } from "./useMyEventsState";

export function MyEventsContent() {
  return <MyEventsView state={useMyEventsState()} />;
}

export default function MyEventsPage() {
    return (<Suspense fallback={<main className="min-h-screen bg-[#fffaf5] px-4 pb-16 pt-6 sm:px-6">
          <div className="mx-auto max-w-7xl">
            <div className="mt-8 flex min-h-64 items-center justify-center rounded-[28px] border border-orange-100 bg-white shadow-sm">
              <div className="text-center">
                <div className="mx-auto h-11 w-11 animate-spin rounded-full border-4 border-orange-100 border-t-orange-500"/>

                <p className="mt-4 text-sm font-medium text-slate-500">
                  Loading your events...
                </p>
              </div>
            </div>
          </div>
        </main>}>
      <MyEventsContent />
    </Suspense>);
}
