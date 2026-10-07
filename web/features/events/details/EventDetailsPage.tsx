"use client";

import { EventDetailsView } from "./EventDetailsView";
import { useEventDetailsState } from "./useEventDetailsState";

export default function EventDetailsPage() {
  return <EventDetailsView state={useEventDetailsState()} />;
}
