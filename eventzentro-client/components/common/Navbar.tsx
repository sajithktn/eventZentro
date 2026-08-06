"use client";

import Link from "next/link";
import {
  usePathname,
  useRouter,
} from "next/navigation";
import {
  CalendarDays,
  Check,
  ChevronDown,
  HelpCircle,
  Home,
  LayoutDashboard,
  LoaderCircle,
  LocateFixed,
  LogOut,
  MapPin,
  Menu,
  Plus,
  Search,
  Ticket,
  UserRound,
  X,
} from "lucide-react";
import {
  FormEvent,
  ReactNode,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { toast } from "sonner";

import { popularCities } from "@/data/indianCities";
import { useAppDispatch, useAppSelector } from "@/redux/hooks";
import {
  logout,
  setAuthChecked,
  setUser,
} from "@/redux/features/auth/authSlice";
import {
  getCurrentUser,
  logoutUser,
} from "@/services/auth.service";
import { getEventLocations } from "@/services/event.service";
import {
  reverseGeocodeCoordinates,
} from "@/services/location.service";

const locationStorageKey =
  "eventzentro-selected-location";

const locationChangeEvent =
  "eventzentro-location-change";

const geolocationOptions: PositionOptions = {
  enableHighAccuracy: true,
  timeout: 10000,
  maximumAge: 0,
};

const visibleOtherCityCount = 15;

const getCityKey = (city: string) =>
  city.trim().toLowerCase();

const sortCities = (cities: string[]) =>
  [...cities].sort((firstCity, secondCity) =>
    firstCity.localeCompare(secondCity)
  );

const dedupeCities = (cities: string[]) => {
  const cityMap = new Map<string, string>();

  cities.forEach((city) => {
    const trimmedCity = city.trim();
    const cityKey = getCityKey(trimmedCity);

    if (!trimmedCity || cityMap.has(cityKey)) {
      return;
    }

    cityMap.set(cityKey, trimmedCity);
  });

  return sortCities([...cityMap.values()]);
};

export default function Navbar() {
  const pathname = usePathname();
  const router = useRouter();
  const dispatch = useAppDispatch();
  const profileRef = useRef<HTMLDivElement>(null);

  const { user, isAuthChecked } = useAppSelector(
    (state) => state.auth
  );

  const [isMenuOpen, setIsMenuOpen] =
    useState(false);

  const [isProfileOpen, setIsProfileOpen] =
    useState(false);

  const [isLocationOpen, setIsLocationOpen] =
    useState(false);

  const [isLocationsLoading, setIsLocationsLoading] =
    useState(false);

  const [
    isDetectingLocation,
    setIsDetectingLocation,
  ] = useState(false);

  const [searchText, setSearchText] = useState("");

  const [locationSearch, setLocationSearch] =
    useState("");

  const [locations, setLocations] = useState<
    string[]
  >([]);

  const [selectedLocation, setSelectedLocation] =
    useState("All locations");

  const [showAllCities, setShowAllCities] =
    useState(false);

  const displayName =
    [user?.firstName, user?.lastName]
      .filter(Boolean)
      .join(" ") ||
    user?.email ||
    "Account";

  const initials =
    `${user?.firstName?.[0] ?? ""}${
      user?.lastName?.[0] ?? ""
    }`
      .trim()
      .toUpperCase() ||
    user?.email?.[0]?.toUpperCase() ||
    "U";

  const isOrganizer =
    user?.role === "organizer" ||
    user?.role === "admin";

  const dashboardHref =
    user?.role === "admin"
      ? "/admin/dashboard"
      : user?.role === "organizer"
        ? "/organizer/dashboard"
        : "/user/dashboard";

  const profileHref = isOrganizer
    ? "/organizer/profile"
    : "/user/profile";

  const eventCityOptions = useMemo(
    () => dedupeCities(locations),
    [locations]
  );

  const popularCityKeys = useMemo(
    () =>
      new Set(
        popularCities.map((city) =>
          getCityKey(city.name)
        )
      ),
    []
  );

  const otherCityOptions = useMemo(
    () =>
      eventCityOptions.filter(
        (city) => !popularCityKeys.has(getCityKey(city))
      ),
    [eventCityOptions, popularCityKeys]
  );

  const combinedCityOptions = useMemo(
    () =>
      dedupeCities([
        ...popularCities.map((city) => city.name),
        ...eventCityOptions,
      ]),
    [eventCityOptions]
  );

  const normalizedLocationSearch = locationSearch
    .trim()
    .toLowerCase();

  const isSearchingLocations =
    normalizedLocationSearch.length > 0;

  const searchedCities = useMemo(() => {
    if (!normalizedLocationSearch) {
      return [];
    }

    return combinedCityOptions.filter((city) =>
      getCityKey(city).includes(normalizedLocationSearch)
    );
  }, [combinedCityOptions, normalizedLocationSearch]);

  const visibleOtherCities = showAllCities
    ? otherCityOptions
    : otherCityOptions.slice(0, visibleOtherCityCount);

  const hasHiddenOtherCities =
    otherCityOptions.length > visibleOtherCityCount;

  const isSelectedCity = (city: string) =>
    getCityKey(selectedLocation) === getCityKey(city);

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
    const savedLocation =
      window.localStorage.getItem(
        locationStorageKey
      );

    if (savedLocation) {
      setSelectedLocation(savedLocation);
    }

    let isMounted = true;

    const fetchLocations = async () => {
      try {
        setIsLocationsLoading(true);

        const response =
          await getEventLocations();

        if (isMounted) {
          setLocations(response.locations || []);
        }
      } catch {
        if (isMounted) {
          setLocations([]);
        }
      } finally {
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
    const handleLocationChange = (
      event: globalThis.Event
    ) => {
      const customEvent =
        event as CustomEvent<string>;

      setSelectedLocation(
        customEvent.detail || "All locations"
      );
    };

    window.addEventListener(
      locationChangeEvent,
      handleLocationChange
    );

    return () => {
      window.removeEventListener(
        locationChangeEvent,
        handleLocationChange
      );
    };
  }, []);

  useEffect(() => {
    setIsMenuOpen(false);
    setIsProfileOpen(false);
    setIsLocationOpen(false);
  }, [pathname]);

  useEffect(() => {
    const handleOutsideClick = (
      event: MouseEvent
    ) => {
      if (
        profileRef.current &&
        !profileRef.current.contains(
          event.target as Node
        )
      ) {
        setIsProfileOpen(false);
      }
    };

    document.addEventListener(
      "mousedown",
      handleOutsideClick
    );

    return () => {
      document.removeEventListener(
        "mousedown",
        handleOutsideClick
      );
    };
  }, []);

  useEffect(() => {
    if (!isLocationOpen) {
      return;
    }

    const handleEscape = (
      event: KeyboardEvent
    ) => {
      if (event.key === "Escape") {
        setIsLocationOpen(false);
        setShowAllCities(false);
      }
    };

    document.body.style.overflow = "hidden";

    document.addEventListener(
      "keydown",
      handleEscape
    );

    return () => {
      document.body.style.overflow = "";

      document.removeEventListener(
        "keydown",
        handleEscape
      );
    };
  }, [isLocationOpen]);

  const handleSearch = (
    event: FormEvent<HTMLFormElement>
  ) => {
    event.preventDefault();

    const params = new URLSearchParams();

    if (searchText.trim()) {
      params.set("search", searchText.trim());
    }

    if (
      selectedLocation !== "All locations"
    ) {
      params.set(
        "location",
        selectedLocation
      );
    }

    const query = params.toString();

    router.push(
      query ? `/events?${query}` : "/events"
    );
  };

  const closeLocationModal = () => {
    setIsLocationOpen(false);
    setShowAllCities(false);
  };

  const openLocationModal = () => {
    setShowAllCities(false);
    setIsLocationOpen(true);
  };

  const handleLocationSelect = (
    location: string
  ) => {
    const nextLocation =
      location || "All locations";

    setSelectedLocation(nextLocation);
    setLocationSearch("");
    setIsLocationOpen(false);
    setIsMenuOpen(false);
    setShowAllCities(false);

    if (location) {
      window.localStorage.setItem(
        locationStorageKey,
        location
      );
    } else {
      window.localStorage.removeItem(
        locationStorageKey
      );
    }

    window.dispatchEvent(
      new CustomEvent(locationChangeEvent, {
        detail: location,
      })
    );

    if (pathname === "/events") {
      const params = new URLSearchParams(
        window.location.search
      );

      if (location) {
        params.set("location", location);
      } else {
        params.delete("location");
      }

      params.delete("page");

      const query = params.toString();

      router.replace(
        query
          ? `/events?${query}`
          : "/events",
        {
          scroll: false,
        }
      );
    }
  };

  const handleDetectLocation = () => {
    if (!("geolocation" in navigator)) {
      toast.error(
        "Your browser does not support location detection."
      );
      return;
    }

    setIsDetectingLocation(true);

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const latitude = position.coords.latitude;
        const longitude = position.coords.longitude;

        try {
          const detectedLocation =
            await reverseGeocodeCoordinates({
              latitude,
              longitude,
            });

          handleLocationSelect(detectedLocation.city);

          toast.success(
            `Location detected: ${detectedLocation.city}`
          );
        } catch (error: unknown) {
          if (process.env.NODE_ENV === "development") {
            console.error(
              "Reverse geocoding failed:",
              error
            );
          }

          const message =
            error instanceof Error &&
            error.message ===
              "Invalid location coordinates received."
              ? error.message
              : "Unable to identify your city. Please select it manually.";

          toast.error(message);
        } finally {
          setIsDetectingLocation(false);
        }
      },
      (error) => {
        setIsDetectingLocation(false);

        switch (error.code) {
          case error.PERMISSION_DENIED:
            toast.error(
              "Location permission was denied. Please select your city manually."
            );
            break;

          case error.POSITION_UNAVAILABLE:
            toast.error(
              "Your current location is unavailable."
            );
            break;

          case error.TIMEOUT:
            toast.error(
              "Location detection timed out. Please try again."
            );
            break;

          default:
            toast.error(
              "Unable to detect your location."
            );
        }
      },
      geolocationOptions
    );
  };

  const handleCreateEventClick = () => {
    if (!isAuthChecked) {
      return;
    }

    setIsMenuOpen(false);

    if (!user) {
      router.push(
        "/login?redirect=/organizer/events/create"
      );
      return;
    }

    if (user.role === "user") {
      router.push("/organizer/apply");
      return;
    }

    if (
      user.role === "organizer" ||
      user.role === "admin"
    ) {
      router.push(
        "/organizer/events/create"
      );
    }
  };

  const handleLogout = async () => {
    try {
      await logoutUser();
    } catch (error) {
      console.error("Logout failed:", error);
    } finally {
      dispatch(logout());
      setIsProfileOpen(false);
      setIsMenuOpen(false);
      router.push("/login");
      router.refresh();
    }
  };

  return (
    <>
      <header className="sticky top-0 z-50 border-b border-zinc-200 bg-white text-zinc-900 shadow-sm">
        <div className="mx-auto flex h-[72px] max-w-[1600px] items-center gap-5 px-4 sm:px-6 lg:px-8">
          <Link
            href="/"
            className="group flex shrink-0 items-center gap-2"
            aria-label="EventZentro home"
          >
            <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#f05537] text-white shadow-sm transition duration-300 group-hover:-rotate-6 group-hover:scale-105">
              <CalendarDays
                size={21}
                strokeWidth={2.4}
              />
            </span>

            <span className="hidden text-[22px] font-black tracking-[-0.8px] text-[#f05537] sm:block">
              EventZentro
            </span>
          </Link>

          <form
            onSubmit={handleSearch}
            className="hidden min-w-0 max-w-[640px] flex-1 items-center overflow-hidden rounded-xl bg-[#f7f7f7] ring-1 ring-zinc-200 transition focus-within:bg-white focus-within:ring-2 focus-within:ring-[#f05537]/40 lg:flex"
          >
            <div className="flex min-w-0 flex-1 items-center gap-3 px-4">
              <Search
                size={20}
                className="shrink-0 text-zinc-600"
              />

              <input
                type="text"
                value={searchText}
                onChange={(event) =>
                  setSearchText(
                    event.target.value
                  )
                }
                placeholder="Search events"
                className="h-12 min-w-0 flex-1 bg-transparent text-sm font-medium text-zinc-900 outline-none placeholder:text-zinc-500"
              />
            </div>

            <div className="h-7 w-px bg-zinc-300" />

            <button
              type="button"
              onClick={openLocationModal}
              className="flex h-12 w-[190px] shrink-0 items-center gap-3 px-4 text-left transition hover:bg-zinc-100"
            >
              <MapPin
                size={20}
                className="shrink-0 text-[#f05537]"
              />

              <span className="min-w-0 flex-1 truncate text-sm font-semibold text-zinc-800">
                {selectedLocation}
              </span>

              <ChevronDown
                size={16}
                className="shrink-0 text-zinc-500"
              />
            </button>

            <button
              type="submit"
              className="mr-1 flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-[#f05537] text-white transition hover:bg-[#d9472d]"
              aria-label="Search events"
            >
              <Search size={19} />
            </button>
          </form>

          <nav className="ml-auto hidden shrink-0 items-center xl:flex">
            <NavbarLink href="/">
              Home
            </NavbarLink>

            <NavbarLink href="/events">
              Browse Events
            </NavbarLink>

            <button
              type="button"
              onClick={handleCreateEventClick}
              disabled={!isAuthChecked}
              className="flex items-center gap-1.5 rounded-lg px-3 py-2.5 text-sm font-semibold text-zinc-800 transition hover:bg-zinc-100 disabled:cursor-not-allowed disabled:opacity-50"
            >
              <Plus size={17} />
              Create an Event
            </button>

            {user && (
              <NavbarLink href="/my-tickets">
                <Ticket size={17} />
                My Tickets
              </NavbarLink>
            )}

            <NavbarLink href="/contact">
              <HelpCircle size={17} />
              Help
            </NavbarLink>
          </nav>

          <div className="hidden shrink-0 items-center gap-1 md:flex">
            {!isAuthChecked ? (
              <div className="h-10 w-28 animate-pulse rounded-lg bg-zinc-100" />
            ) : user ? (
              <div
                ref={profileRef}
                className="relative"
              >
                <button
                  type="button"
                  onClick={() =>
                    setIsProfileOpen(
                      (previous) => !previous
                    )
                  }
                  className="flex items-center gap-2 rounded-xl px-2 py-1.5 transition hover:bg-zinc-100"
                  aria-expanded={isProfileOpen}
                  aria-label="Open account menu"
                >
                  <span className="flex h-9 w-9 items-center justify-center rounded-full bg-[#f05537] text-xs font-bold text-white">
                    {initials}
                  </span>

                  <span className="hidden max-w-28 truncate text-sm font-semibold text-zinc-800 2xl:block">
                    {user.firstName ||
                      displayName}
                  </span>

                  <ChevronDown
                    size={16}
                    className={`text-zinc-500 transition duration-200 ${
                      isProfileOpen
                        ? "rotate-180"
                        : ""
                    }`}
                  />
                </button>

                {isProfileOpen && (
                  <div className="absolute right-0 top-14 w-72 overflow-hidden rounded-xl border border-zinc-200 bg-white p-2 shadow-[0_20px_60px_rgba(0,0,0,0.16)]">
                    <div className="rounded-lg bg-zinc-50 p-4">
                      <div className="flex items-center gap-3">
                        <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-[#f05537] text-sm font-bold text-white">
                          {initials}
                        </span>

                        <div className="min-w-0">
                          <p className="truncate text-sm font-bold text-zinc-900">
                            {displayName}
                          </p>

                          <p className="truncate text-xs text-zinc-500">
                            {user.email}
                          </p>
                        </div>
                      </div>

                      <span className="mt-3 inline-flex rounded-full bg-orange-50 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-[#d9472d]">
                        {user.role}
                      </span>
                    </div>

                    <div className="mt-2 space-y-1">
                      <DropdownLink
                        href={dashboardHref}
                        icon={
                          <LayoutDashboard
                            size={18}
                          />
                        }
                        onClick={() =>
                          setIsProfileOpen(false)
                        }
                      >
                        Dashboard
                      </DropdownLink>

                      <DropdownLink
                        href={profileHref}
                        icon={
                          <UserRound size={18} />
                        }
                        onClick={() =>
                          setIsProfileOpen(false)
                        }
                      >
                        My Profile
                      </DropdownLink>

                      <DropdownLink
                        href="/my-tickets"
                        icon={
                          <Ticket size={18} />
                        }
                        onClick={() =>
                          setIsProfileOpen(false)
                        }
                      >
                        My Tickets
                      </DropdownLink>

                      {isOrganizer && (
                        <DropdownLink
                          href="/organizer/events/create"
                          icon={<Plus size={18} />}
                          onClick={() =>
                            setIsProfileOpen(
                              false
                            )
                          }
                        >
                          Create an Event
                        </DropdownLink>
                      )}

                      <div className="my-1 h-px bg-zinc-200" />

                      <button
                        type="button"
                        onClick={handleLogout}
                        className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left text-sm font-semibold text-red-600 transition hover:bg-red-50"
                      >
                        <LogOut size={18} />
                        Log out
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <>
                <Link
                  href="/login"
                  className="rounded-lg px-4 py-2.5 text-sm font-semibold text-zinc-800 transition hover:bg-zinc-100"
                >
                  Log In
                </Link>

                <Link
                  href="/register"
                  className="rounded-lg px-4 py-2.5 text-sm font-semibold text-zinc-800 transition hover:bg-zinc-100"
                >
                  Sign Up
                </Link>
              </>
            )}
          </div>

          <button
            type="button"
            onClick={() =>
              setIsMenuOpen(
                (previous) => !previous
              )
            }
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg text-zinc-800 transition hover:bg-zinc-100 xl:hidden"
            aria-label="Toggle navigation menu"
            aria-expanded={isMenuOpen}
          >
            {isMenuOpen ? (
              <X size={23} />
            ) : (
              <Menu size={23} />
            )}
          </button>
        </div>

        <form
          onSubmit={handleSearch}
          className="mx-4 mb-3 flex items-center overflow-hidden rounded-xl bg-[#f7f7f7] ring-1 ring-zinc-200 lg:hidden"
        >
          <div className="flex min-w-0 flex-1 items-center gap-2 px-3">
            <Search
              size={18}
              className="shrink-0 text-zinc-600"
            />

            <input
              type="text"
              value={searchText}
              onChange={(event) =>
                setSearchText(
                  event.target.value
                )
              }
              placeholder="Search events"
              className="h-11 min-w-0 flex-1 bg-transparent text-sm text-zinc-900 outline-none placeholder:text-zinc-500"
            />
          </div>

          <div className="hidden h-6 w-px bg-zinc-300 sm:block" />

          <button
            type="button"
            onClick={openLocationModal}
            className="hidden h-11 w-36 items-center gap-2 px-3 text-left sm:flex"
          >
            <MapPin
              size={17}
              className="shrink-0 text-[#f05537]"
            />

            <span className="min-w-0 flex-1 truncate text-sm font-medium text-zinc-800">
              {selectedLocation}
            </span>

            <ChevronDown
              size={14}
              className="shrink-0 text-zinc-500"
            />
          </button>

          <button
            type="submit"
            className="mr-1 flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-[#f05537] text-white"
            aria-label="Search events"
          >
            <Search size={17} />
          </button>
        </form>

        <div
          className={`overflow-hidden border-zinc-200 bg-white transition-all duration-300 xl:hidden ${
            isMenuOpen
              ? "max-h-[800px] border-t opacity-100"
              : "max-h-0 opacity-0"
          }`}
        >
          <div className="mx-auto max-w-[1600px] px-4 py-4 sm:px-6">
            <div className="space-y-1">
              <button
                type="button"
                onClick={openLocationModal}
                className="flex w-full items-center gap-3 rounded-xl px-4 py-3 text-left text-sm font-semibold text-zinc-800 transition hover:bg-zinc-100"
              >
                <span className="text-[#f05537]">
                  <MapPin size={19} />
                </span>

                <span className="min-w-0 flex-1 truncate">
                  {selectedLocation}
                </span>

                <ChevronDown
                  size={16}
                  className="text-zinc-500"
                />
              </button>

              <MobileLink
                href="/"
                icon={<Home size={19} />}
              >
                Home
              </MobileLink>

              <MobileLink
                href="/events"
                icon={<Search size={19} />}
              >
                Browse Events
              </MobileLink>

              <button
                type="button"
                onClick={
                  handleCreateEventClick
                }
                disabled={!isAuthChecked}
                className="flex w-full items-center gap-3 rounded-xl px-4 py-3 text-left text-sm font-semibold text-zinc-800 transition hover:bg-zinc-100 disabled:cursor-not-allowed disabled:opacity-50"
              >
                <span className="text-zinc-500">
                  <Plus size={19} />
                </span>

                Create an Event
              </button>

              <MobileLink
                href="/my-tickets"
                icon={<Ticket size={19} />}
              >
                My Tickets
              </MobileLink>

              <MobileLink
                href="/contact"
                icon={<HelpCircle size={19} />}
              >
                Help
              </MobileLink>
            </div>

            <div className="my-4 h-px bg-zinc-200" />

            {!isAuthChecked ? (
              <div className="h-12 animate-pulse rounded-xl bg-zinc-100" />
            ) : user ? (
              <div className="space-y-1">
                <div className="mb-3 flex items-center gap-3 rounded-xl bg-zinc-50 p-4">
                  <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-[#f05537] text-sm font-bold text-white">
                    {initials}
                  </span>

                  <div className="min-w-0">
                    <p className="truncate text-sm font-bold text-zinc-900">
                      {displayName}
                    </p>

                    <p className="truncate text-xs text-zinc-500">
                      {user.email}
                    </p>
                  </div>
                </div>

                <MobileLink
                  href={dashboardHref}
                  icon={
                    <LayoutDashboard
                      size={19}
                    />
                  }
                >
                  Dashboard
                </MobileLink>

                <MobileLink
                  href={profileHref}
                  icon={
                    <UserRound size={19} />
                  }
                >
                  My Profile
                </MobileLink>

                <button
                  type="button"
                  onClick={handleLogout}
                  className="flex w-full items-center gap-3 rounded-xl px-4 py-3 text-left text-sm font-semibold text-red-600 transition hover:bg-red-50"
                >
                  <LogOut size={19} />
                  Log out
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-3">
                <Link
                  href="/login"
                  className="rounded-xl border border-zinc-300 px-4 py-3 text-center text-sm font-semibold text-zinc-900 transition hover:bg-zinc-50"
                >
                  Log In
                </Link>

                <Link
                  href="/register"
                  className="rounded-xl bg-[#f05537] px-4 py-3 text-center text-sm font-bold text-white transition hover:bg-[#d9472d]"
                >
                  Sign Up
                </Link>
              </div>
            )}
          </div>
        </div>
      </header>

      {isLocationOpen && (
        <div
          className="fixed inset-0 z-[100] flex items-end justify-center bg-black/55 px-0 pt-20 backdrop-blur-sm sm:items-start sm:px-4 sm:pt-28"
          onMouseDown={closeLocationModal}
        >
          <div
            className="flex max-h-[86vh] w-full max-w-2xl flex-col overflow-hidden rounded-t-3xl bg-white shadow-[0_30px_100px_rgba(0,0,0,0.3)] sm:rounded-3xl"
            onMouseDown={(event) =>
              event.stopPropagation()
            }
          >
            <div className="flex items-center justify-between border-b border-zinc-200 px-5 py-4 sm:px-6">
              <div>
                <h2 className="text-xl font-black text-zinc-900">
                  Choose your location
                </h2>

                <p className="mt-1 text-sm text-zinc-500">
                  Select a city to see events
                  happening near you.
                </p>
              </div>

              <button
                type="button"
                onClick={closeLocationModal}
                className="flex h-10 w-10 items-center justify-center rounded-full text-zinc-500 transition hover:bg-zinc-100 hover:text-zinc-900"
                aria-label="Close location selector"
              >
                <X size={21} />
              </button>
            </div>

            <div className="overflow-y-auto p-5 sm:p-6">
              <div className="flex items-center gap-3 rounded-2xl border border-zinc-200 bg-zinc-50 px-4 transition focus-within:border-[#f05537] focus-within:bg-white focus-within:ring-4 focus-within:ring-[#f05537]/10">
                <Search
                  size={19}
                  className="shrink-0 text-zinc-500"
                />

                <input
                  type="text"
                  value={locationSearch}
                  onChange={(event) =>
                    setLocationSearch(
                      event.target.value
                    )
                  }
                  placeholder="Search for your city"
                  className="h-12 min-w-0 flex-1 bg-transparent text-sm font-medium text-zinc-900 outline-none placeholder:text-zinc-500"
                  autoFocus
                />

                {locationSearch && (
                  <button
                    type="button"
                    onClick={() =>
                      setLocationSearch("")
                    }
                    className="flex h-8 w-8 items-center justify-center rounded-full text-zinc-400 transition hover:bg-zinc-200 hover:text-zinc-900"
                  >
                    <X size={16} />
                  </button>
                )}
              </div>

              <button
                type="button"
                onClick={handleDetectLocation}
                disabled={isDetectingLocation}
                className="mt-4 flex w-full items-center gap-3 rounded-2xl border border-zinc-200 bg-zinc-950 px-4 py-3.5 text-left text-white transition hover:border-[#f05537] hover:bg-zinc-900 disabled:cursor-not-allowed disabled:opacity-70"
              >
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#f05537] text-white shadow-sm">
                  {isDetectingLocation ? (
                    <LoaderCircle
                      size={19}
                      className="animate-spin"
                    />
                  ) : (
                    <LocateFixed size={19} />
                  )}
                </span>

                <div className="min-w-0 flex-1">
                  <p className="text-sm font-bold">
                    {isDetectingLocation
                      ? "Detecting location..."
                      : "Detect my location"}
                  </p>

                  <p className="mt-0.5 text-xs text-zinc-300">
                    Use your current position to
                    choose a city
                  </p>
                </div>
              </button>

              <button
                type="button"
                onClick={() =>
                  handleLocationSelect("")
                }
                className="mt-4 flex w-full items-center gap-3 rounded-2xl border border-orange-100 bg-orange-50 px-4 py-3.5 text-left transition hover:border-orange-200 hover:bg-orange-100"
              >
                <span className="flex h-10 w-10 items-center justify-center rounded-full bg-white text-[#f05537] shadow-sm">
                  <LocateFixed size={19} />
                </span>

                <div className="min-w-0 flex-1">
                  <p className="text-sm font-bold text-zinc-900">
                    All locations
                  </p>

                  <p className="mt-0.5 text-xs text-zinc-500">
                    Show events from every city
                  </p>
                </div>

                {selectedLocation ===
                  "All locations" && (
                  <Check
                    size={19}
                    className="text-[#f05537]"
                  />
                )}
              </button>

              {isSearchingLocations ? (
                <div className="mt-6">
                  <p className="text-xs font-bold uppercase tracking-[0.18em] text-zinc-500">
                    Search results
                  </p>

                  {searchedCities.length === 0 ? (
                    <div className="py-12 text-center">
                      <MapPin
                        size={34}
                        className="mx-auto text-zinc-300"
                      />

                      <p className="mt-3 text-sm font-bold text-zinc-800">
                        No cities found
                      </p>

                      <p className="mt-1 text-xs text-zinc-500">
                        Try another city name.
                      </p>
                    </div>
                  ) : (
                    <div className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-3">
                      {searchedCities.map((city) => {
                        const isSelected =
                          isSelectedCity(city);

                        return (
                          <button
                            key={city}
                            type="button"
                            onClick={() =>
                              handleLocationSelect(city)
                            }
                            className={`flex min-h-20 flex-col items-center justify-center rounded-2xl border px-3 py-4 text-center transition ${
                              isSelected
                                ? "border-[#f05537] bg-orange-50 text-[#d9472d]"
                                : "border-zinc-200 bg-white text-zinc-800 hover:border-orange-200 hover:bg-orange-50"
                            }`}
                          >
                            <MapPin
                              size={21}
                              className={
                                isSelected
                                  ? "text-[#f05537]"
                                  : "text-zinc-400"
                              }
                            />

                            <span className="mt-2 line-clamp-1 text-sm font-bold">
                              {city}
                            </span>
                          </button>
                        );
                      })}
                    </div>
                  )}
                </div>
              ) : (
                <>
                  <div className="mt-6">
                    <p className="text-xs font-bold uppercase tracking-[0.18em] text-zinc-500">
                      Popular cities
                    </p>

                    <div className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-3">
                      {popularCities.map((city) => {
                        const isSelected =
                          isSelectedCity(city.name);

                        return (
                          <button
                            key={city.name}
                            type="button"
                            onClick={() =>
                              handleLocationSelect(
                                city.name
                              )
                            }
                            className={`flex min-h-24 flex-col justify-between rounded-2xl border px-4 py-3 text-left transition ${
                              isSelected
                                ? "border-[#f05537] bg-orange-50 text-[#d9472d]"
                                : "border-zinc-200 bg-white text-zinc-900 hover:border-orange-200 hover:bg-orange-50"
                            }`}
                          >
                            <div className="flex items-center justify-between gap-2">
                              <MapPin
                                size={19}
                                className={
                                  isSelected
                                    ? "text-[#f05537]"
                                    : "text-zinc-400"
                                }
                              />

                              {isSelected && (
                                <Check
                                  size={18}
                                  className="text-[#f05537]"
                                />
                              )}
                            </div>

                            <div>
                              <p className="line-clamp-1 text-sm font-black">
                                {city.name}
                              </p>

                              <p className="mt-0.5 line-clamp-1 text-xs text-zinc-500">
                                {city.state}
                              </p>
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  <div className="mt-7">
                    <div className="flex items-center justify-between gap-4">
                      <p className="text-xs font-bold uppercase tracking-[0.18em] text-zinc-500">
                        Other cities
                      </p>

                      {hasHiddenOtherCities && (
                        <button
                          type="button"
                          onClick={() =>
                            setShowAllCities(
                              (previous) => !previous
                            )
                          }
                          className="text-xs font-bold text-[#f05537] transition hover:text-[#d9472d]"
                        >
                          {showAllCities
                            ? "Hide all cities"
                            : "Show all cities"}
                        </button>
                      )}
                    </div>

                    {isLocationsLoading ? (
                      <div className="flex items-center justify-center gap-2 py-10 text-sm font-medium text-zinc-500">
                        <LoaderCircle
                          size={20}
                          className="animate-spin"
                        />
                        Loading locations...
                      </div>
                    ) : otherCityOptions.length === 0 ? (
                      <div className="py-10 text-center">
                        <MapPin
                          size={34}
                          className="mx-auto text-zinc-300"
                        />

                        <p className="mt-3 text-sm font-bold text-zinc-800">
                          No event cities available yet.
                        </p>
                      </div>
                    ) : (
                      <div className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-3">
                        {visibleOtherCities.map((city) => {
                          const isSelected =
                            isSelectedCity(city);

                          return (
                            <button
                              key={city}
                              type="button"
                              onClick={() =>
                                handleLocationSelect(city)
                              }
                              className={`flex min-h-16 items-center gap-2 rounded-2xl border px-3 py-3 text-left transition ${
                                isSelected
                                  ? "border-[#f05537] bg-orange-50 text-[#d9472d]"
                                  : "border-zinc-200 bg-white text-zinc-800 hover:border-orange-200 hover:bg-orange-50"
                              }`}
                            >
                              <MapPin
                                size={18}
                                className={
                                  isSelected
                                    ? "text-[#f05537]"
                                    : "text-zinc-400"
                                }
                              />

                              <span className="min-w-0 flex-1 truncate text-sm font-bold">
                                {city}
                              </span>

                              {isSelected && (
                                <Check
                                  size={18}
                                  className="shrink-0 text-[#f05537]"
                                />
                              )}
                            </button>
                          );
                        })}
                      </div>
                    )}
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}

function NavbarLink({
  href,
  children,
}: {
  href: string;
  children: ReactNode;
}) {
  return (
    <Link
      href={href}
      className="flex items-center gap-1.5 rounded-lg px-3 py-2.5 text-sm font-semibold text-zinc-800 transition hover:bg-zinc-100"
    >
      {children}
    </Link>
  );
}

function DropdownLink({
  href,
  icon,
  children,
  onClick,
}: {
  href: string;
  icon: ReactNode;
  children: ReactNode;
  onClick: () => void;
}) {
  return (
    <Link
      href={href}
      onClick={onClick}
      className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-semibold text-zinc-700 transition hover:bg-zinc-100 hover:text-zinc-950"
    >
      <span className="text-zinc-500">
        {icon}
      </span>

      {children}
    </Link>
  );
}

function MobileLink({
  href,
  icon,
  children,
}: {
  href: string;
  icon: ReactNode;
  children: ReactNode;
}) {
  return (
    <Link
      href={href}
      className="flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-semibold text-zinc-800 transition hover:bg-zinc-100"
    >
      <span className="text-zinc-500">
        {icon}
      </span>

      {children}
    </Link>
  );
}
