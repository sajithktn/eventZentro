"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  Edit3,
  Mail,
  ShieldCheck,
  UserRound,
} from "lucide-react";
import {
  useEffect,
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

const getValue = (value?: string) => {
  return value?.trim() || "Not added";
};

const getDashboardHref = (role?: string) => {
  if (role === "admin") {
    return "/admin";
  }

  if (role === "organizer") {
    return "/organizer/dashboard";
  }

  return "/user/dashboard";
};

export default function UserProfilePage() {
  const router = useRouter();
  const dispatch = useAppDispatch();

  const { user, isAuthChecked } = useAppSelector(
    (state) => state.auth
  );

  const [failedImageSrc, setFailedImageSrc] =
    useState("");

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
    if (isAuthChecked && !user) {
      router.replace("/login");
    }
  }, [isAuthChecked, router, user]);

  if (!isAuthChecked || !user) {
    return (
      <main className="min-h-screen bg-[#fffaf5] px-4 pb-16 pt-6 sm:px-6">
        <div className="mx-auto max-w-6xl">
          <div className="mt-8 flex min-h-64 items-center justify-center rounded-[26px] border border-orange-100 bg-white shadow-sm">
            <Loader text="Loading your profile..." />
          </div>
        </div>
      </main>
    );
  }

  const fullName =
    [user.firstName, user.lastName].filter(Boolean).join(" ") ||
    "Not added";

  const address = user.address || {};
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
                <UserRound size={15} />
                User profile
              </div>

              <h1 className="mt-4 text-4xl font-black tracking-tight text-slate-950 sm:text-5xl">
                My Profile
              </h1>

              <p className="mt-3 max-w-xl text-sm leading-6 text-slate-600 sm:text-base">
                View and manage your personal account information.
              </p>
            </div>

            <div className="flex flex-wrap gap-3">
              <Link
                href={getDashboardHref(user.role)}
                className="inline-flex items-center justify-center gap-2 rounded-2xl border border-orange-200 bg-white px-5 py-3 text-sm font-bold text-slate-700 shadow-sm transition hover:bg-orange-50 hover:text-orange-600"
              >
                <ArrowLeft size={17} />
                Back to Dashboard
              </Link>

              <Link
                href="/user/profile/edit"
                className="inline-flex items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-orange-500 via-red-500 to-pink-500 px-5 py-3 text-sm font-bold text-white shadow-lg shadow-orange-200 transition duration-300 hover:-translate-y-0.5 hover:shadow-xl hover:shadow-orange-300"
              >
                <Edit3 size={17} />
                Edit Profile
              </Link>
            </div>
          </div>
        </section>

        <section className="mt-8 overflow-hidden rounded-[28px] border border-orange-100 bg-white shadow-sm">
          <div className="border-b border-orange-100 bg-orange-50/50 p-6">
            <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
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
                    getInitials(user.firstName, user.lastName)
                  )}
                </div>

                <div className="min-w-0">
                  <h2 className="text-2xl font-black text-slate-900">
                    {fullName}
                  </h2>

                  <p className="mt-2 flex items-center gap-2 break-all text-sm font-medium text-slate-500">
                    <Mail
                      size={16}
                      className="shrink-0 text-orange-500"
                    />
                    {user.email}
                  </p>

                  <span className="mt-4 inline-flex items-center gap-2 rounded-full bg-white px-3 py-1.5 text-xs font-bold uppercase tracking-[0.16em] text-orange-600 shadow-sm">
                    <ShieldCheck size={14} />
                    {user.role}
                  </span>
                </div>
              </div>

              <Link
                href="/user/profile/edit"
                className="inline-flex w-fit items-center justify-center gap-2 rounded-xl bg-slate-900 px-4 py-3 text-sm font-bold text-white transition hover:bg-orange-600"
              >
                Edit Profile
                <Edit3 size={17} />
              </Link>
            </div>

            <div className="mt-6 rounded-2xl border border-orange-100 bg-white p-5">
              <p className="text-sm font-semibold text-slate-500">
                Bio
              </p>
              <p className="mt-2 whitespace-pre-line text-sm leading-6 text-slate-700">
                {getValue(user.bio)}
              </p>
            </div>
          </div>

          <div className="grid gap-8 p-6 lg:grid-cols-2">
            <div>
              <h3 className="text-lg font-black text-slate-900">
                Personal information
              </h3>

              <div className="mt-5 grid gap-x-8 gap-y-5 sm:grid-cols-2">
                <ProfileField
                  label="First name"
                  value={getValue(user.firstName)}
                  icon={<UserRound size={18} />}
                />
                <ProfileField
                  label="Last name"
                  value={getValue(user.lastName)}
                />
                <ProfileField
                  label="Email"
                  value={user.email}
                  icon={<Mail size={18} />}
                />
                <ProfileField
                  label="Role"
                  value={user.role}
                  icon={<ShieldCheck size={18} />}
                />
              </div>
            </div>

            <div>
              <h3 className="text-lg font-black text-slate-900">
                Address
              </h3>

              <div className="mt-5 grid gap-x-8 gap-y-5 sm:grid-cols-2">
                <ProfileField
                  label="Country"
                  value={getValue(address.country)}
                />
                <ProfileField
                  label="State"
                  value={getValue(address.state)}
                />
                <ProfileField
                  label="City"
                  value={getValue(address.city)}
                />
                <ProfileField
                  label="Zip code"
                  value={getValue(address.zipCode)}
                />
              </div>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}

function ProfileField({
  label,
  value,
  icon,
}: {
  label: string;
  value: string;
  icon?: ReactNode;
}) {
  return (
    <div className="border-b border-orange-100 pb-4">
      <div className="flex items-center gap-2 text-sm font-semibold text-slate-500">
        {icon && (
          <span className="text-orange-600">
            {icon}
          </span>
        )}
        {label}
      </div>
      <p className="mt-2 break-words text-sm font-bold text-slate-900">
        {value}
      </p>
    </div>
  );
}
