"use client";

import { OrganizerProfileView } from "./OrganizerProfileView";
import { useOrganizerProfileState } from "./useOrganizerProfileState";

export default function OrganizerProfilePage() {
  return <OrganizerProfileView state={useOrganizerProfileState()} />;
}
