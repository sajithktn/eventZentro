"use client";

import Link from "next/link";
import {
  usePathname,
  useRouter,
} from "next/navigation";
import {
  BadgePercent,
  CalendarDays,
  ChevronRight,
  CircleDollarSign,
  LayoutDashboard,
  LogOut,
  Megaphone,
  ShieldCheck,
  Tags,
  Ticket,
  UserCheck,
  UserCog,
  UsersRound,
} from "lucide-react";

import {
  useAppDispatch,
  useAppSelector,
} from "@/redux/hooks";
import { logout } from "@/redux/features/auth/authSlice";
import { logoutUser } from "@/services/auth.service";

const adminLinks = [
  {
    name: "Dashboard",
    href: "/admin",
    icon: LayoutDashboard,
  },
  {
    name: "Users",
    href: "/admin/users",
    icon: UsersRound,
  },
  {
    name: "Organizers",
    href: "/admin/organizers",
    icon: UserCog,
  },
  {
    name: "Organizer Requests",
    href: "/admin/organizer-requests",
    icon: UserCheck,
  },
  {
    name: "Events",
    href: "/admin/events",
    icon: CalendarDays,
  },
  {
    name: "Bookings",
    href: "/admin/bookings",
    icon: Ticket,
  },
  {
    name: "Promotions",
    href: "/admin/promotions",
    icon: BadgePercent,
  },
  {
    name: "Featured Events",
    href: "/admin/featured-events",
    icon: Megaphone,
  },
  {
    name: "Categories",
    href: "/admin/categories",
    icon: Tags,
  },
  {
    name: "Commission",
    href: "/admin/commission",
    icon: CircleDollarSign,
  },
];

export default function AdminSidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const dispatch = useAppDispatch();

  const user = useAppSelector(
    (state) => state.auth.user
  );

  const displayName =
    [user?.firstName, user?.lastName]
      .filter(Boolean)
      .join(" ") || "Administrator";

  const initials =
    `${user?.firstName?.[0] ?? ""}${
      user?.lastName?.[0] ?? ""
    }`
      .trim()
      .toUpperCase() ||
    user?.email?.[0]?.toUpperCase() ||
    "A";

  const isActive = (href: string) => {
    if (href === "/admin") {
      return pathname === "/admin";
    }

    return (
      pathname === href ||
      pathname.startsWith(`${href}/`)
    );
  };

  const handleLogout = async () => {
    try {
      await logoutUser();
    } catch (error) {
      console.error(
        "Logout failed:",
        error
      );
    } finally {
      dispatch(logout());
      router.replace("/login");
      router.refresh();
    }
  };

  return (
    <aside className="sticky top-0 flex h-screen w-72 shrink-0 flex-col border-r border-slate-200 bg-white">
      <div className="border-b border-slate-200 px-5 py-6">
        <Link
          href="/admin"
          className="group flex items-center gap-3"
        >
          <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-orange-500 to-red-500 text-white shadow-lg shadow-orange-200 transition group-hover:-rotate-6 group-hover:scale-105">
            <ShieldCheck
              size={24}
              strokeWidth={2.3}
            />
          </span>

          <div>
            <h2 className="text-xl font-black tracking-tight text-slate-950">
              EventZentro
            </h2>

            <p className="text-xs font-semibold text-orange-500">
              Admin Panel
            </p>
          </div>
        </Link>
      </div>

      <div className="px-4 py-5">
        <div className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-slate-50 p-3">
          {user?.profileImage ? (
            <img
              src={user.profileImage}
              alt={displayName}
              className="h-11 w-11 shrink-0 rounded-full object-cover"
            />
          ) : (
            <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-slate-950 text-xs font-black text-white">
              {initials}
            </span>
          )}

          <div className="min-w-0">
            <p className="truncate text-sm font-black text-slate-950">
              {displayName}
            </p>

            <p className="truncate text-xs font-medium text-slate-600">
              {user?.email ||
                "Admin account"}
            </p>
          </div>
        </div>
      </div>

      <nav className="flex-1 overflow-y-auto px-4 pb-5">
        <p className="mb-3 px-3 text-[11px] font-black uppercase tracking-[0.18em] text-slate-500">
          Admin Menu
        </p>

        <div className="space-y-1.5">
          {adminLinks.map((link) => {
            const Icon = link.icon;
            const active = isActive(
              link.href
            );

            return (
              <Link
                key={link.href}
                href={link.href}
                className={`group flex items-center justify-between rounded-xl px-3 py-3 text-sm font-bold transition duration-200 ${
                  active
                    ? "bg-gradient-to-r from-orange-500 to-red-500 shadow-[0_10px_25px_rgba(249,115,22,0.25)]"
                    : "hover:bg-orange-50"
                }`}
              >
                <span
                  className={`flex items-center gap-3 ${
                    active
                      ? "text-white"
                      : "text-slate-800 group-hover:text-orange-600"
                  }`}
                >
                  <span
                    className={`flex h-10 w-10 items-center justify-center rounded-xl transition ${
                      active
                        ? "bg-white/15 text-white"
                        : "bg-slate-100 text-slate-600 group-hover:bg-white group-hover:text-orange-500"
                    }`}
                  >
                    <Icon size={19} />
                  </span>

                  <span>{link.name}</span>
                </span>

                <ChevronRight
                  size={16}
                  className={`transition ${
                    active
                      ? "text-white/80"
                      : "text-slate-400 group-hover:translate-x-0.5 group-hover:text-orange-500"
                  }`}
                />
              </Link>
            );
          })}
        </div>
      </nav>

      <div className="border-t border-slate-200 p-4">
        <Link
          href="/"
          className="mb-2 flex w-full items-center gap-3 rounded-xl px-3 py-3 text-sm font-bold transition hover:bg-slate-100"
        >
          <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-100 text-slate-600">
            <CalendarDays size={18} />
          </span>

          <span className="text-slate-800">
            View Main Website
          </span>
        </Link>

        <button
          type="button"
          onClick={handleLogout}
          className="flex w-full items-center gap-3 rounded-xl px-3 py-3 text-left text-sm font-bold text-red-600 transition hover:bg-red-50"
        >
          <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-red-50 text-red-500">
            <LogOut size={18} />
          </span>

          <span>Log out</span>
        </button>
      </div>
    </aside>
  );
}
