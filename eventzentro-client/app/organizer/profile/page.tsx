"use client";

import type {
  FormEvent,
} from "react";
import {
  useEffect,
  useMemo,
  useState,
} from "react";
import Link from "next/link";
import {
  ArrowRight,
  AtSign,
  BadgeCheck,
  Building2,
  CalendarDays,
  Camera,
  Copy,
  ExternalLink,
  Globe2,
  Link2,
  Loader2,
  MapPin,
  Pencil,
  Save,
  Share2,
  Ticket,
  Users,
  X,
} from "lucide-react";
import { toast } from "sonner";

import {
  useAppDispatch,
  useAppSelector,
} from "@/redux/hooks";
import { setUser } from "@/redux/features/auth/authSlice";
import { updateProfile } from "@/services/auth.service";
import { getOrganizerEvents } from "@/services/event.service";
import type { User } from "@/types/auth";
import type { Event } from "@/types/event";
import {
  formatCurrency,
  formatEventDate,
} from "@/utils/event";
import {
  SUMMARY_PAGE_SIZE,
} from "@/utils/pagination";

type OrganizerUser = User & {
  organizerName?: string;
  companyName?: string;
  organizerCategory?: string;
  website?: string;
  instagram?: string;
  facebook?: string;
  linkedin?: string;
  twitter?: string;
  favoriteCategories?: string[];

  socialLinks?: {
    website?: string;
    instagram?: string;
    facebook?: string;
    linkedin?: string;
    twitter?: string;
  };
};

interface EditProfileForm {
  firstName: string;
  lastName: string;
  organizerName: string;
  companyName: string;
  organizerCategory: string;
  profileImage: string;
  bio: string;
  website: string;
  instagram: string;
  facebook: string;
  linkedin: string;
  twitter: string;
  country: string;
  state: string;
  city: string;
  zipCode: string;
}

const emptyEditForm: EditProfileForm = {
  firstName: "",
  lastName: "",
  organizerName: "",
  companyName: "",
  organizerCategory: "",
  profileImage: "",
  bio: "",
  website: "",
  instagram: "",
  facebook: "",
  linkedin: "",
  twitter: "",
  country: "",
  state: "",
  city: "",
  zipCode: "",
};

const getFullName = (
  firstName?: string,
  lastName?: string
) => {
  return (
    [firstName, lastName]
      .filter(Boolean)
      .join(" ") || "Organizer"
  );
};

const getInitials = (name: string) => {
  return name
    .split(" ")
    .filter(Boolean)
    .map((part) => part.charAt(0))
    .join("")
    .slice(0, 2)
    .toUpperCase();
};

const getLocation = (
  user: OrganizerUser
) => {
  const location = [
    user.address?.city,
    user.address?.state,
    user.address?.country,
  ]
    .filter(Boolean)
    .join(", ");

  return location || "Location not added";
};

const getEditFormValues = (
  user: OrganizerUser
): EditProfileForm => {
  return {
    firstName: user.firstName || "",
    lastName: user.lastName || "",
    organizerName:
      user.organizerName || "",
    companyName:
      user.companyName || "",
    organizerCategory:
      user.organizerCategory || "",
    profileImage:
      user.profileImage || "",
    bio: user.bio || "",
    website:
      user.website ||
      user.socialLinks?.website ||
      "",
    instagram:
      user.instagram ||
      user.socialLinks?.instagram ||
      "",
    facebook:
      user.facebook ||
      user.socialLinks?.facebook ||
      "",
    linkedin:
      user.linkedin ||
      user.socialLinks?.linkedin ||
      "",
    twitter:
      user.twitter ||
      user.socialLinks?.twitter ||
      "",
    country:
      user.address?.country || "",
    state: user.address?.state || "",
    city: user.address?.city || "",
    zipCode:
      user.address?.zipCode || "",
  };
};

const normalizeExternalLink = (
  value: string
) => {
  if (
    value.startsWith("http://") ||
    value.startsWith("https://")
  ) {
    return value;
  }

  return `https://${value}`;
};

