"use client";

import {
  ChangeEvent,
  FormEvent,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import axios from "axios";
import { toast } from "sonner";
import {
  ArrowLeft,
  Building2,
  FileText,
  Globe2,
  ImageIcon,
  Link2,
  LoaderCircle,
  Phone,
  Send,
  ShieldCheck,
  Trash2,
} from "lucide-react";

import Input from "@/components/common/Input";
import Button from "@/components/common/Button";
import LocationSelector from "@/components/location/LocationSelector";
import api from "@/lib/axios";
import { uploadEventImage } from "@/services/event.service";

interface OrganizerFormData {
  organizerName: string;
  category: string;
  description: string;
  phone: string;
  location: string;
  website: string;
  instagram: string;
  linkedin: string;
  profileImage: string;
}

const initialFormData: OrganizerFormData = {
  organizerName: "",
  category: "",
  description: "",
  phone: "",
  location: "",
  website: "",
  instagram: "",
  linkedin: "",
  profileImage: "",
};

const organizerCategories = [
  "Individual Organizer",
  "Event Management Company",
  "Music and Entertainment",
  "Technology",
  "Business and Networking",
  "Education and Workshops",
  "Sports",
  "Food and Lifestyle",
  "Arts and Culture",
  "Other",
];

const fieldInputClasses =
  "border-orange-100 bg-white !text-slate-900 caret-slate-900 placeholder:text-slate-400 hover:border-orange-200 focus:border-orange-400 focus:bg-white focus:ring-orange-100";

const profileImageAccept =
  "image/jpeg,image/png,image/webp";

const allowedProfileImageTypes = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
]);

const maxProfileImageSizeInBytes = 5 * 1024 * 1024;

const isPersistableImageUrl = (value: string) => {
  const trimmedValue = value.trim();

  if (!trimmedValue) {
    return false;
  }

  if (
    trimmedValue.startsWith("blob:") ||
    trimmedValue.startsWith("data:") ||
    trimmedValue.includes("fakepath")
  ) {
    return false;
  }

  try {
    const url = new URL(trimmedValue);

    return (
      url.protocol === "https:" ||
      url.protocol === "http:"
    );
  } catch {
    return false;
  }
};

