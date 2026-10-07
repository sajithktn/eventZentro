"use client";

import { Suspense } from "react";
import Loader from "@/components/ui/Loader";
import { OrganizerFeaturedEventsView } from "./OrganizerFeaturedEventsView";
import { useOrganizerFeaturedEventsState } from "./useOrganizerFeaturedEventsState";

export function OrganizerFeaturedEventsContent() {
  return <OrganizerFeaturedEventsView state={useOrganizerFeaturedEventsState()} />;
}

export default function OrganizerFeaturedEventsPage() {
    return (<Suspense fallback={<main className="min-h-screen bg-[#fffaf5] px-4 pb-16 pt-6 sm:px-6">
          <div className="mx-auto flex min-h-80 max-w-7xl items-center justify-center rounded-[24px] border border-orange-100 bg-white shadow-sm">
            <Loader text="Loading featured requests..."/>
          </div>
        </main>}>
      <OrganizerFeaturedEventsContent />
    </Suspense>);
}
