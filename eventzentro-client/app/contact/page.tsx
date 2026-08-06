import Link from "next/link";
import { Mail, MapPin, MessageSquare, Phone } from "lucide-react";

const contactItems = [
  {
    title: "Email",
    value: "eventzentro@gmail.com",
    description: "For account, booking, and organizer support.",
    icon: Mail,
  },
  {
    title: "Phone",
    value: "+91 98765 43210",
    description: "Available during business hours.",
    icon: Phone,
  },
  {
    title: "Location",
    value: "Kerala, India",
    description: "Built for event teams and audiences everywhere.",
    icon: MapPin,
  },
];

export default function ContactPage() {
  return (
    <main className="min-h-screen bg-[#f7f8fc] text-slate-900">
      <section className="bg-slate-950 text-white">
        <div className="mx-auto max-w-7xl px-6 py-20">
          <p className="text-sm font-bold uppercase tracking-widest text-blue-400">
            Contact
          </p>
          <h1 className="mt-4 max-w-3xl text-5xl font-black leading-tight">
            Need help with events, tickets, or your organizer account?
          </h1>
          <p className="mt-6 max-w-2xl text-lg leading-8 text-slate-300">
            Reach out with questions, support requests, or partnership ideas.
            We will help you get moving.
          </p>
        </div>
      </section>

      <section className="mx-auto grid max-w-7xl gap-8 px-6 py-16 lg:grid-cols-[0.8fr_1.2fr]">
        <div className="space-y-4">
          {contactItems.map((item) => {
            const Icon = item.icon;

            return (
              <article key={item.title} className="rounded-lg bg-white p-6 shadow-sm">
                <div className="flex gap-4">
                  <div className="h-fit rounded-lg bg-blue-50 p-3 text-blue-600">
                    <Icon size={22} />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-slate-500">
                      {item.title}
                    </p>
                    <h2 className="mt-1 text-lg font-bold text-slate-900">
                      {item.value}
                    </h2>
                    <p className="mt-2 text-sm leading-6 text-slate-600">
                      {item.description}
                    </p>
                  </div>
                </div>
              </article>
            );
          })}
        </div>

        <section className="rounded-lg bg-white p-6 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="rounded-lg bg-blue-50 p-3 text-blue-600">
              <MessageSquare size={22} />
            </div>
            <div>
              <h2 className="text-2xl font-black text-slate-900">
                Send a Message
              </h2>
              <p className="mt-1 text-sm text-slate-500">
                This form is ready for a future contact API.
              </p>
            </div>
          </div>

          <form className="mt-6 grid gap-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <label className="block">
                <span className="text-sm font-semibold text-slate-700">
                  Name
                </span>
                <input
                  type="text"
                  placeholder="Your name"
                  className="mt-2 w-full rounded-lg border border-slate-200 px-4 py-3 outline-none focus:border-blue-500"
                />
              </label>

              <label className="block">
                <span className="text-sm font-semibold text-slate-700">
                  Email
                </span>
                <input
                  type="email"
                  placeholder="you@example.com"
                  className="mt-2 w-full rounded-lg border border-slate-200 px-4 py-3 outline-none focus:border-blue-500"
                />
              </label>
            </div>

            <label className="block">
              <span className="text-sm font-semibold text-slate-700">
                Subject
              </span>
              <input
                type="text"
                placeholder="How can we help?"
                className="mt-2 w-full rounded-lg border border-slate-200 px-4 py-3 outline-none focus:border-blue-500"
              />
            </label>

            <label className="block">
              <span className="text-sm font-semibold text-slate-700">
                Message
              </span>
              <textarea
                rows={6}
                placeholder="Tell us what you need"
                className="mt-2 w-full rounded-lg border border-slate-200 px-4 py-3 outline-none focus:border-blue-500"
              />
            </label>

            <Link
              href="mailto:support@eventzentro.com"
              className="inline-flex w-fit rounded-lg bg-blue-600 px-6 py-3 text-sm font-semibold text-white transition hover:bg-blue-700"
            >
              Email Support
            </Link>
          </form>
        </section>
      </section>
    </main>
  );
}
