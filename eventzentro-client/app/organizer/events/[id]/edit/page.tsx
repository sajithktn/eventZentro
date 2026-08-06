"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import axios from "axios";
import { toast } from "sonner";
import {
  ArrowLeft,
  LoaderCircle,
} from "lucide-react";

import EditEventForm from "@/components/organizer/EditEventForm";
import {
  getOrganizerEventById,
} from "@/services/event.service";
import type { Event } from "@/types/event";

export default function EditEventPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();

  const [event, setEvent] = useState<Event | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const eventId = params.id;

  useEffect(() => {
    const loadEvent = async () => {
      if (!eventId) {
        toast.error("Event ID was not found");
        router.push("/organizer/events");
        return;
      }

      try {
        setIsLoading(true);

        const eventData =
          await getOrganizerEventById(eventId);

        if (!eventData) {
          toast.error("Event was not found");
          router.push("/organizer/events");
          return;
        }

        setEvent(eventData);
      } catch (error: unknown) {
        if (axios.isAxiosError(error)) {
          toast.error(
            error.response?.data?.message ||
              "Failed to load event"
          );
        } else {
          toast.error("Failed to load event");
        }

        router.push("/organizer/events");
      } finally {
        setIsLoading(false);
      }
    };

    void Promise.resolve().then(loadEvent);
  }, [eventId, router]);

  if (isLoading) {
    return (
      <main className="bg-[#fffaf5] px-4 py-3 sm:px-6 lg:h-[calc(100vh-72px)] lg:overflow-hidden">
        <div className="flex h-full min-h-[60vh] items-center justify-center">
          <LoaderCircle
            size={32}
            className="animate-spin text-orange-500"
          />
        </div>
      </main>
    );
  }

  if (!event) {
    return null;
  }

  return (
    <main className="bg-[#fffaf5] px-4 py-3 sm:px-6 lg:h-[calc(100vh-72px)] lg:overflow-hidden">
      <div className="mx-auto flex h-full max-w-6xl flex-col">
        <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
          <div>
            <h1 className="text-2xl font-black text-slate-900 sm:text-3xl">
              Edit Event
            </h1>

            <p className="mt-1 text-sm text-slate-500">
              Update your event information and keep the public details current.
            </p>
          </div>

          <Link
            href="/organizer/events"
            className="inline-flex w-fit items-center gap-2 rounded-lg bg-slate-900 px-4 py-2.5 text-sm font-bold text-white shadow-sm transition hover:bg-orange-600"
          >
            <ArrowLeft size={17} />
            Back to events
          </Link>
        </div>

        <div className="mt-3 min-h-0 flex-1">
          <EditEventForm event={event} />
        </div>
      </div>
    </main>
  );
}
