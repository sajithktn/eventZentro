import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import CreateEventForm from "@/components/organizer/CreateEventForm";

export default function CreateEventPage() {
  return (
    <main className="bg-[#fffaf5] px-4 py-3 sm:px-6 lg:h-[calc(100vh-72px)] lg:overflow-hidden">
      <div className="mx-auto flex h-full max-w-6xl flex-col">
        <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
          <div>
            <h1 className="text-2xl font-black text-slate-900 sm:text-3xl">
              Create Event
            </h1>

            <p className="mt-1 text-sm text-slate-500">
              Add your event information and publish it for users.
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
          <CreateEventForm />
        </div>
      </div>
    </main>
  );
}