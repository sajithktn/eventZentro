"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

import { getCurrentUser } from "@/services/auth.service";
import { useAppDispatch, useAppSelector } from "@/redux/hooks";
import {
  setAuthChecked,
  setUser,
} from "@/redux/features/auth/authSlice";

export default function BecomeOrganizerButton() {
  const router = useRouter();
  const dispatch = useAppDispatch();

  const { user, isAuthChecked } = useAppSelector(
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

  const handleClick = () => {
    if (!isAuthChecked) {
      return;
    }

    if (!user) {
      toast.error("Please login first.");
      router.push("/login");
      return;
    }

    if (
      user.role === "organizer" ||
      user.role === "admin"
    ) {
      router.push("/organizer/dashboard");
      return;
    }

    router.push("/organizer/apply");
  };

  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={!isAuthChecked}
      className="rounded-lg bg-white px-6 py-3 font-semibold text-blue-600 transition hover:bg-zinc-100 disabled:cursor-not-allowed disabled:opacity-60"
    >
      {!isAuthChecked
        ? "Checking Account..."
        : user?.role === "organizer" ||
            user?.role === "admin"
          ? "Go to Dashboard"
          : "Become an Organizer"}
    </button>
  );
}