export default function OrganizerApplyPage() {
  const router = useRouter();
  const profileImageInputRef =
    useRef<HTMLInputElement>(null);

  const [formData, setFormData] =
    useState<OrganizerFormData>(initialFormData);

  const [isSubmitting, setIsSubmitting] =
    useState(false);

  const [
    localProfileImagePreview,
    setLocalProfileImagePreview,
  ] = useState("");

  const [
    isProfileImageUploading,
    setIsProfileImageUploading,
  ] = useState(false);

  useEffect(() => {
    if (!localProfileImagePreview) {
      return;
    }

    return () => {
      URL.revokeObjectURL(localProfileImagePreview);
    };
  }, [localProfileImagePreview]);

  const resetProfileImageInput = () => {
    if (profileImageInputRef.current) {
      profileImageInputRef.current.value = "";
    }
  };

  const handleInputChange = (
    event: ChangeEvent<HTMLInputElement>
  ) => {
    const { name, value } = event.target;

    setFormData((previousData) => ({
      ...previousData,
      [name]: value,
    }));
  };

  const handleFieldChange = (
    event: ChangeEvent<
      HTMLSelectElement | HTMLTextAreaElement
    >
  ) => {
    const { name, value } = event.target;

    setFormData((previousData) => ({
      ...previousData,
      [name]: value,
    }));
  };

  const handleLocationChange = (location: string) => {
    setFormData((previousData) => ({
      ...previousData,
      location,
    }));
  };

  const clearProfileImage = () => {
    setFormData((previousData) => ({
      ...previousData,
      profileImage: "",
    }));
    setLocalProfileImagePreview("");
    resetProfileImageInput();
  };

  const getUploadErrorMessage = (error: unknown) => {
    if (axios.isAxiosError(error)) {
      return (
        error.response?.data?.message ||
        "Failed to upload profile image."
      );
    }

    if (error instanceof Error && error.message) {
      return error.message;
    }

    return "Failed to upload profile image.";
  };

  const handleProfileImageChange = async (
    event: ChangeEvent<HTMLInputElement>
  ) => {
    const file = event.target.files?.[0];

    if (!file) {
      return;
    }

    if (!allowedProfileImageTypes.has(file.type)) {
      toast.error(
        "Only JPG, PNG, and WEBP images are allowed."
      );
      resetProfileImageInput();
      return;
    }

    if (file.size > maxProfileImageSizeInBytes) {
      toast.error("Image size must be 5 MB or smaller.");
      resetProfileImageInput();
      return;
    }

    const previewUrl = URL.createObjectURL(file);

    setLocalProfileImagePreview(previewUrl);
    setFormData((previousData) => ({
      ...previousData,
      profileImage: "",
    }));
    setIsProfileImageUploading(true);

    try {
      const uploadResponse = await uploadEventImage(file);
      const uploadedUrl =
        uploadResponse.image?.url?.trim() || "";

      if (!isPersistableImageUrl(uploadedUrl)) {
        throw new Error(
          "The uploaded image did not return a valid URL."
        );
      }

      setFormData((previousData) => ({
        ...previousData,
        profileImage: uploadedUrl,
      }));
      setLocalProfileImagePreview("");
      toast.success("Profile image uploaded successfully.");
    } catch (error: unknown) {
      setFormData((previousData) => ({
        ...previousData,
        profileImage: "",
      }));
      setLocalProfileImagePreview("");
      resetProfileImageInput();
      toast.error(getUploadErrorMessage(error));
    } finally {
      setIsProfileImageUploading(false);
    }
  };

  const validateForm = () => {
    if (formData.organizerName.trim().length < 3) {
      toast.error(
        "Organizer name must contain at least 3 characters."
      );
      return false;
    }

    if (!formData.category) {
      toast.error("Please select an organizer category.");
      return false;
    }

    if (formData.phone.trim().length < 8) {
      toast.error("Please enter a valid phone number.");
      return false;
    }

    if (formData.location.trim().length < 2) {
      toast.error("Please enter your location.");
      return false;
    }

    if (formData.description.trim().length < 30) {
      toast.error(
        "Description must contain at least 30 characters."
      );
      return false;
    }

    if (
      formData.profileImage &&
      !isPersistableImageUrl(formData.profileImage)
    ) {
      toast.error(
        "Please upload a valid profile image before submitting."
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

    if (isProfileImageUploading) {
      toast.error(
        "Please wait for the profile image to finish uploading."
      );
      return;
    }

    try {
      setIsSubmitting(true);

      const applicationPayload = {
        ...formData,
        profileImage: formData.profileImage.trim(),
      };

      const response = await api.post(
        "/organizer-applications",
        applicationPayload
      );

      toast.success(
        response.data?.message ||
          "Organizer application submitted successfully."
      );

      setFormData(initialFormData);
      setLocalProfileImagePreview("");
      resetProfileImageInput();

      router.push("/dashboard");
    } catch (error: unknown) {
      if (axios.isAxiosError(error)) {
        toast.error(
          error.response?.data?.message ||
            "Failed to submit organizer application."
        );
        return;
      }

      toast.error(
        "Something went wrong while submitting the application."
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const profileImagePreview =
    localProfileImagePreview || formData.profileImage;

  return (
    <main className="min-h-screen bg-[#fffaf5] px-4 pb-16 pt-6 sm:px-6">
      <div className="mx-auto max-w-6xl">
        <section className="rounded-[30px] border border-orange-100 bg-gradient-to-br from-orange-50 via-white to-rose-50 px-6 py-8 shadow-sm sm:px-8">
          <div className="flex flex-col justify-between gap-6 sm:flex-row sm:items-center">
            <div>
              <div className="inline-flex items-center gap-2 rounded-full border border-orange-200 bg-white/80 px-4 py-2 text-xs font-bold uppercase tracking-[0.2em] text-orange-600 shadow-sm">
                <ShieldCheck size={15} />
                Organizer application
              </div>

              <h1 className="mt-4 text-4xl font-black tracking-tight text-slate-950 sm:text-5xl">
                Become an Organizer
              </h1>

              <p className="mt-3 max-w-xl text-sm leading-6 text-slate-600 sm:text-base">
                Share your organizer details and submit them for admin
                approval.
              </p>
            </div>
          </div>
        </section>

        <form
          onSubmit={handleSubmit}
          className="mt-8 overflow-hidden rounded-[28px] border border-orange-100 bg-white shadow-sm"
        >
          <div className="border-b border-orange-100 bg-orange-50/40 px-6 py-5">
            <div className="flex items-center gap-4">
              <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-orange-100 text-orange-600">
                <Building2 size={22} />
              </span>

              <div>
                <h2 className="text-lg font-black text-slate-900">
                  Organizer information
                </h2>

                <p className="mt-1 text-sm text-slate-500">
                  Fill in the required organizer details.
                </p>
              </div>
            </div>
          </div>

          <div className="space-y-8 p-6">
            <section>
              <h3 className="text-base font-black text-slate-900">
                Basic details
              </h3>

              <div className="mt-5 grid gap-5 md:grid-cols-2">
                <FormField
                  label="Organizer or company name"
                  htmlFor="organizerName"
                >
                  <Input
                    id="organizerName"
                    name="organizerName"
                    placeholder="Enter organizer name"
                    value={formData.organizerName}
                    onChange={handleInputChange}
                    leftIcon={<Building2 size={18} />}
                    className={fieldInputClasses}
                    required
                  />
                </FormField>

                <div className="space-y-2">
                  <label
                    htmlFor="category"
                    className="block text-sm font-semibold text-slate-600"
                  >
                    Organizer category
                  </label>

                  <div className="relative">
                    <Building2
                      size={18}
                      className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"
                    />

                    <select
                      id="category"
                      name="category"
                      value={formData.category}
                      onChange={handleFieldChange}
                      className="h-12 w-full appearance-none rounded-xl border border-orange-100 bg-white pl-11 pr-4 text-sm text-slate-900 outline-none transition-all duration-300 hover:border-orange-200 focus:border-orange-400 focus:bg-white focus:ring-4 focus:ring-orange-100"
                      required
                    >
                      <option value="">
                        Select category
                      </option>

                      {organizerCategories.map(
                        (category) => (
                          <option
                            key={category}
                            value={category}
                          >
                            {category}
                          </option>
                        )
                      )}
                    </select>
                  </div>
                </div>

                <FormField label="Phone number" htmlFor="phone">
                  <Input
                    id="phone"
                    name="phone"
                    type="tel"
                    placeholder="Enter mobile number"
                    value={formData.phone}
                    onChange={handleInputChange}
                    leftIcon={<Phone size={18} />}
                    className={fieldInputClasses}
                    required
                  />
                </FormField>

                <FormField label="Location" htmlFor="location">
                  <LocationSelector
                    inputId="location"
                    inputName="location"
                    value={formData.location}
                    onChange={handleLocationChange}
                    placeholder="Enter your location"
                    inputClassName={fieldInputClasses}
                    title="Organizer location"
                    required
                  />
                </FormField>
              </div>

              <div className="mt-5 space-y-2">
                <label
                  htmlFor="description"
                  className="block text-sm font-semibold text-slate-600"
                >
                  About the organizer
                </label>

                <div className="relative">
                  <FileText
                    size={18}
                    className="pointer-events-none absolute left-4 top-4 text-slate-400"
                  />

                  <textarea
                    id="description"
                    name="description"
                    rows={6}
                    value={formData.description}
                    onChange={handleFieldChange}
                    placeholder="Describe your organization, experience, and the types of events you organize."
                    className="w-full resize-none rounded-xl border border-orange-100 bg-white py-3 pl-11 pr-4 text-sm text-slate-900 outline-none transition-all duration-300 placeholder:text-slate-400 hover:border-orange-200 focus:border-orange-400 focus:bg-white focus:ring-4 focus:ring-orange-100"
                    required
                  />
                </div>

                <p className="text-right text-xs font-medium text-slate-400">
                  {formData.description.length} characters
                </p>
              </div>
            </section>

            <section className="border-t border-orange-100 pt-6">
              <h3 className="text-base font-black text-slate-900">
                Online presence
              </h3>

              <p className="mt-1 text-sm text-slate-500">
                These fields are optional.
              </p>

              <div className="mt-5 grid gap-5 md:grid-cols-2">
                <FormField label="Website" htmlFor="website">
                  <Input
                    id="website"
                    name="website"
                    type="url"
                    placeholder="https://yourwebsite.com"
                    value={formData.website}
                    onChange={handleInputChange}
                    leftIcon={<Globe2 size={18} />}
                    className={fieldInputClasses}
                  />
                </FormField>

                <FormField label="Instagram" htmlFor="instagram">
                  <Input
                    id="instagram"
                    name="instagram"
                    type="url"
                    placeholder="https://instagram.com/username"
                    value={formData.instagram}
                    onChange={handleInputChange}
                    leftIcon={<Link2 size={18} />}
                    className={fieldInputClasses}
                  />
                </FormField>

                <FormField label="LinkedIn" htmlFor="linkedin">
                  <Input
                    id="linkedin"
                    name="linkedin"
                    type="url"
                    placeholder="https://linkedin.com/in/profile"
                    value={formData.linkedin}
                    onChange={handleInputChange}
                    leftIcon={<Link2 size={18} />}
                    className={fieldInputClasses}
                  />
                </FormField>

                <FormField
                  label="Profile image or logo"
                  htmlFor="profileImageUpload"
                >
                  <input
                    ref={profileImageInputRef}
                    id="profileImageUpload"
                    type="file"
                    accept={profileImageAccept}
                    onChange={handleProfileImageChange}
                    className="sr-only"
                    disabled={
                      isProfileImageUploading ||
                      isSubmitting
                    }
                  />

                  <input
                    name="profileImage"
                    value={formData.profileImage}
                    type="hidden"
                    readOnly
                  />

                  <div className="rounded-xl border border-orange-100 bg-white p-4">
                    <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
                      <div className="flex h-24 w-24 shrink-0 items-center justify-center overflow-hidden rounded-2xl border border-orange-100 bg-orange-50 text-orange-400">
                        {profileImagePreview ? (
                          <Image
                            src={profileImagePreview}
                            alt="Organizer profile preview"
                            width={96}
                            height={96}
                            unoptimized
                            className="h-full w-full object-cover"
                          />
                        ) : (
                          <ImageIcon
                            size={28}
                            aria-hidden="true"
                          />
                        )}
                      </div>

                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <button
                            type="button"
                            onClick={() =>
                              profileImageInputRef.current?.click()
                            }
                            disabled={
                              isProfileImageUploading ||
                              isSubmitting
                            }
                            className="inline-flex min-h-10 items-center justify-center gap-2 rounded-xl border border-orange-200 bg-orange-50 px-4 py-2 text-sm font-bold text-orange-600 transition-all hover:border-orange-300 hover:bg-orange-100 disabled:pointer-events-none disabled:opacity-50"
                          >
                            <ImageIcon
                              size={17}
                              aria-hidden="true"
                            />
                            {profileImagePreview
                              ? "Choose another"
                              : "Choose image"}
                          </button>

                          {profileImagePreview &&
                            !isProfileImageUploading && (
                              <button
                                type="button"
                                onClick={clearProfileImage}
                                disabled={isSubmitting}
                                className="inline-flex min-h-10 items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-bold text-slate-600 transition-all hover:border-red-200 hover:bg-red-50 hover:text-red-600 disabled:pointer-events-none disabled:opacity-50"
                              >
                                <Trash2
                                  size={17}
                                  aria-hidden="true"
                                />
                                Remove
                              </button>
                            )}
                        </div>

                        <p className="mt-2 text-xs font-medium text-slate-500">
                          JPG, PNG, or WEBP. Maximum size 5 MB.
                        </p>

                        {isProfileImageUploading && (
                          <p className="mt-2 inline-flex items-center gap-2 text-xs font-bold text-orange-600">
                            <LoaderCircle
                              size={14}
                              className="animate-spin"
                              aria-hidden="true"
                            />
                            Uploading image...
                          </p>
                        )}

                        {formData.profileImage &&
                          !isProfileImageUploading && (
                            <p className="mt-2 text-xs font-bold text-emerald-600">
                              Image uploaded and ready.
                            </p>
                          )}
                      </div>
                    </div>
                  </div>
                </FormField>
              </div>
            </section>
          </div>

          <div className="flex flex-col-reverse gap-3 border-t border-orange-100 bg-orange-50/40 px-6 py-5 sm:flex-row sm:justify-between">
            <Button
              type="button"
              variant="outline"
              onClick={() => router.back()}
              className="border-orange-200 bg-white text-slate-700 hover:border-orange-300 hover:bg-orange-50 hover:text-orange-600 focus-visible:ring-orange-300 focus-visible:ring-offset-[#fffaf5]"
            >
              <ArrowLeft size={18} />
              Cancel
            </Button>

            <Button
              type="submit"
              isLoading={
                isSubmitting || isProfileImageUploading
              }
              className="rounded-2xl px-6 py-3.5 shadow-lg shadow-orange-200 hover:shadow-xl hover:shadow-orange-300 focus-visible:ring-orange-300 focus-visible:ring-offset-[#fffaf5]"
            >
              {!isSubmitting &&
                !isProfileImageUploading && (
                  <Send size={18} />
                )}
              {isProfileImageUploading
                ? "Uploading image..."
                : isSubmitting
                ? "Submitting..."
                : "Submit Application"}
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
}: {
  label: string;
  htmlFor: string;
  children: ReactNode;
}) {
  return (
    <div className="space-y-2">
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
