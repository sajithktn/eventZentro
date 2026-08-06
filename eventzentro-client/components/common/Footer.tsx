"use client";

import Link from "next/link";
import {
  CalendarDays,
  Mail,
  MapPin,
  Phone,
} from "lucide-react";
import type { ReactNode } from "react";

import { useAppSelector } from "@/redux/hooks";
import type { User } from "@/types/auth";

interface FooterLink {
  name: string;
  href: string;
}

const quickLinks: FooterLink[] = [
  { name: "Home", href: "/" },
  { name: "Browse Events", href: "/events" },
  { name: "About", href: "/about" },
  { name: "Contact", href: "/contact" },
];

const getDashboardPath = (role: User["role"]) => {
  switch (role) {
    case "admin":
      return "/admin";

    case "organizer":
      return "/organizer/dashboard";

    default:
      return "/user/dashboard";
  }
};

const getAccountLinks = (
  isAuthChecked: boolean,
  user: User | null
): FooterLink[] => {
  if (!isAuthChecked) {
    return [];
  }

  if (!user) {
    return [
      { name: "Log In", href: "/login" },
      { name: "Sign Up", href: "/register" },
    ];
  }

  if (user.role === "admin") {
    return [
      {
        name: "Dashboard",
        href: getDashboardPath(user.role),
      },
    ];
  }

  return [
    {
      name: "Dashboard",
      href: getDashboardPath(user.role),
    },
    { name: "My Tickets", href: "/my-tickets" },
    {
      name: "My Profile",
      href:
        user.role === "organizer"
          ? "/organizer/profile"
          : "/user/profile",
    },
  ];
};

const getOrganizerLinks = (
  isAuthChecked: boolean,
  user: User | null
): FooterLink[] => {
  if (!isAuthChecked) {
    return [];
  }

  if (
    user?.role === "organizer" ||
    user?.role === "admin"
  ) {
    return [
      {
        name: "Organizer Dashboard",
        href: "/organizer/dashboard",
      },
      {
        name: "Create an Event",
        href: "/organizer/events/create",
      },
    ];
  }

  return [
    {
      name: "Become an Organizer",
      href: "/organizer/apply",
    },
  ];
};

export default function Footer() {
  const currentYear = new Date().getFullYear();

  const { user, isAuthChecked } = useAppSelector(
    (state) => state.auth
  );

  const accountLinks = getAccountLinks(
    isAuthChecked,
    user
  );
  const organizerLinks = getOrganizerLinks(
    isAuthChecked,
    user
  );

  return (
    <footer className="border-t border-zinc-200 bg-white">
      <div className="mx-auto max-w-[1600px] px-4 py-12 sm:px-6 lg:px-8">
        <div className="grid gap-10 md:grid-cols-2 xl:grid-cols-6">
          <div className="xl:col-span-2">
            <Link
              href="/"
              className="flex w-fit items-center gap-3 rounded-xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#f05537] focus-visible:ring-offset-4"
              aria-label="EventZentro home"
            >
              <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-[#f05537] text-white shadow-[0_12px_30px_rgba(240,85,55,0.22)]">
                <CalendarDays
                  size={22}
                  strokeWidth={2.4}
                />
              </span>

              <span className="text-2xl font-black text-[#f05537]">
                EventZentro
              </span>
            </Link>

            <p className="mt-5 max-w-md text-sm leading-7 text-zinc-600">
              Discover exciting events, book tickets, and
              create unforgettable experiences with
              EventZentro.
            </p>

            <div className="mt-6 rounded-2xl border border-orange-100 bg-orange-50 px-4 py-3 text-sm font-semibold text-zinc-700">
              Your next live experience starts with a
              city, a date, and one good ticket.
            </div>
          </div>

          <FooterSection
            title="Quick Links"
            links={quickLinks}
          />

          {accountLinks.length > 0 && (
            <FooterSection
              title="Account"
              links={accountLinks}
            />
          )}

          {organizerLinks.length > 0 && (
            <FooterSection
              title="Organizers"
              links={organizerLinks}
            />
          )}

          <div>
            <h3 className="text-sm font-black uppercase tracking-[0.18em] text-zinc-900">
              Contact
            </h3>

            <div className="mt-5 space-y-3 text-sm text-zinc-600">
              <ContactItem icon={<Mail size={18} />}>
                <a
                  href="mailto:support@eventzentro.com"
                  className="transition hover:text-[#f05537] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#f05537] focus-visible:ring-offset-2"
                >
                  support@eventzentro.com
                </a>
              </ContactItem>

              <ContactItem icon={<Phone size={18} />}>
                <a
                  href="tel:+919876543210"
                  className="transition hover:text-[#f05537] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#f05537] focus-visible:ring-offset-2"
                >
                  +91 98765 43210
                </a>
              </ContactItem>

              <ContactItem icon={<MapPin size={18} />}>
                Bengaluru, India
              </ContactItem>
            </div>
          </div>
        </div>
      </div>

      <div className="border-t border-zinc-200 bg-zinc-50">
        <div className="mx-auto flex max-w-[1600px] flex-col items-center justify-between gap-3 px-4 py-5 text-center text-sm text-zinc-500 sm:flex-row sm:px-6 sm:text-left lg:px-8">
          <p>
            Copyright {currentYear} EventZentro. All
            rights reserved.
          </p>

          <p className="font-semibold text-zinc-600">
            Built for discovering, hosting, and booking
            events.
          </p>
        </div>
      </div>
    </footer>
  );
}

function FooterSection({
  title,
  links,
}: {
  title: string;
  links: FooterLink[];
}) {
  return (
    <nav aria-label={title}>
      <h3 className="text-sm font-black uppercase tracking-[0.18em] text-zinc-900">
        {title}
      </h3>

      <ul className="mt-5 space-y-2">
        {links.map((link) => (
          <li key={link.name}>
            <Link
              href={link.href}
              className="inline-flex rounded-lg px-0.5 py-1 text-sm font-semibold text-zinc-600 transition hover:text-[#f05537] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#f05537] focus-visible:ring-offset-2"
            >
              {link.name}
            </Link>
          </li>
        ))}
      </ul>
    </nav>
  );
}

function ContactItem({
  icon,
  children,
}: {
  icon: ReactNode;
  children: ReactNode;
}) {
  return (
    <div className="flex items-center gap-3">
      <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-orange-50 text-[#f05537]">
        {icon}
      </span>
      <span className="min-w-0">{children}</span>
    </div>
  );
}
