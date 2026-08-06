"use client";

import { ReactNode, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAppDispatch, useAppSelector } from "@/redux/hooks";
import {
  setAuthChecked,
  setUser,
} from "@/redux/features/auth/authSlice";
import { getCurrentUser } from "@/services/auth.service";

interface UserRouteProps {
  children: ReactNode;
}

export default function UserRoute({ children }: UserRouteProps) {
  const router = useRouter();
  const dispatch = useAppDispatch();
  const { isAuthenticated, isAuthChecked } = useAppSelector(
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
    }
  }, [isAuthenticated, isAuthChecked, router]);

  if (!isAuthChecked || !isAuthenticated) {
    return null;
  }

  return <>{children}</>;
}
