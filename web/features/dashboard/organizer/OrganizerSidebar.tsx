"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  CalendarDays,
  CalendarPlus,
  ChevronRight,
  LayoutDashboard,
  LogOut,
  Megaphone,
  Ticket,
  UserRound,
  X,
} from "lucide-react";

import { useAppDispatch, useAppSelector } from "@/store/hooks";
import { logout } from "@/store/features/auth/authSlice";
import { logoutUser } from "@/services/auth.service";

interface OrganizerSidebarProps {
  isMobileOpen?: boolean;
  onClose?: () => void;
}

const links = [
  {
    name: "Dashboard",
    href: "/organizer/dashboard",
    icon: LayoutDashboard,
  },
  {
    name: "Create Event",
    href: "/organizer/events/create",
    icon: CalendarPlus,
  },
  {
    name: "My Events",
    href: "/organizer/events",
    icon: CalendarDays,
  },
  {
    name: "Bookings",
    href: "/organizer/bookings",
    icon: Ticket,
  },
  {
    name: "Promotions",
    href: "/organizer/coupons",
    icon: Ticket,
  },
  {
    name: "Featured Events",
    href: "/organizer/featured-events",
    icon: Megaphone,
  },
  {
    name: "Profile",
    href: "/organizer/profile",
    icon: UserRound,
  },
];

export default function OrganizerSidebar({
  isMobileOpen = false,
  onClose,
}: OrganizerSidebarProps = {}) {
  const pathname = usePathname();
  const router = useRouter();
  const dispatch = useAppDispatch();

  const user = useAppSelector((state) => state.auth.user);

  const displayName =
    [user?.firstName, user?.lastName].filter(Boolean).join(" ") ||
    "Organizer";

  const initials =
    `${user?.firstName?.[0] ?? ""}${user?.lastName?.[0] ?? ""}`
      .trim()
      .toUpperCase() ||
    user?.email?.[0]?.toUpperCase() ||
    "O";

  const isActive = (href: string) => {
    if (href === "/organizer/events/create") {
      return pathname === "/organizer/events/create";
    }

    if (href === "/organizer/events") {
      return (
        pathname === "/organizer/events" ||
        (pathname.startsWith("/organizer/events/") &&
          pathname !== "/organizer/events/create")
      );
    }

    return pathname === href || pathname.startsWith(`${href}/`);
  };

  const handleLogout = async () => {
    try {
      await logoutUser();
    } catch (error) {
      console.error("Logout failed:", error);
    } finally {
      dispatch(logout());
      router.push("/login");
      router.refresh();
    }
  };

  const renderContent = (onLinkClick?: () => void) => (
    <>
      <div className="flex items-center justify-between border-b border-zinc-200 px-5 py-4">
        <div>
          <h2 className="text-base font-bold tracking-tight text-zinc-900">
            Organizer Panel
          </h2>
        </div>

        {onLinkClick && (
          <button
            type="button"
            onClick={onClose}
            className="flex h-9 w-9 items-center justify-center rounded-xl text-zinc-500 hover:bg-zinc-100 lg:hidden"
            aria-label="Close menu"
          >
            <X size={20} />
          </button>
        )}
      </div>

      <div className="px-4 py-5">
        <div className="flex items-center gap-3 rounded-xl bg-zinc-50 p-3">
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#f05537] text-xs font-bold text-white">
            {initials}
          </span>

          <div className="min-w-0">
            <p className="truncate text-sm font-bold text-zinc-900">
              {displayName}
            </p>

            <p className="truncate text-xs text-zinc-500">
              {user?.email || "Organizer account"}
            </p>
          </div>
        </div>
      </div>

      <nav className="flex-1 space-y-1 overflow-y-auto px-4 pb-5">
        <p className="mb-3 px-3 text-[11px] font-bold uppercase tracking-[0.16em] text-zinc-400">
          Organizer Menu
        </p>

        {links.map((link) => {
          const Icon = link.icon;
          const active = isActive(link.href);

          return (
            <Link
              key={link.href}
              href={link.href}
              onClick={onLinkClick}
              className={`group flex items-center justify-between rounded-xl px-3 py-3 text-sm font-semibold transition duration-200 ${
                active
                  ? "bg-[#f05537] text-white shadow-[0_8px_22px_rgba(240,85,55,0.24)]"
                  : "text-zinc-700 hover:bg-orange-50 hover:text-[#d9472d]"
              }`}
            >
              <span className="flex items-center gap-3">
                <span
                  className={`flex h-9 w-9 items-center justify-center rounded-lg transition ${
                    active
                      ? "bg-white/15 text-white"
                      : "bg-zinc-100 text-zinc-500 group-hover:bg-white group-hover:text-[#f05537]"
                  }`}
                >
                  <Icon size={18} />
                </span>

                {link.name}
              </span>

              <ChevronRight
                size={16}
                className={`transition duration-200 ${
                  active
                    ? "text-white/80"
                    : "text-zinc-300 group-hover:translate-x-0.5 group-hover:text-[#f05537]"
                }`}
              />
            </Link>
          );
        })}
      </nav>

      <div className="border-t border-zinc-200 p-4">
        <Link
          href="/events"
          onClick={onLinkClick}
          className="mb-2 flex w-full items-center gap-3 rounded-xl px-3 py-3 text-sm font-semibold text-zinc-700 transition hover:bg-zinc-100 hover:text-zinc-950"
        >
          <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-zinc-100 text-zinc-500">
            <CalendarDays size={18} />
          </span>

          Browse Events
        </Link>

        <button
          type="button"
          onClick={handleLogout}
          className="flex w-full items-center gap-3 rounded-xl px-3 py-3 text-left text-sm font-semibold text-red-600 transition hover:bg-red-50"
        >
          <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-red-50 text-red-500">
            <LogOut size={18} />
          </span>

          Log out
        </button>
      </div>
    </>
  );

  return (
    <>
      <aside className="sticky top-0 hidden h-screen w-64 shrink-0 flex-col border-r border-zinc-200 bg-white text-zinc-900 lg:flex">
        {renderContent()}
      </aside>

      {isMobileOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div
            className="fixed inset-0 bg-slate-950/60 backdrop-blur-sm transition-opacity"
            onClick={onClose}
            aria-hidden="true"
          />
          <aside className="fixed inset-y-0 left-0 flex w-72 max-w-[85vw] flex-col border-r border-zinc-200 bg-white text-zinc-900 shadow-2xl">
            {renderContent(onClose)}
          </aside>
        </div>
      )}
    </>
  );
}