const getEventTimestamp = (
  event: Event
) => {
  const timestamp = new Date(
    event.eventDate
  ).getTime();

  return Number.isNaN(timestamp)
    ? 0
    : timestamp;
};

export default function OrganizerProfilePage() {
  const dispatch = useAppDispatch();

  const authUser = useAppSelector(
    (state) => state.auth.user
  );

  const user =
    authUser as OrganizerUser | null;

  const [events, setEvents] = useState<
    Event[]
  >([]);

  const [
    eventsLoading,
    setEventsLoading,
  ] = useState(false);

  const [
    eventsError,
    setEventsError,
  ] = useState("");

  const [copied, setCopied] =
    useState(false);

  const [isEditing, setIsEditing] =
    useState(false);

  const [isSaving, setIsSaving] =
    useState(false);

  const [editForm, setEditForm] =
    useState<EditProfileForm>(
      emptyEditForm
    );

  useEffect(() => {
    const fetchOrganizerEvents =
      async () => {
        try {
          setEventsLoading(true);
          setEventsError("");

          const response =
            await getOrganizerEvents({
              limit:
                SUMMARY_PAGE_SIZE,
            });

          setEvents(
            response.data ||
              response.events ||
              []
          );
        } catch {
          setEventsError(
            "Unable to load organizer events."
          );

          setEvents([]);
        } finally {
          setEventsLoading(false);
        }
      };

    if (!user?._id && !user?.id) {
      return;
    }

    fetchOrganizerEvents();
  }, [user?._id, user?.id]);

  const {
    upcomingEvents,
    pastEvents,
  } = useMemo(() => {
    const today = new Date();

    today.setHours(0, 0, 0, 0);

    const todayTimestamp =
      today.getTime();

    const upcoming = events
      .filter(
        (event) =>
          getEventTimestamp(event) >=
          todayTimestamp
      )
      .sort(
        (
          firstEvent,
          secondEvent
        ) =>
          getEventTimestamp(
            firstEvent
          ) -
          getEventTimestamp(
            secondEvent
          )
      );

    const past = events
      .filter(
        (event) =>
          getEventTimestamp(event) <
          todayTimestamp
      )
      .sort(
        (
          firstEvent,
          secondEvent
        ) =>
          getEventTimestamp(
            secondEvent
          ) -
          getEventTimestamp(
            firstEvent
          )
      );

    return {
      upcomingEvents: upcoming,
      pastEvents: past,
    };
  }, [events]);

  const handleOpenEdit = () => {
    if (!user) {
      return;
    }

    setEditForm(
      getEditFormValues(user)
    );

    setIsEditing(true);
  };

  const handleCloseEdit = () => {
    if (isSaving) {
      return;
    }

    setIsEditing(false);
  };

  const handleFieldChange = (
    field: keyof EditProfileForm,
    value: string
  ) => {
    setEditForm((current) => ({
      ...current,
      [field]: value,
    }));
  };

  const handleSaveProfile = async (
    event: FormEvent<HTMLFormElement>
  ) => {
    event.preventDefault();

    const firstName =
      editForm.firstName.trim();

    if (!firstName) {
      toast.error(
        "First name is required."
      );

      return;
    }

    if (
      editForm.bio.trim().length >
      1000
    ) {
      toast.error(
        "Bio cannot exceed 1000 characters."
      );

      return;
    }

    try {
      setIsSaving(true);

      const response =
        await updateProfile({
          firstName,

          lastName:
            editForm.lastName.trim(),

          organizerName:
            editForm.organizerName.trim(),

          companyName:
            editForm.companyName.trim(),

          organizerCategory:
            editForm.organizerCategory.trim(),

          profileImage:
            editForm.profileImage.trim(),

          bio: editForm.bio.trim(),

          website:
            editForm.website.trim(),

          instagram:
            editForm.instagram.trim(),

          facebook:
            editForm.facebook.trim(),

          linkedin:
            editForm.linkedin.trim(),

          twitter:
            editForm.twitter.trim(),

          socialLinks: {
            website:
              editForm.website.trim(),

            instagram:
              editForm.instagram.trim(),

            facebook:
              editForm.facebook.trim(),

            linkedin:
              editForm.linkedin.trim(),

            twitter:
              editForm.twitter.trim(),
          },

          address: {
            country:
              editForm.country.trim(),

            state:
              editForm.state.trim(),

            city:
              editForm.city.trim(),

            zipCode:
              editForm.zipCode.trim(),
          },
        });

      if (
        !response.success ||
        !response.user
      ) {
        toast.error(
          response.message ||
            "Unable to update profile."
        );

        return;
      }

      dispatch(
        setUser(response.user)
      );

      toast.success(
        response.message ||
          "Profile updated successfully."
      );

      setIsEditing(false);
    } catch {
      toast.error(
        "Unable to update profile."
      );
    } finally {
      setIsSaving(false);
    }
  };

  if (!user) {
    return (
      <main className="flex min-h-[70vh] items-center justify-center bg-[#fffaf5] px-4">
        <div className="text-center">
          <div className="mx-auto h-11 w-11 animate-spin rounded-full border-4 border-orange-100 border-t-orange-500" />

          <p className="mt-4 text-sm font-medium text-slate-500">
            Loading organizer
            profile...
          </p>
        </div>
      </main>
    );
  }

  const fullName = getFullName(
    user.firstName,
    user.lastName
  );

  const organizerName =
    user.companyName ||
    user.organizerName ||
    fullName;

  const initials = getInitials(
    organizerName
  );

  const organizerCategory =
    user.organizerCategory ||
    user.favoriteCategories?.[0] ||
    "Event Organizer";

  const aboutOrganizer =
    user.bio ||
    "This organizer has not added an introduction yet.";

  const location =
    getLocation(user);

  const website =
    user.website ||
    user.socialLinks?.website ||
    "";

  const socialLinks = [
    {
      name: "Instagram",

      value:
        user.instagram ||
        user.socialLinks?.instagram ||
        "",

      icon: Camera,
    },

    {
      name: "Facebook",

      value:
        user.facebook ||
        user.socialLinks?.facebook ||
        "",

      icon: Users,
    },

    {
      name: "LinkedIn",

      value:
        user.linkedin ||
        user.socialLinks?.linkedin ||
        "",

      icon: Link2,
    },

    {
      name: "X",

      value:
        user.twitter ||
        user.socialLinks?.twitter ||
        "",

      icon: AtSign,
    },
  ].filter(
    (link) => Boolean(link.value)
  );

  const handleShareProfile =
    async () => {
      const profileUrl =
        window.location.href;

      const shareData = {
        title: `${organizerName} on EventZentro`,

        text: `View ${organizerName}'s organizer profile and events on EventZentro.`,

        url: profileUrl,
      };

      try {
        if (navigator.share) {
          await navigator.share(
            shareData
          );

          return;
        }

        await navigator.clipboard.writeText(
          profileUrl
        );

        setCopied(true);

        toast.success(
          "Profile link copied"
        );

        window.setTimeout(() => {
          setCopied(false);
        }, 2000);
      } catch (error) {
        if (
          error instanceof
            DOMException &&
          error.name === "AbortError"
        ) {
          return;
        }

        toast.error(
          "Unable to share profile"
        );
      }
    };

  return (
    <>
      <main className="min-h-screen bg-[#fffaf5] px-4 pb-16 pt-6 sm:px-6">
        <div className="mx-auto max-w-7xl">
          <section className="relative overflow-hidden rounded-[30px] border border-orange-100 bg-gradient-to-br from-orange-50 via-white to-rose-50 p-6 shadow-sm sm:p-8">
            <div className="absolute -left-24 -top-24 h-72 w-72 rounded-full bg-orange-200/40 blur-[110px]" />

            <div className="absolute -bottom-28 right-0 h-72 w-72 rounded-full bg-rose-200/40 blur-[110px]" />

            <div className="relative z-10 flex flex-col justify-between gap-6 lg:flex-row lg:items-start">
              <div className="flex flex-col gap-6 sm:flex-row sm:items-center">
                {user.profileImage ? (
                  <img
                    src={
                      user.profileImage
                    }
                    alt={`${organizerName} logo`}
                    className="h-32 w-32 shrink-0 rounded-[30px] border-4 border-white object-cover shadow-xl"
                  />
                ) : (
                  <div className="flex h-32 w-32 shrink-0 items-center justify-center rounded-[30px] border-4 border-white bg-gradient-to-br from-orange-500 via-red-500 to-pink-500 text-4xl font-black text-white shadow-xl shadow-orange-200">
                    {initials}
                  </div>
                )}

                <div className="min-w-0">
                  <p className="text-xs font-bold uppercase tracking-[0.2em] text-orange-600">
                    Organizer Profile
                  </p>

                  <div className="mt-3 flex flex-wrap items-center gap-3">
                    <h1 className="break-words text-3xl font-black tracking-tight text-slate-950 sm:text-4xl">
                      {organizerName}
                    </h1>

                    {user.isVerified && (
                      <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-100 px-3 py-1.5 text-xs font-bold text-emerald-700">
                        <BadgeCheck
                          size={15}
                        />

                        Verified
                      </span>
                    )}
                  </div>

                  <div className="mt-4 flex flex-wrap gap-2">
                    <span className="inline-flex items-center gap-2 rounded-full border border-orange-200 bg-white px-4 py-2 text-xs font-bold text-orange-600 shadow-sm">
                      <Building2
                        size={15}
                      />

                      {
                        organizerCategory
                      }
                    </span>

                    <span className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-4 py-2 text-xs font-bold text-slate-600 shadow-sm">
                      <MapPin size={15} />

                      {location}
                    </span>
                  </div>
                </div>
              </div>

              <div className="flex flex-wrap gap-3">
                <button
                  type="button"
                  onClick={
                    handleOpenEdit
                  }
                  className="inline-flex items-center justify-center gap-2 rounded-xl border-2 border-orange-200 bg-white px-5 py-3 text-sm font-bold text-orange-600 shadow-sm transition hover:-translate-y-0.5 hover:bg-orange-50 hover:shadow-lg"
                >
                  <Pencil size={17} />

                  Edit Profile
                </button>

                <button
                  type="button"
                  onClick={
                    handleShareProfile
                  }
                  className="inline-flex items-center justify-center gap-2 rounded-xl bg-slate-900 px-5 py-3 text-sm font-bold text-white shadow-sm transition hover:-translate-y-0.5 hover:bg-orange-600 hover:shadow-lg"
                >
                  {copied ? (
                    <Copy size={18} />
                  ) : (
                    <Share2
                      size={18}
                    />
                  )}

                  {copied
                    ? "Link Copied"
                    : "Share Profile"}
                </button>
              </div>
            </div>
          </section>

          <div className="mt-6 grid gap-6 lg:grid-cols-[1fr_340px]">
            <div className="space-y-6">
              <section className="rounded-[24px] border border-orange-100 bg-white p-6 shadow-sm">
                <div className="flex items-center gap-3">
                  <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-orange-100 text-orange-600">
                    <Building2
                      size={21}
                    />
                  </div>

                  <div>
                    <p className="text-xs font-bold uppercase tracking-[0.18em] text-orange-500">
                      Introduction
                    </p>

                    <h2 className="mt-1 text-xl font-black text-slate-900">
                      About Organizer
                    </h2>
                  </div>
                </div>

                <p className="mt-5 whitespace-pre-line text-sm leading-7 text-slate-600">
                  {aboutOrganizer}
                </p>
              </section>

              <EventSection
                title="Upcoming Events"
                description="Events scheduled and available for attendees."
                events={
                  upcomingEvents
                }
                loading={
                  eventsLoading
                }
                emptyMessage="No upcoming events are available."
                showAllHref="/organizer/events"
              />

              <EventSection
                title="Past Events"
                description="Previously organized events and experiences."
                events={pastEvents}
                loading={
                  eventsLoading
                }
                emptyMessage="No past events are available."
                showAllHref="/organizer/events"
              />

              {eventsError && (
                <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-semibold text-red-600">
                  {eventsError}
                </div>
              )}
            </div>

            <aside className="space-y-6">
              <section className="rounded-[24px] border border-orange-100 bg-white p-6 shadow-sm">
                <p className="text-xs font-bold uppercase tracking-[0.18em] text-orange-500">
                  Contact
                </p>

                <h2 className="mt-2 text-xl font-black text-slate-900">
                  Organizer Details
                </h2>

                <div className="mt-5 space-y-4">
                  <ProfileDetail
                    icon={Building2}
                    label="Organizer"
                    value={
                      organizerName
                    }
                  />

                  <ProfileDetail
                    icon={AtSign}
                    label="Email"
                    value={user.email}
                  />

                  <ProfileDetail
                    icon={MapPin}
                    label="Location"
                    value={location}
                  />

                  <ProfileDetail
                    icon={
                      CalendarDays
                    }
                    label="Upcoming events"
                    value={upcomingEvents.length.toString()}
                  />

                  <ProfileDetail
                    icon={Ticket}
                    label="Past events"
                    value={pastEvents.length.toString()}
                  />
                </div>
              </section>

              <section className="rounded-[24px] border border-orange-100 bg-white p-6 shadow-sm">
                <p className="text-xs font-bold uppercase tracking-[0.18em] text-orange-500">
                  Online
                </p>

                <h2 className="mt-2 text-xl font-black text-slate-900">
                  Website & Social
                  Links
                </h2>

                <div className="mt-5 space-y-3">
                  {website && (
                    <a
                      href={normalizeExternalLink(
                        website
                      )}
                      target="_blank"
                      rel="noreferrer"
                      className="flex items-center justify-between gap-3 rounded-xl border-2 border-slate-200 px-4 py-3 transition hover:border-orange-300 hover:bg-orange-50"
                    >
                      <span className="flex min-w-0 items-center gap-3">
                        <Globe2
                          size={19}
                          className="shrink-0 text-orange-600"
                        />

                        <span className="truncate text-sm font-bold text-slate-700">
                          Website
                        </span>
                      </span>

                      <ExternalLink
                        size={16}
                        className="shrink-0 text-slate-400"
                      />
                    </a>
                  )}

                  {socialLinks.map(
                    (social) => {
                      const Icon =
                        social.icon;

                      return (
                        <a
                          key={
                            social.name
                          }
                          href={normalizeExternalLink(
                            social.value
                          )}
                          target="_blank"
                          rel="noreferrer"
                          className="flex items-center justify-between gap-3 rounded-xl border-2 border-slate-200 px-4 py-3 transition hover:border-orange-300 hover:bg-orange-50"
                        >
                          <span className="flex min-w-0 items-center gap-3">
                            <Icon
                              size={19}
                              className="shrink-0 text-orange-600"
                            />

                            <span className="truncate text-sm font-bold text-slate-700">
                              {
                                social.name
                              }
                            </span>
                          </span>

                          <ExternalLink
                            size={16}
                            className="shrink-0 text-slate-400"
                          />
                        </a>
                      );
                    }
                  )}

                  {!website &&
                    socialLinks.length ===
                      0 && (
                      <div className="rounded-xl border-2 border-dashed border-slate-200 px-4 py-6 text-center">
                        <Globe2
                          size={25}
                          className="mx-auto text-slate-300"
                        />

                        <p className="mt-3 text-sm font-semibold text-slate-500">
                          No website or
                          social links
                          added.
                        </p>
                      </div>
                    )}
                </div>
              </section>

              <button
                type="button"
                onClick={
                  handleShareProfile
                }
                className="flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-orange-500 to-red-500 px-5 py-3.5 text-sm font-bold text-white shadow-sm transition hover:-translate-y-0.5 hover:shadow-lg"
              >
                <Share2 size={18} />

                Share Organizer
                Profile
              </button>
            </aside>
          </div>
        </div>
      </main>

      {isEditing && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-950/60 p-4 backdrop-blur-sm"
          onClick={
            handleCloseEdit
          }
        >
          <form
            onSubmit={
              handleSaveProfile
            }
            onClick={(event) =>
              event.stopPropagation()
            }
            className="max-h-[92vh] w-full max-w-2xl overflow-hidden rounded-[28px] bg-white shadow-2xl"
          >
            <div className="flex items-center justify-between border-b border-slate-200 px-6 py-5">
              <div>
                <p className="text-xs font-bold uppercase tracking-[0.18em] text-orange-500">
                  Profile
                </p>

                <h2 className="mt-1 text-2xl font-black text-slate-900">
                  Edit Profile
                </h2>
              </div>

              <button
                type="button"
                onClick={
                  handleCloseEdit
                }
                disabled={isSaving}
                className="flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200 text-slate-500 transition hover:bg-slate-100 disabled:opacity-50"
              >
                <X size={19} />
              </button>
            </div>

            <div className="max-h-[calc(92vh-150px)] space-y-5 overflow-y-auto px-6 py-6">
              <div className="grid gap-4 sm:grid-cols-2">
                <EditField
                  label="First name"
                  value={
                    editForm.firstName
                  }
                  required
                  onChange={(value) =>
                    handleFieldChange(
                      "firstName",
                      value
                    )
                  }
                />

                <EditField
                  label="Last name"
                  value={
                    editForm.lastName
                  }
                  onChange={(value) =>
                    handleFieldChange(
                      "lastName",
                      value
                    )
                  }
                />
              </div>

              <div>
                <h3 className="text-base font-black text-slate-900">
                  Organizer Details
                </h3>

                <div className="mt-4 grid gap-4 sm:grid-cols-2">
                  <EditField
                    label="Organizer name"
                    value={
                      editForm.organizerName
                    }
                    placeholder="Your public organizer name"
                    onChange={(value) =>
                      handleFieldChange(
                        "organizerName",
                        value
                      )
                    }
                  />

                  <EditField
                    label="Company name"
                    value={
                      editForm.companyName
                    }
                    placeholder="Company or brand"
                    onChange={(value) =>
                      handleFieldChange(
                        "companyName",
                        value
                      )
                    }
                  />

                  <EditField
                    label="Organizer category"
                    value={
                      editForm.organizerCategory
                    }
                    placeholder="Music, conferences, workshops"
                    onChange={(value) =>
                      handleFieldChange(
                        "organizerCategory",
                        value
                      )
                    }
                  />
                </div>
              </div>

              <EditField
                label="Profile image URL"
                value={
                  editForm.profileImage
                }
                placeholder="https://example.com/profile.jpg"
                onChange={(value) =>
                  handleFieldChange(
                    "profileImage",
                    value
                  )
                }
              />

              <label className="block">
                <span className="text-sm font-bold text-slate-700">
                  Bio
                </span>

                <textarea
                  value={editForm.bio}
                  rows={5}
                  maxLength={1000}
                  placeholder="Tell people about yourself and your events."
                  onChange={(event) =>
                    handleFieldChange(
                      "bio",
                      event.target.value
                    )
                  }
                  className="mt-2 w-full resize-none rounded-xl border-2 border-slate-200 px-4 py-3 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-orange-400 focus:ring-4 focus:ring-orange-100"
                />

                <p className="mt-1 text-right text-xs text-slate-400">
                  {
                    editForm.bio
                      .length
                  }
                  /1000
                </p>
              </label>

              <div>
                <h3 className="text-base font-black text-slate-900">
                  Website & Social Links
                </h3>

                <div className="mt-4 grid gap-4 sm:grid-cols-2">
                  <EditField
                    label="Website"
                    value={
                      editForm.website
                    }
                    placeholder="https://yourwebsite.com"
                    onChange={(value) =>
                      handleFieldChange(
                        "website",
                        value
                      )
                    }
                  />

                  <EditField
                    label="Instagram"
                    value={
                      editForm.instagram
                    }
                    placeholder="https://instagram.com/username"
                    onChange={(value) =>
                      handleFieldChange(
                        "instagram",
                        value
                      )
                    }
                  />

                  <EditField
                    label="Facebook"
                    value={
                      editForm.facebook
                    }
                    placeholder="https://facebook.com/page"
                    onChange={(value) =>
                      handleFieldChange(
                        "facebook",
                        value
                      )
                    }
                  />

                  <EditField
                    label="LinkedIn"
                    value={
                      editForm.linkedin
                    }
                    placeholder="https://linkedin.com/company/name"
                    onChange={(value) =>
                      handleFieldChange(
                        "linkedin",
                        value
                      )
                    }
                  />

                  <EditField
                    label="X"
                    value={
                      editForm.twitter
                    }
                    placeholder="https://x.com/username"
                    onChange={(value) =>
                      handleFieldChange(
                        "twitter",
                        value
                      )
                    }
                  />
                </div>
              </div>

              <div>
                <h3 className="text-base font-black text-slate-900">
                  Location
                </h3>

                <div className="mt-4 grid gap-4 sm:grid-cols-2">
                  <EditField
                    label="City"
                    value={
                      editForm.city
                    }
                    placeholder="Kochi"
                    onChange={(value) =>
                      handleFieldChange(
                        "city",
                        value
                      )
                    }
                  />

                  <EditField
                    label="State"
                    value={
                      editForm.state
                    }
                    placeholder="Kerala"
                    onChange={(value) =>
                      handleFieldChange(
                        "state",
                        value
                      )
                    }
                  />

                  <EditField
                    label="Country"
                    value={
                      editForm.country
                    }
                    placeholder="India"
                    onChange={(value) =>
                      handleFieldChange(
                        "country",
                        value
                      )
                    }
                  />

                  <EditField
                    label="ZIP code"
                    value={
                      editForm.zipCode
                    }
                    placeholder="682001"
                    onChange={(value) =>
                      handleFieldChange(
                        "zipCode",
                        value
                      )
                    }
                  />
                </div>
              </div>
            </div>

            <div className="flex flex-col-reverse gap-3 border-t border-slate-200 bg-slate-50 px-6 py-4 sm:flex-row sm:justify-end">
              <button
                type="button"
                onClick={
                  handleCloseEdit
                }
                disabled={isSaving}
                className="inline-flex items-center justify-center rounded-xl border-2 border-slate-200 bg-white px-5 py-3 text-sm font-bold text-slate-700 transition hover:bg-slate-100 disabled:opacity-50"
              >
                Cancel
              </button>

              <button
                type="submit"
                disabled={isSaving}
                className="inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-orange-500 to-red-500 px-6 py-3 text-sm font-bold text-white transition hover:shadow-lg disabled:cursor-not-allowed disabled:opacity-60"
              >
                {isSaving ? (
                  <Loader2
                    size={18}
                    className="animate-spin"
                  />
                ) : (
                  <Save size={18} />
                )}

                {isSaving
                  ? "Saving..."
                  : "Save Changes"}
              </button>
            </div>
          </form>
        </div>
      )}
    </>
  );
}

