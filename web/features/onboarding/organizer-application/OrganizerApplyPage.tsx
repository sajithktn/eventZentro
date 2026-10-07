"use client";

import { ChangeEvent, FormEvent, useEffect, useRef, useState, type ReactNode } from "react";
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
  LocateFixed,
  MapPin,
  Phone,
  Send,
  ShieldCheck,
  Trash2,
} from "lucide-react";

import api from "@/lib/axios";
import { uploadEventImage } from "@/services/event.service";
import { reverseGeocodeCoordinates } from "@/services/location.service";

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

const darkInputClasses =
  "h-12 w-full rounded-2xl border border-white/10 bg-white/5 pl-11 pr-4 text-sm text-white placeholder:text-white/40 outline-none transition hover:border-white/20 focus:border-pink-500 focus:bg-white/10 focus:ring-2 focus:ring-pink-500/20";

const profileImageAccept = "image/jpeg,image/png,image/webp";
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
    return url.protocol === "https:" || url.protocol === "http:";
  } catch {
    return false;
  }
};

export default function OrganizerApplyPage() {
  const router = useRouter();
  const profileImageInputRef = useRef<HTMLInputElement>(null);

  const [formData, setFormData] = useState<OrganizerFormData>(initialFormData);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [localProfileImagePreview, setLocalProfileImagePreview] = useState("");
  const [isProfileImageUploading, setIsProfileImageUploading] = useState(false);
  const [isDetectingLocation, setIsDetectingLocation] = useState(false);

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

  const handleInputChange = (event: ChangeEvent<HTMLInputElement>) => {
    const { name, value } = event.target;
    setFormData((previousData) => ({
      ...previousData,
      [name]: value,
    }));
  };

  const handleFieldChange = (
    event: ChangeEvent<HTMLSelectElement | HTMLTextAreaElement>
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

  const handleDetectLocation = () => {
    if (!navigator.geolocation) {
      toast.error("Geolocation is not supported by your browser.");
      return;
    }

    setIsDetectingLocation(true);
    navigator.geolocation.getCurrentPosition(
      async (position) => {
        try {
          const detected = await reverseGeocodeCoordinates({
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
          });
          const detectedName = [detected.city, detected.state].filter(Boolean).join(", ");
          handleLocationChange(detectedName);
          toast.success(`Location detected: ${detectedName}`);
        } catch (err) {
          toast.error(err instanceof Error ? err.message : "Unable to identify your location.");
        } finally {
          setIsDetectingLocation(false);
        }
      },
      (geoError) => {
        setIsDetectingLocation(false);
        if (geoError.code === geoError.PERMISSION_DENIED) {
          toast.error("Location permission was denied. Please enter manually.");
        } else {
          toast.error("Unable to retrieve location. Please enter manually.");
        }
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 300000 }
    );
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
      toast.error("Only JPG, PNG, and WEBP images are allowed.");
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
      const uploadedUrl = uploadResponse.image?.url?.trim() || "";
      if (!isPersistableImageUrl(uploadedUrl)) {
        throw new Error("The uploaded image did not return a valid URL.");
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
      toast.error("Organizer name must contain at least 3 characters.");
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
      toast.error("Description must contain at least 30 characters.");
      return false;
    }
    if (
      formData.profileImage &&
      !isPersistableImageUrl(formData.profileImage)
    ) {
      toast.error("Please upload a valid profile image before submitting.");
      return false;
    }
    return true;
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!validateForm()) {
      return;
    }

    if (isProfileImageUploading) {
      toast.error("Please wait for the profile image to finish uploading.");
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
      toast.error("Something went wrong while submitting the application.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const profileImagePreview =
    localProfileImagePreview || formData.profileImage;

  return (
    <main className="flex min-h-[calc(100vh-72px)] w-full flex-col justify-between overflow-hidden bg-[#08070d] text-white">
      <div>
        {/* Full-bleed Hero Banner matching Homepage & Events Page */}
        <section className="relative isolate overflow-hidden border-b border-white/10 bg-[radial-gradient(circle_at_top_left,#5b21b6_0%,transparent_36%),radial-gradient(circle_at_80%_20%,#be123c_0%,transparent_30%),linear-gradient(135deg,#08070d_0%,#110d1e_48%,#08070d_100%)]">
          <div className="pointer-events-none absolute -left-32 top-10 h-96 w-96 rounded-full bg-purple-600/20 blur-[100px]" />
          <div className="pointer-events-none absolute right-0 top-0 h-[400px] w-[400px] rounded-full bg-pink-500/20 blur-[120px]" />
          <div className="pointer-events-none absolute inset-0 opacity-[0.05] [background-image:linear-gradient(rgba(255,255,255,.4)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,.4)_1px,transparent_1px)] [background-size:70px_70px]" />

          <div className="relative mx-auto flex w-full max-w-[1600px] flex-col justify-between gap-6 px-4 py-12 sm:px-6 lg:px-8">
            <div>
              <div className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/[0.08] px-4 py-1.5 text-xs font-bold uppercase tracking-[0.2em] text-pink-400 backdrop-blur-xl">
                <ShieldCheck size={14} className="text-pink-400" />
                Organizer Application
              </div>

              <h1 className="mt-4 text-3xl font-black tracking-tight text-white sm:text-5xl">
                Become an{" "}
                <span className="bg-gradient-to-r from-pink-400 via-rose-300 to-orange-300 bg-clip-text text-transparent">
                  Organizer
                </span>
              </h1>

              <p className="mt-3 max-w-xl text-sm leading-6 text-white/60 sm:text-base">
                Share your organizer details and submit them for admin approval to start hosting and managing events.
              </p>
            </div>
          </div>
        </section>

        {/* Application Form Card */}
        <section className="relative mx-auto w-full max-w-[1200px] px-4 py-10 sm:px-6 lg:px-8">
          <form
            onSubmit={handleSubmit}
            className="overflow-hidden rounded-3xl border border-white/10 bg-[#120f1c] shadow-2xl"
          >
            {/* Form Section Header */}
            <div className="border-b border-white/10 bg-white/[0.02] px-6 py-6 sm:px-8">
              <div className="flex items-center gap-4">
                <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-pink-500/20 to-purple-500/20 text-pink-400 shadow-inner">
                  <Building2 size={24} />
                </span>

                <div>
                  <h2 className="text-xl font-black text-white">
                    Organizer Information
                  </h2>
                  <p className="mt-1 text-sm text-white/50">
                    Fill in the required organizer details to verify your organization.
                  </p>
                </div>
              </div>
            </div>

            <div className="space-y-8 p-6 sm:p-8">
              {/* Basic Details Section */}
              <section>
                <h3 className="text-sm font-bold uppercase tracking-wider text-pink-400">
                  Basic Details
                </h3>

                <div className="mt-5 grid gap-5 md:grid-cols-2">
                  <FormField label="Organizer or company name" htmlFor="organizerName">
                    <div className="relative">
                      <Building2
                        size={18}
                        className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-white/40"
                      />
                      <input
                        id="organizerName"
                        name="organizerName"
                        type="text"
                        placeholder="Enter organizer name"
                        value={formData.organizerName}
                        onChange={handleInputChange}
                        className={darkInputClasses}
                        required
                      />
                    </div>
                  </FormField>

                  <FormField label="Organizer category" htmlFor="category">
                    <div className="relative">
                      <Building2
                        size={18}
                        className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-white/40"
                      />
                      <select
                        id="category"
                        name="category"
                        value={formData.category}
                        onChange={handleFieldChange}
                        className="h-12 w-full appearance-none rounded-2xl border border-white/10 bg-[#181424] pl-11 pr-10 text-sm text-white outline-none transition hover:border-white/20 focus:border-pink-500 focus:ring-2 focus:ring-pink-500/20"
                        required
                      >
                        <option value="" className="bg-[#181424] text-white/50">
                          Select category
                        </option>
                        {organizerCategories.map((category) => (
                          <option key={category} value={category} className="bg-[#181424] text-white">
                            {category}
                          </option>
                        ))}
                      </select>
                      <div className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-white/40">
                        ▼
                      </div>
                    </div>
                  </FormField>

                  <FormField label="Phone number" htmlFor="phone">
                    <div className="relative">
                      <Phone
                        size={18}
                        className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-white/40"
                      />
                      <input
                        id="phone"
                        name="phone"
                        type="tel"
                        placeholder="Enter mobile number"
                        value={formData.phone}
                        onChange={handleInputChange}
                        className={darkInputClasses}
                        required
                      />
                    </div>
                  </FormField>

                  {/* Compact Location Input with Inline GPS Detect Button */}
                  <FormField label="Location" htmlFor="location">
                    <div className="relative flex items-center">
                      <MapPin
                        size={18}
                        className="pointer-events-none absolute left-4 text-pink-400"
                      />
                      <input
                        id="location"
                        name="location"
                        type="text"
                        placeholder="Enter your location or city"
                        value={formData.location}
                        onChange={(e) => handleLocationChange(e.target.value)}
                        className="h-12 w-full rounded-2xl border border-white/10 bg-white/5 pl-11 pr-28 text-sm text-white placeholder:text-white/40 outline-none transition hover:border-white/20 focus:border-pink-500 focus:bg-white/10 focus:ring-2 focus:ring-pink-500/20"
                        required
                      />
                      <button
                        type="button"
                        onClick={handleDetectLocation}
                        disabled={isDetectingLocation}
                        className="absolute right-1.5 inline-flex items-center gap-1.5 rounded-xl bg-gradient-to-r from-pink-500 to-rose-500 px-3 py-1.5 text-xs font-bold text-white shadow-md shadow-pink-500/20 transition hover:scale-105 disabled:opacity-50"
                        title="Detect my current location"
                      >
                        <LocateFixed
                          size={13}
                          className={isDetectingLocation ? "animate-spin" : ""}
                        />
                        {isDetectingLocation ? "Locating..." : "Detect"}
                      </button>
                    </div>
                  </FormField>
                </div>

                <div className="mt-5 space-y-2">
                  <label
                    htmlFor="description"
                    className="block text-sm font-semibold text-white/80"
                  >
                    About the organizer
                  </label>

                  <div className="relative">
                    <FileText
                      size={18}
                      className="pointer-events-none absolute left-4 top-4 text-white/40"
                    />
                    <textarea
                      id="description"
                      name="description"
                      rows={5}
                      value={formData.description}
                      onChange={handleFieldChange}
                      placeholder="Describe your organization, past event experience, and the types of events you plan to host."
                      className="w-full resize-none rounded-2xl border border-white/10 bg-white/5 py-3 pl-11 pr-4 text-sm text-white placeholder:text-white/40 outline-none transition hover:border-white/20 focus:border-pink-500 focus:bg-white/10 focus:ring-2 focus:ring-pink-500/20"
                      required
                    />
                  </div>

                  <p className="text-right text-xs font-medium text-white/40">
                    {formData.description.length} characters (minimum 30)
                  </p>
                </div>
              </section>

              {/* Online Presence Section */}
              <section className="border-t border-white/10 pt-6">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-bold uppercase tracking-wider text-pink-400">
                    Online Presence
                  </h3>
                  <span className="text-xs text-white/40">Optional</span>
                </div>

                <div className="mt-5 grid gap-5 md:grid-cols-2">
                  <FormField label="Website" htmlFor="website">
                    <div className="relative">
                      <Globe2
                        size={18}
                        className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-white/40"
                      />
                      <input
                        id="website"
                        name="website"
                        type="url"
                        placeholder="https://yourwebsite.com"
                        value={formData.website}
                        onChange={handleInputChange}
                        className={darkInputClasses}
                      />
                    </div>
                  </FormField>

                  <FormField label="Instagram" htmlFor="instagram">
                    <div className="relative">
                      <Link2
                        size={18}
                        className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-white/40"
                      />
                      <input
                        id="instagram"
                        name="instagram"
                        type="url"
                        placeholder="https://instagram.com/username"
                        value={formData.instagram}
                        onChange={handleInputChange}
                        className={darkInputClasses}
                      />
                    </div>
                  </FormField>

                  <FormField label="LinkedIn" htmlFor="linkedin">
                    <div className="relative">
                      <Link2
                        size={18}
                        className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-white/40"
                      />
                      <input
                        id="linkedin"
                        name="linkedin"
                        type="url"
                        placeholder="https://linkedin.com/in/profile"
                        value={formData.linkedin}
                        onChange={handleInputChange}
                        className={darkInputClasses}
                      />
                    </div>
                  </FormField>

                  {/* Profile Image or Logo Upload */}
                  <FormField label="Profile image or logo" htmlFor="profileImageUpload">
                    <input
                      ref={profileImageInputRef}
                      id="profileImageUpload"
                      type="file"
                      accept={profileImageAccept}
                      onChange={handleProfileImageChange}
                      className="sr-only"
                      disabled={isProfileImageUploading || isSubmitting}
                    />
                    <input
                      name="profileImage"
                      value={formData.profileImage}
                      type="hidden"
                      readOnly
                    />

                    <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
                      <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
                        <div className="flex h-20 w-20 shrink-0 items-center justify-center overflow-hidden rounded-2xl border border-white/10 bg-black/40 text-pink-400">
                          {profileImagePreview ? (
                            <Image
                              src={profileImagePreview}
                              alt="Organizer profile preview"
                              width={80}
                              height={80}
                              unoptimized
                              className="h-full w-full object-cover"
                            />
                          ) : (
                            <ImageIcon size={26} aria-hidden="true" />
                          )}
                        </div>

                        <div className="min-w-0 flex-1">
                          <div className="flex flex-wrap items-center gap-2">
                            <button
                              type="button"
                              onClick={() => profileImageInputRef.current?.click()}
                              disabled={isProfileImageUploading || isSubmitting}
                              className="inline-flex min-h-9 items-center justify-center gap-2 rounded-xl border border-white/15 bg-white/10 px-4 py-2 text-xs font-bold text-white transition hover:bg-white/15 disabled:pointer-events-none disabled:opacity-50"
                            >
                              <ImageIcon size={15} aria-hidden="true" />
                              {profileImagePreview
                                ? "Change image"
                                : "Choose image"}
                            </button>

                            {profileImagePreview && !isProfileImageUploading && (
                              <button
                                type="button"
                                onClick={clearProfileImage}
                                disabled={isSubmitting}
                                className="inline-flex min-h-9 items-center justify-center gap-2 rounded-xl border border-red-500/20 bg-red-950/30 px-3 py-2 text-xs font-bold text-red-400 transition hover:bg-red-900/40 disabled:pointer-events-none disabled:opacity-50"
                              >
                                <Trash2 size={15} aria-hidden="true" />
                                Remove
                              </button>
                            )}
                          </div>

                          <p className="mt-2 text-xs text-white/40">
                            JPG, PNG, or WEBP (Max 5 MB).
                          </p>

                          {isProfileImageUploading && (
                            <p className="mt-2 inline-flex items-center gap-2 text-xs font-bold text-pink-400">
                              <LoaderCircle
                                size={14}
                                className="animate-spin"
                                aria-hidden="true"
                              />
                              Uploading image...
                            </p>
                          )}

                          {formData.profileImage && !isProfileImageUploading && (
                            <p className="mt-2 text-xs font-bold text-emerald-400">
                              Image uploaded successfully.
                            </p>
                          )}
                        </div>
                      </div>
                    </div>
                  </FormField>
                </div>
              </section>
            </div>

            {/* Form Actions Footer */}
            <div className="flex flex-col-reverse gap-3 border-t border-white/10 bg-white/[0.02] px-6 py-5 sm:flex-row sm:items-center sm:justify-between sm:px-8">
              <button
                type="button"
                onClick={() => router.back()}
                className="inline-flex items-center justify-center gap-2 rounded-2xl border border-white/15 bg-white/5 px-5 py-3 text-sm font-semibold text-white/80 transition hover:bg-white/10 hover:text-white"
              >
                <ArrowLeft size={16} />
                Cancel
              </button>

              <button
                type="submit"
                disabled={isSubmitting || isProfileImageUploading}
                className="inline-flex items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-pink-500 via-rose-500 to-orange-500 px-7 py-3.5 text-sm font-bold text-white shadow-lg shadow-pink-500/25 transition hover:scale-[1.02] disabled:opacity-50"
              >
                {isSubmitting || isProfileImageUploading ? (
                  <>
                    <LoaderCircle size={17} className="animate-spin" />
                    {isProfileImageUploading
                      ? "Uploading image..."
                      : "Submitting..."}
                  </>
                ) : (
                  <>
                    <Send size={16} />
                    Submit Application
                  </>
                )}
              </button>
            </div>
          </form>
        </section>
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
      <label htmlFor={htmlFor} className="block text-sm font-semibold text-white/80">
        {label}
      </label>
      {children}
    </div>
  );
}
