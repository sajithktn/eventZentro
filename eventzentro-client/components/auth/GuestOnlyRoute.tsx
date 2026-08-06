"use client";

import type { ReactNode } from "react";
import { useEffect } from "react";
import { useRouter } from "next/navigation";

import { useAppSelector } from "@/redux/hooks";
import type { User } from "@/types/auth";

interface GuestOnlyRouteProps {
  children: ReactNode;
}

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

export default function GuestOnlyRoute({
  children,
}: GuestOnlyRouteProps) {
  const router = useRouter();

  const {
    user,
    isAuthenticated,
    isAuthChecked,
  } = useAppSelector((state) => state.auth);

  const authenticatedRole =
    isAuthenticated ? user?.role : undefined;

  useEffect(() => {
    if (!isAuthChecked || !authenticatedRole) {
      return;
    }

    router.replace(
      getDashboardPath(authenticatedRole)
    );
  }, [authenticatedRole, isAuthChecked, router]);

  if (!isAuthChecked || authenticatedRole) {
    return null;
  }

  return <>{children}</>;
}