interface EditFieldProps {
  label: string;
  value: string;
  placeholder?: string;
  required?: boolean;
  onChange: (
    value: string
  ) => void;
}

function EditField({
  label,
  value,
  placeholder,
  required,
  onChange,
}: EditFieldProps) {
  return (
    <label className="block">
      <span className="text-sm font-bold text-slate-700">
        {label}

        {required && (
          <span className="ml-1 text-red-500">
            *
          </span>
        )}
      </span>

      <input
        type="text"
        value={value}
        required={required}
        placeholder={placeholder}
        onChange={(event) =>
          onChange(
            event.target.value
          )
        }
        className="mt-2 h-12 w-full rounded-xl border-2 border-slate-200 px-4 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-orange-400 focus:ring-4 focus:ring-orange-100"
      />
    </label>
  );
}

interface ProfileDetailProps {
  icon: typeof Building2;
  label: string;
  value: string;
}

function ProfileDetail({
  icon: Icon,
  label,
  value,
}: ProfileDetailProps) {
  return (
    <div className="flex items-start gap-3">
      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-orange-100 text-orange-600">
        <Icon size={18} />
      </div>

      <div className="min-w-0">
        <p className="text-xs font-semibold text-slate-500">
          {label}
        </p>

        <p className="mt-1 break-words text-sm font-bold text-slate-900">
          {value}
        </p>
      </div>
    </div>
  );
}

