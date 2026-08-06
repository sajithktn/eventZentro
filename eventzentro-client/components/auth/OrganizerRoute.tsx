"use client";

import { ReactNode, useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import { useAppDispatch, useAppSelector } from "@/redux/hooks";
import {
  setAuthChecked,
  setUser,
} from "@/redux/features/auth/authSlice";
import { getCurrentUser } from "@/services/auth.service";

interface OrganizerRouteProps {
  children: ReactNode;
}

export default function OrganizerRoute({
  children,
}: OrganizerRouteProps) {
  const router = useRouter();
  const pathname = usePathname();
  const dispatch = useAppDispatch();

  const { user, isAuthenticated, isAuthChecked } = useAppSelector(
    (state) => state.auth
  );

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

    if (!isAuthenticated) {
      router.replace("/login");
      return;
    }

    if (
      user?.role !== "organizer" &&
      user?.role !== "admin"
    ) {
      router.replace(
        pathname === "/organizer"
          ? "/user/dashboard"
          : "/organizer/apply"
      );
    }
  }, [isAuthenticated, isAuthChecked, pathname, user, router]);

  if (
    !isAuthChecked ||
    !isAuthenticated ||
    (user?.role !== "organizer" &&
      user?.role !== "admin")
  ) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#fffaf5] px-4">
        <div className="text-center">
          <div className="mx-auto h-11 w-11 animate-spin rounded-full border-4 border-orange-100 border-t-orange-500" />

          <p className="mt-4 text-sm font-medium text-slate-500">
            Checking organizer access...
          </p>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
