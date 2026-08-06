"use client";

import axios from "axios";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  ImageIcon,
  MapPin,
  Save,
  UserRound,
} from "lucide-react";
import {
  ChangeEvent,
  FormEvent,
  useEffect,
  useState,
  type ReactNode,
} from "react";
import { toast } from "sonner";

import Button from "@/components/common/Button";
import Input from "@/components/common/Input";
import Loader from "@/components/common/Loader";
import {
  setAuthChecked,
  setUser,
} from "@/redux/features/auth/authSlice";
import {
  useAppDispatch,
  useAppSelector,
} from "@/redux/hooks";
import {
  getCurrentUser,
  updateProfile,
} from "@/services/auth.service";
import type {
  UpdateProfileData,
  User,
} from "@/types/auth";

interface ProfileFormData {
  firstName: string;
  lastName: string;
  profileImage: string;
  bio: string;
  country: string;
  state: string;
  city: string;
  zipCode: string;
}

const fieldInputClasses =
  "border-orange-100 bg-white text-slate-900 placeholder:text-slate-400 hover:border-orange-200 focus:border-orange-400 focus:bg-white focus:ring-orange-100";

const getInitialFormData = (
  user: User
): ProfileFormData => ({
  firstName: user.firstName || "",
  lastName: user.lastName || "",
  profileImage: user.profileImage || "",
  bio: user.bio || "",
  country: user.address?.country || "",
  state: user.address?.state || "",
  city: user.address?.city || "",
  zipCode: user.address?.zipCode || "",
});

const isValidOptionalUrl = (value: string) => {
  if (!value) {
    return true;
  }

  try {
    new URL(value);
    return true;
  } catch {
    return false;
  }
};

export default function EditUserProfilePage() {
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
            <Loader text="Loading profile editor..." />
          </div>
        </div>
      </main>
    );
  }

  return <EditUserProfileForm user={user} />;
}