interface EventSectionProps {
  title: string;
  description: string;
  events: Event[];
  loading: boolean;
  emptyMessage: string;
  showAllHref: string;
}

function EventSection({
  title,
  description,
  events,
  loading,
  emptyMessage,
  showAllHref,
}: EventSectionProps) {
  return (
    <section className="rounded-[24px] border border-orange-100 bg-white p-5 shadow-sm sm:p-6">
      <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
        <div>
          <h2 className="text-xl font-black text-slate-900">
            {title}
          </h2>

          <p className="mt-1 text-sm text-slate-500">
            {description}
          </p>
        </div>

        <Link
          href={showAllHref}
          className="inline-flex w-fit items-center gap-2 text-sm font-bold text-orange-600 transition hover:text-red-600"
        >
          View all

          <ArrowRight size={16} />
        </Link>
      </div>

      {loading ? (
        <div className="flex min-h-52 items-center justify-center">
          <div className="text-center">
            <div className="mx-auto h-9 w-9 animate-spin rounded-full border-4 border-orange-100 border-t-orange-500" />

            <p className="mt-3 text-sm font-medium text-slate-500">
              Loading events...
            </p>
          </div>
        </div>
      ) : events.length === 0 ? (
        <div className="mt-5 rounded-2xl border-2 border-dashed border-orange-100 bg-orange-50/40 px-6 py-10 text-center">
          <CalendarDays
            size={30}
            className="mx-auto text-orange-300"
          />

          <p className="mt-3 text-sm font-semibold text-slate-500">
            {emptyMessage}
          </p>
        </div>
      ) : (
        <div className="mt-5 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {events
            .slice(0, 3)
            .map((event) => (
              <OrganizerEventCard
                key={event._id}
                event={event}
              />
            ))}
        </div>
      )}
    </section>
  );
}

