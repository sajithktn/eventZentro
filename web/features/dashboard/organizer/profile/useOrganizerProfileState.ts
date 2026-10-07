"use client";

import type { FormEvent } from "react";
import { useEffect, useMemo, useState } from "react";
import { AtSign, Camera, Link2, Users } from "lucide-react";
import { toast } from "sonner";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import { setUser } from "@/store/features/auth/authSlice";
import { updateProfile } from "@/services/auth.service";
import { getOrganizerEvents } from "@/services/event.service";
import type { Event } from "@/types/event";
import { SUMMARY_PAGE_SIZE } from "@/utils/pagination";
import { emptyEditForm } from "./constants";
import { EditProfileForm, OrganizerUser } from "./types";
import { getEditFormValues, getEventTimestamp, getFullName, getInitials, getLocation } from "./utils";

export function useOrganizerProfileState() {
  const dispatch = useAppDispatch();

  const authUser = useAppSelector((state) => state.auth.user);

  const user = authUser as OrganizerUser | null;

  const [events, setEvents] = useState<Event[]>([]);

  const [eventsLoading, setEventsLoading,] = useState(false);

  const [eventsError, setEventsError,] = useState("");

  const [copied, setCopied] = useState(false);

  const [isEditing, setIsEditing] = useState(false);

  const [isSaving, setIsSaving] = useState(false);

  const [editForm, setEditForm] = useState<EditProfileForm>(emptyEditForm);

  useEffect(() => {
      const fetchOrganizerEvents = async () => {
          try {
              setEventsLoading(true);
              setEventsError("");
              const response = await getOrganizerEvents({
                  limit: SUMMARY_PAGE_SIZE,
              });
              setEvents(response.data ||
                  response.events ||
                  []);
          }
          catch {
              setEventsError("Unable to load organizer events.");
              setEvents([]);
          }
          finally {
              setEventsLoading(false);
          }
      };
      if (!user?._id && !user?.id) {
          return;
      }
      fetchOrganizerEvents();
  }, [user?._id, user?.id]);

  const { upcomingEvents, pastEvents, } = useMemo(() => {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const todayTimestamp = today.getTime();
      const upcoming = events
          .filter((event) => getEventTimestamp(event) >=
          todayTimestamp)
          .sort((firstEvent, secondEvent) => getEventTimestamp(firstEvent) -
          getEventTimestamp(secondEvent));
      const past = events
          .filter((event) => getEventTimestamp(event) <
          todayTimestamp)
          .sort((firstEvent, secondEvent) => getEventTimestamp(secondEvent) -
          getEventTimestamp(firstEvent));
      return {
          upcomingEvents: upcoming,
          pastEvents: past,
      };
  }, [events]);

  const handleOpenEdit = () => {
      if (!user) {
          return;
      }
      setEditForm(getEditFormValues(user));
      setIsEditing(true);
  };

  const handleCloseEdit = () => {
      if (isSaving) {
          return;
      }
      setIsEditing(false);
  };

  const handleFieldChange = (field: keyof EditProfileForm, value: string) => {
      setEditForm((current) => ({
          ...current,
          [field]: value,
      }));
  };

  const handleSaveProfile = async (event: FormEvent<HTMLFormElement>) => {
      event.preventDefault();
      const firstName = editForm.firstName.trim();
      if (!firstName) {
          toast.error("First name is required.");
          return;
      }
      if (editForm.bio.trim().length >
          1000) {
          toast.error("Bio cannot exceed 1000 characters.");
          return;
      }
      try {
          setIsSaving(true);
          const response = await updateProfile({
              firstName,
              lastName: editForm.lastName.trim(),
              organizerName: editForm.organizerName.trim(),
              companyName: editForm.companyName.trim(),
              organizerCategory: editForm.organizerCategory.trim(),
              profileImage: editForm.profileImage.trim(),
              bio: editForm.bio.trim(),
              website: editForm.website.trim(),
              instagram: editForm.instagram.trim(),
              facebook: editForm.facebook.trim(),
              linkedin: editForm.linkedin.trim(),
              twitter: editForm.twitter.trim(),
              socialLinks: {
                  website: editForm.website.trim(),
                  instagram: editForm.instagram.trim(),
                  facebook: editForm.facebook.trim(),
                  linkedin: editForm.linkedin.trim(),
                  twitter: editForm.twitter.trim(),
              },
              address: {
                  country: editForm.country.trim(),
                  state: editForm.state.trim(),
                  city: editForm.city.trim(),
                  zipCode: editForm.zipCode.trim(),
              },
          });
          if (!response.success ||
              !response.user) {
              toast.error(response.message ||
                  "Unable to update profile.");
              return;
          }
          dispatch(setUser(response.user));
          toast.success(response.message ||
              "Profile updated successfully.");
          setIsEditing(false);
      }
      catch {
          toast.error("Unable to update profile.");
      }
      finally {
          setIsSaving(false);
      }
  };

  if (!user) {
      return {
          aboutOrganizer: "",
          copied,
          editForm,
          eventsError,
          eventsLoading,
          handleCloseEdit,
          handleFieldChange,
          handleOpenEdit,
          handleSaveProfile,
          handleShareProfile: async () => { },
          initials: "",
          isEditing,
          isSaving,
          location: "",
          organizerCategory: "",
          organizerName: "",
          pastEvents,
          socialLinks: [],
          upcomingEvents,
          user,
          website: "",
      };
  }

  const fullName = getFullName(user.firstName, user.lastName);

  const organizerName = user.companyName ||
      user.organizerName ||
      fullName;

  const initials = getInitials(organizerName);

  const organizerCategory = user.organizerCategory ||
      user.favoriteCategories?.[0] ||
      "Event Organizer";

  const aboutOrganizer = user.bio ||
      "This organizer has not added an introduction yet.";

  const location = getLocation(user);

  const website = user.website ||
      user.socialLinks?.website ||
      "";

  const socialLinks = [
      {
          name: "Instagram",
          value: user.instagram ||
              user.socialLinks?.instagram ||
              "",
          icon: Camera,
      },
      {
          name: "Facebook",
          value: user.facebook ||
              user.socialLinks?.facebook ||
              "",
          icon: Users,
      },
      {
          name: "LinkedIn",
          value: user.linkedin ||
              user.socialLinks?.linkedin ||
              "",
          icon: Link2,
      },
      {
          name: "X",
          value: user.twitter ||
              user.socialLinks?.twitter ||
              "",
          icon: AtSign,
      },
  ].filter((link) => Boolean(link.value));

  const handleShareProfile = async () => {
      const profileUrl = window.location.href;
      const shareData = {
          title: `${organizerName} on EventZentro`,
          text: `View ${organizerName}'s organizer profile and events on EventZentro.`,
          url: profileUrl,
      };
      try {
          if (navigator.share) {
              await navigator.share(shareData);
              return;
          }
          await navigator.clipboard.writeText(profileUrl);
          setCopied(true);
          toast.success("Profile link copied");
          window.setTimeout(() => {
              setCopied(false);
          }, 2000);
      }
      catch (error) {
          if (error instanceof
              DOMException &&
              error.name === "AbortError") {
              return;
          }
          toast.error("Unable to share profile");
      }
  };

  return {
    aboutOrganizer,
    copied,
    editForm,
    eventsError,
    eventsLoading,
    handleCloseEdit,
    handleFieldChange,
    handleOpenEdit,
    handleSaveProfile,
    handleShareProfile,
    initials,
    isEditing,
    isSaving,
    location,
    organizerCategory,
    organizerName,
    pastEvents,
    socialLinks,
    upcomingEvents,
    user,
    website,
  };
}

export type OrganizerProfileState = ReturnType<typeof useOrganizerProfileState>;
