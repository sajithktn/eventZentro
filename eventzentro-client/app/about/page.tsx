import Link from "next/link";
import {
  ArrowRight,
  CalendarCheck,
  CalendarPlus,
  CheckCircle2,
  ShieldCheck,
  Sparkles,
  TicketCheck,
  Users,
} from "lucide-react";

const attendeeItems = [
  "Discover upcoming events",
  "Book tickets with a clear checkout flow",
  "Manage booked tickets from one account",
  "Apply valid coupons during booking",
];

const organizerItems = [
  "Create and manage events",
  "Track ticket inventory",
  "Review customer bookings",
  "Create promotional coupons",
];

const valueCards = [
  {
    title: "Focused Discovery",
    description:
      "Attendees can browse events, compare details and move from interest to booking without extra friction.",
    icon: Sparkles,
    color: "bg-orange-100 text-orange-600",
  },
  {
    title: "Organizer Workspace",
    description:
      "Organizers get a practical dashboard for events, bookings, tickets and coupon management.",
    icon: CalendarCheck,
    color: "bg-red-100 text-red-600",
  },
  {
    title: "Reliable Access",
    description:
      "Protected routes and role-based dashboards keep attendee, organizer and admin workflows separate.",
    icon: ShieldCheck,
    color: "bg-emerald-100 text-emerald-600",
  },
];

const steps = [
  {
    title: "Find an Event",
    description:
      "Browse event cards and open the event details that match your plans.",
  },
  {
    title: "Book Tickets",
    description:
      "Choose ticket quantity, apply a coupon when available and confirm the booking.",
  },
  {
    title: "Manage Everything",
    description:
      "Attendees see their tickets, while organizers manage events and bookings.",
  },
];