interface OrganizerEventCardProps {
  event: Event;
}

function OrganizerEventCard({
  event,
}: OrganizerEventCardProps) {
  return (
    <Link
      href={`/events/${event._id}`}
      className="group overflow-hidden rounded-2xl border border-slate-200 bg-white transition duration-300 hover:-translate-y-1 hover:border-orange-200 hover:shadow-lg"
    >
      <div className="relative h-36 overflow-hidden bg-gradient-to-br from-orange-400 to-red-500">
        {event.bannerImage ? (
          <img
            src={event.bannerImage}
            alt={event.title}
            className="h-full w-full object-cover transition duration-500 group-hover:scale-110"
          />
        ) : (
          <div className="flex h-full items-center justify-center">
            <CalendarDays
              size={35}
              className="text-white/80"
            />
          </div>
        )}

        <span className="absolute left-3 top-3 rounded-full bg-white/95 px-3 py-1 text-xs font-bold text-orange-600 shadow-sm">
          {event.category}
        </span>
      </div>

      <div className="p-4">
        <h3 className="line-clamp-2 font-black text-slate-900 transition group-hover:text-orange-600">
          {event.title}
        </h3>

        <div className="mt-3 space-y-2 text-xs font-medium text-slate-500">
          <p className="flex items-center gap-2">
            <CalendarDays
              size={15}
              className="shrink-0 text-orange-500"
            />

            {formatEventDate(
              event.eventDate
            )}
          </p>

          <p className="flex items-center gap-2">
            <MapPin
              size={15}
              className="shrink-0 text-orange-500"
            />

            <span className="truncate">
              {event.venue}
            </span>
          </p>
        </div>

        <div className="mt-4 flex items-center justify-between border-t border-slate-100 pt-3">
          <span className="text-sm font-black text-slate-900">
            {event.ticketPrice ===
            0
              ? "Free"
              : formatCurrency(
                  event.ticketPrice
                )}
          </span>

          <span className="inline-flex items-center gap-1 text-xs font-bold text-orange-600">
            View

            <ArrowRight size={14} />
          </span>
        </div>
      </div>
    </Link>
  );
}
