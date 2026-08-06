"use client";

import type { ReactNode } from "react";
import { useEffect } from "react";
import {
  usePathname,
  useRouter,
} from "next/navigation";
import { ShieldCheck } from "lucide-react";

import AdminSidebar from "@/components/admin/AdminSidebar";
import {
  useAppDispatch,
  useAppSelector,
} from "@/redux/hooks";
import {
  logout,
  setUser,
} from "@/redux/features/auth/authSlice";
import { getCurrentUser } from "@/services/auth.service";

interface AdminLayoutProps {
  children: ReactNode;
}

const getPageTitle = (pathname: string) => {
  if (pathname.startsWith("/admin/users")) {
    return "Users Management";
  }

  if (pathname.startsWith("/admin/events")) {
    return "Events Management";
  }

  if (pathname.startsWith("/admin/organizer-requests")) {
    return "Organizer Requests";
  }

  if (pathname.startsWith("/admin/bookings")) {
    return "Bookings Management";
  }

  if (pathname.startsWith("/admin/promotions")) {
    return "Promotion Management";
  }

  if (pathname.startsWith("/admin/featured-events")) {
    return "Featured Events";
  }

  return "Admin Dashboard";
};

export default function AdminLayout({
  children,
}: AdminLayoutProps) {
  const pathname = usePathname();
  const router = useRouter();
  const dispatch = useAppDispatch();

  const {
    user,
    isAuthenticated,
    isAuthChecked,
  } = useAppSelector(
    (state) => state.auth
  );

  useEffect(() => {
    const verifyAdmin = async () => {
      if (isAuthChecked) {
        return;
      }

      try {
        const currentUser =
          await getCurrentUser();

        dispatch(setUser(currentUser));
      } catch {
        dispatch(logout());
        router.replace("/login");
      }
    };

    verifyAdmin();
  }, [
    dispatch,
    isAuthChecked,
    router,
  ]);

  useEffect(() => {
    if (!isAuthChecked) {
      return;
    }

    if (!isAuthenticated || !user) {
      router.replace("/login");
      return;
    }

    if (user.role !== "admin") {
      if (user.role === "organizer") {
        router.replace(
          "/organizer/dashboard"
        );
      } else {
        router.replace("/dashboard");
      }
    }
  }, [
    isAuthChecked,
    isAuthenticated,
    router,
    user,
  ]);

  const hasAdminAccess =
    isAuthChecked &&
    isAuthenticated &&
    user?.role === "admin";

  if (!hasAdminAccess) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-slate-950 px-4">
        <div className="text-center">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-orange-500/15 text-orange-500">
            <ShieldCheck size={30} />
          </div>

          <div className="mx-auto mt-5 h-9 w-9 animate-spin rounded-full border-4 border-slate-700 border-t-orange-500" />

          <p className="mt-4 text-sm font-semibold text-slate-400">
            Checking admin access...
          </p>
        </div>
      </main>
    );
  }

  const pageTitle =
    getPageTitle(pathname);

  return (
    <div className="flex min-h-screen bg-[#f7f8fc]">
      <AdminSidebar />

      <div className="min-w-0 flex-1">
        <header className="sticky top-0 z-30 flex h-20 items-center justify-between border-b border-slate-200 bg-white/90 px-6 backdrop-blur-xl lg:px-8">
          <div>
            <p className="text-xs font-black uppercase tracking-[0.18em] text-orange-500">
              Administration
            </p>

            <h1 className="mt-1 text-xl font-black text-slate-950">
              {pageTitle}
            </h1>
          </div>

          <div className="flex items-center gap-3 rounded-xl border border-slate-200 bg-slate-50 px-4 py-2">
            <span className="h-2.5 w-2.5 rounded-full bg-emerald-500" />

            <span className="text-xs font-bold text-slate-600">
              Admin access active
            </span>
          </div>
        </header>

        <main className="p-5 sm:p-6 lg:p-8">
          {children}
        </main>
      </div>
    </div>
  );
}