function EditUserProfileForm({
  user,
}: {
  user: User;
}) {
  const router = useRouter();
  const dispatch = useAppDispatch();

  const [formData, setFormData] =
    useState<ProfileFormData>(() =>
      getInitialFormData(user)
    );
  const [isSubmitting, setIsSubmitting] =
    useState(false);

  const handleInputChange = (
    event: ChangeEvent<HTMLInputElement>
  ) => {
    const { name, value } = event.target;

    setFormData((previousData) => ({
      ...previousData,
      [name]: value,
    }));
  };

  const handleBioChange = (
    event: ChangeEvent<HTMLTextAreaElement>
  ) => {
    setFormData((previousData) => ({
      ...previousData,
      bio: event.target.value,
    }));
  };

  const validateForm = () => {
    if (!formData.firstName.trim()) {
      toast.error("First name is required.");
      return false;
    }

    if (formData.bio.trim().length > 1000) {
      toast.error("Bio cannot exceed 1000 characters.");
      return false;
    }

    if (
      !isValidOptionalUrl(
        formData.profileImage.trim()
      )
    ) {
      toast.error(
        "Profile image URL must be a valid URL."
      );
      return false;
    }

    return true;
  };

  const handleSubmit = async (
    event: FormEvent<HTMLFormElement>
  ) => {
    event.preventDefault();

    if (!validateForm()) {
      return;
    }

    const payload: UpdateProfileData = {
      firstName: formData.firstName.trim(),
      lastName: formData.lastName.trim(),
      profileImage: formData.profileImage.trim(),
      bio: formData.bio.trim(),
      address: {
        country: formData.country.trim(),
        state: formData.state.trim(),
        city: formData.city.trim(),
        zipCode: formData.zipCode.trim(),
      },
    };

    try {
      setIsSubmitting(true);

      const response = await updateProfile(payload);

      if (response.user) {
        dispatch(setUser(response.user));
      }

      toast.success(
        response.message ||
          "Profile updated successfully."
      );

      router.push("/user/profile");
    } catch (error: unknown) {
      if (axios.isAxiosError(error)) {
        const message =
          error.response?.data?.message;

        toast.error(
          typeof message === "string"
            ? message
            : "Failed to update profile."
        );
        return;
      }

      toast.error(
        "Something went wrong while updating your profile."
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <main className="min-h-screen bg-[#fffaf5] px-4 pb-16 pt-6 sm:px-6">
      <div className="mx-auto max-w-6xl">
        <section className="rounded-[30px] border border-orange-100 bg-gradient-to-br from-orange-50 via-white to-rose-50 px-6 py-8 shadow-sm sm:px-8">
          <div className="flex flex-col justify-between gap-6 sm:flex-row sm:items-center">
            <div>
              <div className="inline-flex items-center gap-2 rounded-full border border-orange-200 bg-white/80 px-4 py-2 text-xs font-bold uppercase tracking-[0.2em] text-orange-600 shadow-sm">
                <UserRound size={15} />
                Edit profile
              </div>

              <h1 className="mt-4 text-4xl font-black tracking-tight text-slate-950 sm:text-5xl">
                Update Profile
              </h1>

              <p className="mt-3 max-w-xl text-sm leading-6 text-slate-600 sm:text-base">
                Keep your name, bio and location details current.
              </p>
            </div>
          </div>
        </section>

        <form
          onSubmit={handleSubmit}
          className="mt-8 overflow-hidden rounded-[28px] border border-orange-100 bg-white shadow-sm"
        >
          <div className="grid gap-5 p-6 sm:grid-cols-2">
            <FormField label="First name" htmlFor="firstName">
              <Input
                id="firstName"
                name="firstName"
                value={formData.firstName}
                onChange={handleInputChange}
                leftIcon={<UserRound size={18} />}
                className={fieldInputClasses}
                required
              />
            </FormField>

            <FormField label="Last name" htmlFor="lastName">
              <Input
                id="lastName"
                name="lastName"
                value={formData.lastName}
                onChange={handleInputChange}
                leftIcon={<UserRound size={18} />}
                className={fieldInputClasses}
              />
            </FormField>

            <FormField
              label="Profile image URL"
              htmlFor="profileImage"
              className="sm:col-span-2"
            >
              <Input
                id="profileImage"
                name="profileImage"
                type="url"
                value={formData.profileImage}
                onChange={handleInputChange}
                leftIcon={<ImageIcon size={18} />}
                className={fieldInputClasses}
              />
            </FormField>

            <div className="space-y-2 sm:col-span-2">
              <label
                htmlFor="bio"
                className="block text-sm font-semibold text-slate-600"
              >
                Bio
              </label>
              <textarea
                id="bio"
                name="bio"
                rows={6}
                value={formData.bio}
                onChange={handleBioChange}
                className="w-full resize-none rounded-xl border border-orange-100 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition-all duration-300 placeholder:text-slate-400 hover:border-orange-200 focus:border-orange-400 focus:bg-white focus:ring-4 focus:ring-orange-100"
              />
              <p className="text-right text-xs font-medium text-slate-400">
                {formData.bio.length}/1000
              </p>
            </div>

            <FormField label="Country" htmlFor="country">
              <Input
                id="country"
                name="country"
                value={formData.country}
                onChange={handleInputChange}
                leftIcon={<MapPin size={18} />}
                className={fieldInputClasses}
              />
            </FormField>

            <FormField label="State" htmlFor="state">
              <Input
                id="state"
                name="state"
                value={formData.state}
                onChange={handleInputChange}
                leftIcon={<MapPin size={18} />}
                className={fieldInputClasses}
              />
            </FormField>

            <FormField label="City" htmlFor="city">
              <Input
                id="city"
                name="city"
                value={formData.city}
                onChange={handleInputChange}
                leftIcon={<MapPin size={18} />}
                className={fieldInputClasses}
              />
            </FormField>

            <FormField label="Zip code" htmlFor="zipCode">
              <Input
                id="zipCode"
                name="zipCode"
                value={formData.zipCode}
                onChange={handleInputChange}
                leftIcon={<MapPin size={18} />}
                className={fieldInputClasses}
              />
            </FormField>
          </div>

          <div className="flex flex-col-reverse gap-3 border-t border-orange-100 bg-orange-50/40 px-6 py-5 sm:flex-row sm:justify-between">
            <Button
              type="button"
              variant="outline"
              onClick={() => router.push("/user/profile")}
              className="border-orange-200 bg-white text-slate-700 hover:border-orange-300 hover:bg-orange-50 hover:text-orange-600 focus-visible:ring-orange-300 focus-visible:ring-offset-[#fffaf5]"
            >
              <ArrowLeft size={18} />
              Cancel
            </Button>

            <Button
              type="submit"
              isLoading={isSubmitting}
              className="rounded-2xl px-6 py-3.5 shadow-lg shadow-orange-200 hover:shadow-xl hover:shadow-orange-300 focus-visible:ring-orange-300 focus-visible:ring-offset-[#fffaf5]"
            >
              {!isSubmitting && <Save size={18} />}
              {isSubmitting ? "Saving..." : "Save Profile"}
            </Button>
          </div>
        </form>
      </div>
    </main>
  );
}

function FormField({
  label,
  htmlFor,
  children,
  className = "",
}: {
  label: string;
  htmlFor: string;
  children: ReactNode;
  className?: string;
}) {
  return (
    <div className={`space-y-2 ${className}`}>
      <label
        htmlFor={htmlFor}
        className="block text-sm font-semibold text-slate-600"
      >
        {label}
      </label>
      {children}
    </div>
  );
}