export default function AboutPage() {
  return (
    <main className="min-h-screen bg-[#fffaf5] text-slate-900">
      <section className="border-b border-orange-100 bg-gradient-to-br from-orange-50 via-white to-rose-50">
        <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
          <div className="max-w-3xl">
            <p className="text-xs font-bold uppercase tracking-[0.2em] text-orange-600">
              About EventZentro
            </p>

            <h1 className="mt-4 text-4xl font-black leading-tight tracking-tight text-slate-950 sm:text-5xl lg:text-6xl">
              Event discovery and management, kept clear.
            </h1>

            <p className="mt-5 text-base leading-8 text-slate-600 sm:text-lg">
              EventZentro brings event browsing, ticket booking and organizer
              operations into one focused platform for attendees and event
              creators.
            </p>

            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <Link
                href="/events"
                className="inline-flex items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-orange-500 via-red-500 to-pink-500 px-6 py-3.5 text-sm font-bold text-white shadow-lg shadow-orange-200 transition hover:-translate-y-0.5 hover:shadow-xl hover:shadow-orange-300"
              >
                Explore Events
                <ArrowRight size={18} />
              </Link>

              <Link
                href="/organizer/apply"
                className="inline-flex items-center justify-center gap-2 rounded-2xl border border-orange-200 bg-white px-6 py-3.5 text-sm font-bold text-orange-600 transition hover:border-orange-300 hover:bg-orange-50"
              >
                Become an Organizer
                <CalendarPlus size={18} />
              </Link>
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto grid max-w-7xl gap-5 px-4 py-14 sm:px-6 md:grid-cols-3 lg:px-8">
        {valueCards.map((card) => {
          const Icon = card.icon;

          return (
            <article
              key={card.title}
              className="rounded-[24px] border border-orange-100 bg-white p-6 shadow-sm"
            >
              <div
                className={`flex h-12 w-12 items-center justify-center rounded-2xl ${card.color}`}
              >
                <Icon size={22} />
              </div>

              <h2 className="mt-5 text-xl font-black text-slate-900">
                {card.title}
              </h2>

              <p className="mt-3 text-sm leading-6 text-slate-600">
                {card.description}
              </p>
            </article>
          );
        })}
      </section>

      <section className="mx-auto max-w-7xl px-4 pb-14 sm:px-6 lg:px-8">
        <div className="grid gap-6 lg:grid-cols-2">
          <article className="rounded-[26px] border border-orange-100 bg-white p-6 shadow-sm sm:p-8">
            <div className="flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-orange-100 text-orange-600">
                <TicketCheck size={23} />
              </div>

              <div>
                <p className="text-xs font-bold uppercase tracking-[0.18em] text-orange-500">
                  For attendees
                </p>

                <h2 className="mt-1 text-2xl font-black text-slate-900">
                  Book with confidence
                </h2>
              </div>
            </div>

            <div className="mt-6 grid gap-3">
              {attendeeItems.map((item) => (
                <p
                  key={item}
                  className="flex items-center gap-3 rounded-xl bg-orange-50 px-4 py-3 text-sm font-semibold text-slate-700"
                >
                  <CheckCircle2
                    size={18}
                    className="shrink-0 text-orange-500"
                  />
                  {item}
                </p>
              ))}
            </div>
          </article>

          <article className="rounded-[26px] border border-orange-100 bg-white p-6 shadow-sm sm:p-8">
            <div className="flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-red-100 text-red-600">
                <Users size={23} />
              </div>

              <div>
                <p className="text-xs font-bold uppercase tracking-[0.18em] text-red-500">
                  For organizers
                </p>

                <h2 className="mt-1 text-2xl font-black text-slate-900">
                  Manage the event lifecycle
                </h2>
              </div>
            </div>

            <div className="mt-6 grid gap-3">
              {organizerItems.map((item) => (
                <p
                  key={item}
                  className="flex items-center gap-3 rounded-xl bg-red-50 px-4 py-3 text-sm font-semibold text-slate-700"
                >
                  <CheckCircle2
                    size={18}
                    className="shrink-0 text-red-500"
                  />
                  {item}
                </p>
              ))}
            </div>
          </article>
        </div>
      </section>

      <section className="border-y border-orange-100 bg-white">
        <div className="mx-auto max-w-7xl px-4 py-14 sm:px-6 lg:px-8">
          <div className="max-w-2xl">
            <p className="text-xs font-bold uppercase tracking-[0.2em] text-orange-600">
              How it works
            </p>

            <h2 className="mt-3 text-3xl font-black tracking-tight text-slate-950">
              Simple steps for both sides of the platform.
            </h2>
          </div>

          <div className="mt-8 grid gap-4 md:grid-cols-3">
            {steps.map((step, index) => (
              <article
                key={step.title}
                className="rounded-[22px] border border-orange-100 bg-[#fffaf5] p-6"
              >
                <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-900 text-sm font-black text-white">
                  {index + 1}
                </span>

                <h3 className="mt-5 text-xl font-black text-slate-900">
                  {step.title}
                </h3>

                <p className="mt-2 text-sm leading-6 text-slate-600">
                  {step.description}
                </p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 py-14 sm:px-6 lg:px-8">
        <div className="rounded-[30px] border border-orange-100 bg-slate-950 p-8 text-white shadow-sm sm:p-10">
          <div className="flex flex-col justify-between gap-6 lg:flex-row lg:items-center">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.2em] text-orange-300">
                Start with EventZentro
              </p>

              <h2 className="mt-3 max-w-2xl text-3xl font-black tracking-tight sm:text-4xl">
                Explore events or open the organizer workflow when you are
                ready to publish.
              </h2>
            </div>

            <div className="flex flex-col gap-3 sm:flex-row">
              <Link
                href="/events"
                className="inline-flex items-center justify-center gap-2 rounded-2xl bg-white px-6 py-3.5 text-sm font-bold text-slate-950 transition hover:bg-orange-100"
              >
                Explore Events
                <ArrowRight size={18} />
              </Link>

              <Link
                href="/organizer/apply"
                className="inline-flex items-center justify-center gap-2 rounded-2xl border border-white/15 px-6 py-3.5 text-sm font-bold text-white transition hover:border-orange-300 hover:bg-white/10"
              >
                Become an Organizer
                <CalendarPlus size={18} />
              </Link>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
