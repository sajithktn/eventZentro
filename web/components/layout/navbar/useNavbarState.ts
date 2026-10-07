"use client";

import { usePathname, useRouter } from "next/navigation";
import { FormEvent, useEffect, useMemo, useRef, useState } from "react";
import { toast } from "sonner";
import { popularCities } from "@/data/indianCities";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import { logout, setAuthChecked, setUser } from "@/store/features/auth/authSlice";
import { getCurrentUser, logoutUser } from "@/services/auth.service";
import { getEventLocations } from "@/services/event.service";
import { reverseGeocodeCoordinates } from "@/services/location.service";
import { geolocationOptions, locationChangeEvent, locationStorageKey, visibleOtherCityCount } from "./constants";
import { dedupeCities, getCityKey } from "./utils";

export function useNavbarState() {
  const pathname = usePathname();

  const router = useRouter();

  const dispatch = useAppDispatch();

  const profileRef = useRef<HTMLDivElement>(null);

  const { user, isAuthChecked } = useAppSelector((state) => state.auth);

  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const [isProfileOpen, setIsProfileOpen] = useState(false);

  const [isLocationOpen, setIsLocationOpen] = useState(false);

  const [isLocationsLoading, setIsLocationsLoading] = useState(false);

  const [isDetectingLocation, setIsDetectingLocation,] = useState(false);

  const [searchText, setSearchText] = useState("");

  const [locationSearch, setLocationSearch] = useState("");

  const [locations, setLocations] = useState<string[]>([]);

  const [selectedLocation, setSelectedLocation] = useState("All locations");

  const [showAllCities, setShowAllCities] = useState(false);

  const displayName = [user?.firstName, user?.lastName]
      .filter(Boolean)
      .join(" ") ||
      user?.email ||
      "Account";

  const initials = `${user?.firstName?.[0] ?? ""}${user?.lastName?.[0] ?? ""}`
      .trim()
      .toUpperCase() ||
      user?.email?.[0]?.toUpperCase() ||
      "U";

  const isOrganizer = user?.role === "organizer" ||
      user?.role === "admin";

  const dashboardHref = user?.role === "admin"
      ? "/admin/dashboard"
      : user?.role === "organizer"
          ? "/organizer/dashboard"
          : "/user/dashboard";

  const profileHref = isOrganizer
      ? "/organizer/profile"
      : "/user/profile";

  const eventCityOptions = useMemo(() => dedupeCities(locations), [locations]);

  const popularCityKeys = useMemo(() => new Set(popularCities.map((city) => getCityKey(city.name))), []);

  const otherCityOptions = useMemo(() => eventCityOptions.filter((city) => !popularCityKeys.has(getCityKey(city))), [eventCityOptions, popularCityKeys]);

  const combinedCityOptions = useMemo(() => dedupeCities([
      ...popularCities.map((city) => city.name),
      ...eventCityOptions,
  ]), [eventCityOptions]);

  const normalizedLocationSearch = locationSearch
      .trim()
      .toLowerCase();

  const isSearchingLocations = normalizedLocationSearch.length > 0;

  const searchedCities = useMemo(() => {
      if (!normalizedLocationSearch) {
          return [];
      }
      return combinedCityOptions.filter((city) => getCityKey(city).includes(normalizedLocationSearch));
  }, [combinedCityOptions, normalizedLocationSearch]);

  const visibleOtherCities = showAllCities
      ? otherCityOptions
      : otherCityOptions.slice(0, visibleOtherCityCount);

  const hasHiddenOtherCities = otherCityOptions.length > visibleOtherCityCount;

  const isSelectedCity = (city: string) => getCityKey(selectedLocation) === getCityKey(city);

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
      let isMounted = true;
      const fetchLocations = async () => {
          try {
              setIsLocationsLoading(true);
              const response = await getEventLocations();
              if (isMounted) {
                  setLocations(response.locations || []);
              }
          }
          catch {
              if (isMounted) {
                  setLocations([]);
              }
          }
          finally {
              if (isMounted) {
                  setIsLocationsLoading(false);
              }
          }
      };
      fetchLocations();
      return () => {
          isMounted = false;
      };
  }, []);

  useEffect(() => {
      const savedLocation = window.localStorage.getItem(locationStorageKey);
      if (savedLocation) {
          setSelectedLocation(savedLocation);
      }

      const handleLocationChange = (event: globalThis.Event) => {
          const customEvent = event as CustomEvent<string>;
          setSelectedLocation(customEvent.detail || "All locations");
      };
      window.addEventListener(locationChangeEvent, handleLocationChange);
      return () => {
          window.removeEventListener(locationChangeEvent, handleLocationChange);
      };
  }, []);

  useEffect(() => {
      const timeoutId = window.setTimeout(() => {
          setIsMenuOpen(false);
          setIsProfileOpen(false);
          setIsLocationOpen(false);
      }, 0);

      return () => {
          window.clearTimeout(timeoutId);
      };
  }, [pathname]);

  useEffect(() => {
      const handleOutsideClick = (event: MouseEvent) => {
          if (profileRef.current &&
              !profileRef.current.contains(event.target as Node)) {
              setIsProfileOpen(false);
          }
      };
      document.addEventListener("mousedown", handleOutsideClick);
      return () => {
          document.removeEventListener("mousedown", handleOutsideClick);
      };
  }, []);

  useEffect(() => {
      if (!isLocationOpen) {
          return;
      }
      const handleEscape = (event: KeyboardEvent) => {
          if (event.key === "Escape") {
              setIsLocationOpen(false);
              setShowAllCities(false);
          }
      };
      document.body.style.overflow = "hidden";
      document.addEventListener("keydown", handleEscape);
      return () => {
          document.body.style.overflow = "";
          document.removeEventListener("keydown", handleEscape);
      };
  }, [isLocationOpen]);

  const handleSearch = (event: FormEvent<HTMLFormElement>) => {
      event.preventDefault();
      const params = new URLSearchParams();
      if (searchText.trim()) {
          params.set("search", searchText.trim());
      }
      if (selectedLocation !== "All locations") {
          params.set("location", selectedLocation);
      }
      const query = params.toString();
      router.push(query ? `/events?${query}` : "/events");
  };

  const closeLocationModal = () => {
      setIsLocationOpen(false);
      setShowAllCities(false);
  };

  const openLocationModal = () => {
      setShowAllCities(false);
      setIsLocationOpen(true);
  };

  const handleLocationSelect = (location: string) => {
      const nextLocation = location || "All locations";
      setSelectedLocation(nextLocation);
      setLocationSearch("");
      setIsLocationOpen(false);
      setIsMenuOpen(false);
      setShowAllCities(false);
      if (location) {
          window.localStorage.setItem(locationStorageKey, location);
      }
      else {
          window.localStorage.removeItem(locationStorageKey);
      }
      window.dispatchEvent(new CustomEvent(locationChangeEvent, {
          detail: location,
      }));
      if (pathname === "/events") {
          const params = new URLSearchParams(window.location.search);
          if (location) {
              params.set("location", location);
          }
          else {
              params.delete("location");
          }
          params.delete("page");
          const query = params.toString();
          router.replace(query
              ? `/events?${query}`
              : "/events", {
              scroll: false,
          });
      }
  };

  const handleDetectLocation = () => {
      if (!("geolocation" in navigator)) {
          toast.error("Your browser does not support location detection.");
          return;
      }
      setIsDetectingLocation(true);
      navigator.geolocation.getCurrentPosition(async (position) => {
          const latitude = position.coords.latitude;
          const longitude = position.coords.longitude;
          try {
              const detectedLocation = await reverseGeocodeCoordinates({
                  latitude,
                  longitude,
              });
              handleLocationSelect(detectedLocation.city);
              toast.success(`Location detected: ${detectedLocation.city}`);
          }
          catch (error: unknown) {
              if (process.env.NODE_ENV === "development") {
                  console.error("Reverse geocoding failed:", error);
              }
              const message = error instanceof Error &&
                  error.message ===
                      "Invalid location coordinates received."
                  ? error.message
                  : "Unable to identify your city. Please select it manually.";
              toast.error(message);
          }
          finally {
              setIsDetectingLocation(false);
          }
      }, (error) => {
          setIsDetectingLocation(false);
          switch (error.code) {
              case error.PERMISSION_DENIED:
                  toast.error("Location permission was denied. Please select your city manually.");
                  break;
              case error.POSITION_UNAVAILABLE:
                  toast.error("Your current location is unavailable.");
                  break;
              case error.TIMEOUT:
                  toast.error("Location detection timed out. Please try again.");
                  break;
              default:
                  toast.error("Unable to detect your location.");
          }
      }, geolocationOptions);
  };

  const handleCreateEventClick = () => {
      if (!isAuthChecked) {
          return;
      }
      setIsMenuOpen(false);
      if (!user) {
          router.push("/login?redirect=/organizer/events/create");
          return;
      }
      if (user.role === "user") {
          router.push("/organizer/apply");
          return;
      }
      if (user.role === "organizer" ||
          user.role === "admin") {
          router.push("/organizer/events/create");
      }
  };

  const handleLogout = async () => {
      try {
          await logoutUser();
      }
      catch (error) {
          console.error("Logout failed:", error);
      }
      finally {
          dispatch(logout());
          setIsProfileOpen(false);
          setIsMenuOpen(false);
          router.push("/login");
          router.refresh();
      }
  };

  return {
    closeLocationModal,
    dashboardHref,
    displayName,
    handleCreateEventClick,
    handleDetectLocation,
    handleLocationSelect,
    handleLogout,
    handleSearch,
    hasHiddenOtherCities,
    initials,
    isAuthChecked,
    isDetectingLocation,
    isLocationOpen,
    isLocationsLoading,
    isMenuOpen,
    isOrganizer,
    isProfileOpen,
    isSearchingLocations,
    isSelectedCity,
    locationSearch,
    openLocationModal,
    otherCityOptions,
    profileHref,
    profileRef,
    searchedCities,
    searchText,
    selectedLocation,
    setIsMenuOpen,
    setIsProfileOpen,
    setLocationSearch,
    setSearchText,
    setShowAllCities,
    showAllCities,
    user,
    visibleOtherCities,
  };
}

export type NavbarState = ReturnType<typeof useNavbarState>;
