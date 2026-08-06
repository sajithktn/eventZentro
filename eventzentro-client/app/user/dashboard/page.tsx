"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowUpRight,
  BadgeCheck,
  CalendarPlus,
  CheckCircle2,
  Circle,
  Compass,
  Ticket,
  UserRound,
} from "lucide-react";
import {
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";

import Loader from "@/components/common/Loader";
import {
  setAuthChecked,
  setUser,
} from "@/redux/features/auth/authSlice";
import {
  useAppDispatch,
  useAppSelector,
} from "@/redux/hooks";
import { getCurrentUser } from "@/services/auth.service";
import { getMyBookings } from "@/services/booking.service";
import type { Booking } from "@/types/booking";

interface TicketSummary {
  totalBookings: number;
  recentBookings: Booking[];
}

const getInitials = (
  firstName?: string,
  lastName?: string
) => {
  return (
    `${firstName?.[0] ?? ""}${lastName?.[0] ?? ""}`
      .trim()
      .toUpperCase() || "U"
  );
};

export default function UserDashboardPage() {
  const router = useRouter();
  const dispatch = useAppDispatch();

  const { user, isAuthChecked } = useAppSelector(
    (state) => state.auth
  );

  const [failedImageSrc, setFailedImageSrc] =
    useState("");
  const [ticketSummary, setTicketSummary] =
    useState<TicketSummary | null>(null);
  const [ticketsLoading, setTicketsLoading] =
    useState(false);

  useEffect(() => {
    if (isAuthChecked) {
      return;
    }

    let isMounted = true;

    getCurrentUser()
      .then((currentUser) => {
        if (isMounted) {
          dispatch(setUser(currentUser));
        }
      })
      .catch(() => {
        if (isMounted) {
          dispatch(setAuthChecked());
        }
      });

    return () => {
      isMounted = false;
    };
  }, [dispatch, isAuthChecked]);

  useEffect(() => {
    if (!isAuthChecked) {
      return;
    }

    if (!user) {
      router.replace("/login");
      return;
    }

    if (user.role === "organizer") {
      router.replace("/organizer/dashboard");
      return;
    }

    if (user.role === "admin") {
      router.replace("/admin");
    }
  }, [isAuthChecked, router, user]);

  useEffect(() => {
    if (!user || user.role !== "user") {
      return;
    }

    let isActive = true;

    const loadBookings = async () => {
      try {
        setTicketsLoading(true);

        const response = await getMyBookings({
          limit: 3,
        });

        if (!isActive) {
          return;
        }

        const bookings =
          response.bookings || response.data || [];

        setTicketSummary({
          totalBookings:
            response.pagination?.totalItems ??
            bookings.length,
          recentBookings: bookings,
        });
      } catch {
        if (isActive) {
          setTicketSummary(null);
        }
      } finally {
        if (isActive) {
          setTicketsLoading(false);
        }
      }
    };

    loadBookings();

    return () => {
      isActive = false;
    };
  }, [user]);

  const completionItems = useMemo(
    () => [
      {
        label: "First name",
        complete: Boolean(user?.firstName?.trim()),
      },
      {
        label: "Last name",
        complete: Boolean(user?.lastName?.trim()),
      },
      {
        label: "Profile image",
        complete: Boolean(user?.profileImage?.trim()),
      },
      {
        label: "Bio",
        complete: Boolean(user?.bio?.trim()),
      },
      {
        label: "City",
        complete: Boolean(user?.address?.city?.trim()),
      },
    ],
    [user]
  );

  if (!isAuthChecked || !user || user.role !== "user") {
    return (
      <main className="min-h-screen bg-[#fffaf5] px-4 pb-16 pt-6 sm:px-6">
        <div className="mx-auto max-w-6xl">
          <div className="mt-8 flex min-h-64 items-center justify-center rounded-[26px] border border-orange-100 bg-white shadow-sm">
            <div className="text-center">
              <div className="mx-auto h-11 w-11 animate-spin rounded-full border-4 border-orange-100 border-t-orange-500" />

              <p className="mt-4 text-sm font-medium text-slate-500">
                Loading your dashboard...
              </p>
            </div>
          </div>
        </div>
      </main>
    );
  }

  const fullName =
    [user.firstName, user.lastName].filter(Boolean).join(" ") ||
    "EventZentro User";

  const completedCount = completionItems.filter(
    (item) => item.complete
  ).length;
  const profileImage = user.profileImage?.trim() || "";
  const showProfileImage =
    profileImage && failedImageSrc !== profileImage;

  return (
    <main className="min-h-screen bg-[#fffaf5] px-4 pb-16 pt-6 sm:px-6">
      <div className="mx-auto max-w-6xl">
        <section className="rounded-[30px] border border-orange-100 bg-gradient-to-br from-orange-50 via-white to-rose-50 px-6 py-8 shadow-sm sm:px-8">
          <div className="flex flex-col justify-between gap-6 sm:flex-row sm:items-center">
            <div>
              <div className="inline-flex items-center gap-2 rounded-full border border-orange-200 bg-white/80 px-4 py-2 text-xs font-bold uppercase tracking-[0.2em] text-orange-600 shadow-sm">
                <BadgeCheck size={15} />
                User Dashboard
              </div>

              <h1 className="mt-4 text-4xl font-black tracking-tight text-slate-950 sm:text-5xl">
                Welcome, {user.firstName || "there"}
              </h1>

              <p className="mt-3 max-w-xl text-sm leading-6 text-slate-600 sm:text-base">
                Manage your profile, tickets and organizer application
                from one simple place.
              </p>
            </div>

            <Link
              href="/events"
              className="inline-flex w-fit shrink-0 items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-orange-500 via-red-500 to-pink-500 px-6 py-3.5 text-sm font-bold text-white shadow-lg shadow-orange-200 transition duration-300 hover:-translate-y-0.5 hover:shadow-xl hover:shadow-orange-300"
            >
              Explore Events
              <ArrowUpRight size={17} />
            </Link>
          </div>
        </section>

        <section className="mt-8 grid gap-6 lg:grid-cols-[1fr_0.8fr]">
          <article className="rounded-[28px] border border-orange-100 bg-white p-6 shadow-sm">
            <div className="flex flex-col gap-5 sm:flex-row sm:items-center">
              <div className="flex h-20 w-20 shrink-0 items-center justify-center overflow-hidden rounded-2xl bg-orange-100 text-2xl font-black text-orange-600">
                {showProfileImage ? (
                  <img
                    src={profileImage}
                    alt={fullName}
                    className="h-full w-full object-cover"
                    onError={() =>
                      setFailedImageSrc(profileImage)
                    }
                  />
                ) : (
                  getInitials(
                    user.firstName,
                    user.lastName
                  )
                )}
              </div>

              <div className="min-w-0">
                <span className="inline-flex rounded-full bg-orange-50 px-3 py-1.5 text-xs font-bold uppercase tracking-[0.16em] text-orange-600">
                  {user.role}
                </span>

                <h2 className="mt-3 text-2xl font-black text-slate-900">
                  {fullName}
                </h2>

                <p className="mt-1 break-all text-sm font-medium text-slate-500">
                  {user.email}
                </p>
              </div>
            </div>

            <div className="mt-6 grid gap-3 sm:grid-cols-2">
              <DashboardAction
                href="/user/profile"
                icon={<UserRound size={18} />}
                label="View Profile"
              />
              <DashboardAction
                href="/my-tickets"
                icon={<Ticket size={18} />}
                label="My Tickets"
              />
              <DashboardAction
                href="/events"
                icon={<Compass size={18} />}
                label="Explore Events"
              />
              <DashboardAction
                href="/organizer/apply"
                icon={<CalendarPlus size={18} />}
                label="Become an Organizer"
              />
            </div>
          </article>

          <article className="rounded-[28px] border border-orange-100 bg-white p-6 shadow-sm">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-sm font-semibold text-slate-500">
                  Account completion
                </p>

                <p className="mt-2 text-3xl font-black text-slate-900">
                  {completedCount}
                  <span className="text-base font-bold text-slate-400">
                    {" "}
                    / {completionItems.length}
                  </span>
                </p>
              </div>

              <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-orange-100 text-orange-600">
                <BadgeCheck size={20} />
              </span>
            </div>

            <div className="mt-5 space-y-3">
              {completionItems.map((item) => (
                <div
                  key={item.label}
                  className="flex items-center justify-between gap-3 rounded-xl border border-orange-100 bg-orange-50/40 px-4 py-3"
                >
                  <span className="text-sm font-semibold text-slate-600">
                    {item.label}
                  </span>
                  {item.complete ? (
                    <CheckCircle2
                      size={18}
                      className="text-emerald-600"
                    />
                  ) : (
                    <Circle
                      size={18}
                      className="text-slate-300"
                    />
                  )}
                </div>
              ))}
            </div>
          </article>
        </section>

        {(ticketsLoading || ticketSummary) && (
          <section className="mt-8 rounded-[28px] border border-orange-100 bg-white p-6 shadow-sm">
            <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
              <div>
                <h2 className="text-xl font-black text-slate-900">
                  Tickets
                </h2>
                <p className="mt-1 text-sm leading-6 text-slate-500">
                  A quick look at real bookings from your account.
                </p>
              </div>

              <Link
                href="/my-tickets"
                className="inline-flex w-fit items-center gap-2 rounded-xl bg-slate-900 px-4 py-3 text-sm font-bold text-white transition hover:bg-orange-600"
              >
                View all
                <ArrowUpRight size={16} />
              </Link>
            </div>

            {ticketsLoading ? (
              <div className="mt-6 flex min-h-40 items-center justify-center rounded-[26px] border border-orange-100 bg-white shadow-sm">
                <Loader text="Loading tickets..." />
              </div>
            ) : ticketSummary ? (
              <div className="mt-6 grid gap-4 lg:grid-cols-[220px_1fr]">
                <div className="rounded-2xl border border-orange-100 bg-orange-50/50 p-5">
                  <p className="text-sm font-semibold text-slate-500">
                    Total bookings
                  </p>
                  <p className="mt-2 text-3xl font-black text-slate-900">
                    {ticketSummary.totalBookings}
                  </p>
                </div>

                <div className="grid gap-3">
                  {ticketSummary.recentBookings.length > 0 ? (
                    ticketSummary.recentBookings.map((booking) => (
                      <div
                        key={booking._id}
                        className="flex flex-col justify-between gap-2 rounded-2xl border border-orange-100 bg-white px-5 py-4 shadow-sm sm:flex-row sm:items-center"
                      >
                        <div>
                          <p className="text-sm font-bold text-slate-900">
                            {booking.bookingCode}
                          </p>
                          <p className="mt-1 text-xs font-semibold capitalize text-slate-500">
                            {booking.status}
                          </p>
                        </div>

                        <p className="text-sm font-semibold text-slate-700">
                          {booking.quantity}{" "}
                          {booking.quantity === 1
                            ? "ticket"
                            : "tickets"}
                        </p>
                      </div>
                    ))
                  ) : (
                    <div className="rounded-[26px] border border-orange-100 bg-white px-6 py-10 text-center shadow-sm">
                      <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-orange-100 text-orange-600">
                        <Ticket size={26} />
                      </div>

                      <p className="mt-4 text-sm font-semibold text-slate-500">
                        No tickets booked yet.
                      </p>
                    </div>
                  )}
                </div>
              </div>
            ) : null}
          </section>
        )}
      </div>
    </main>
  );
}

function DashboardAction({
  href,
  icon,
  label,
}: {
  href: string;
  icon: ReactNode;
  label: string;
}) {
  return (
    <Link
      href={href}
      className="group flex items-center gap-3 rounded-xl border border-orange-100 bg-orange-50/40 px-4 py-3 text-sm font-bold text-slate-700 transition duration-300 hover:-translate-y-0.5 hover:border-orange-200 hover:bg-orange-50 hover:text-orange-600 hover:shadow-sm"
    >
      <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-white text-orange-600 shadow-sm">
        {icon}
      </span>
      {label}
    </Link>
  );
}
