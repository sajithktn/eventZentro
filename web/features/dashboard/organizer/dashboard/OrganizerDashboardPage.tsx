"use client";

import { OrganizerDashboardView } from "./OrganizerDashboardView";
import { useOrganizerDashboardState } from "./useOrganizerDashboardState";

export default function OrganizerDashboardPage() {
  return <OrganizerDashboardView state={useOrganizerDashboardState()} />;
}
