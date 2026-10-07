"use client";

import Link from "next/link";
import {
  CalendarDays,
  ChevronDown,
  HelpCircle,
  Home,
  LayoutDashboard,
  LogOut,
  MapPin,
  Menu,
  Plus,
  Search,
  Ticket,
  UserRound,
  X,
} from "lucide-react";

import { DropdownLink, MobileLink, NavbarLink } from "./NavbarLinks";
import type { NavbarState } from "./useNavbarState";

interface NavbarHeaderProps {
  state: NavbarState;
}

export function NavbarHeader({ state }: NavbarHeaderProps) {
  const {
    displayName,
    handleCreateEventClick,
    handleSearch,
    initials,
    isAuthChecked,
    isMenuOpen,
    isProfileOpen,
    openLocationModal,
    profileRef,
    searchText,
    selectedLocation,
    setIsMenuOpen,
    setIsProfileOpen,
    setSearchText,
    user,
  } = state;

  return (
    <header className="sticky top-0 z-50 border-b border-zinc-200 bg-white text-zinc-900 shadow-sm">
      <div className="mx-auto flex h-[72px] max-w-[1600px] items-center gap-5 px-4 sm:px-6 lg:px-8">
        <Link href="/" className="group flex shrink-0 items-center gap-2" aria-label="EventZentro home">
          <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#f05537] text-white shadow-sm transition duration-300 group-hover:-rotate-6 group-hover:scale-105">
            <CalendarDays size={21} strokeWidth={2.4} />
          </span>
          <span className="hidden text-[22px] font-black tracking-[-0.8px] text-[#f05537] sm:block">
            EventZentro
          </span>
        </Link>

        <form onSubmit={handleSearch} className="hidden min-w-0 max-w-[640px] flex-1 items-center overflow-hidden rounded-xl bg-[#f7f7f7] ring-1 ring-zinc-200 transition focus-within:bg-white focus-within:ring-2 focus-within:ring-[#f05537]/40 lg:flex">
          <div className="flex min-w-0 flex-1 items-center gap-3 px-4">
            <Search size={20} className="shrink-0 text-zinc-600" />
            <input
              type="text"
              value={searchText}
              onChange={(event) => setSearchText(event.target.value)}
              placeholder="Search events"
              className="h-12 min-w-0 flex-1 bg-transparent text-sm font-medium text-zinc-900 outline-none placeholder:text-zinc-500"
            />
          </div>
          <div className="h-7 w-px bg-zinc-300" />
          <LocationButton state={state} />
          <button
            type="submit"
            className="mr-1 flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-[#f05537] text-white transition hover:bg-[#d9472d]"
            aria-label="Search events"
          >
            <Search size={19} />
          </button>
        </form>

        <nav className="ml-auto hidden shrink-0 items-center xl:flex">
          <NavbarLink href="/">Home</NavbarLink>
          <NavbarLink href="/events">Browse Events</NavbarLink>
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
            <div ref={profileRef} className="relative">
              <button
                type="button"
                onClick={() => setIsProfileOpen((previous) => !previous)}
                className="flex items-center gap-2 rounded-xl px-2 py-1.5 transition hover:bg-zinc-100"
                aria-expanded={isProfileOpen}
                aria-label="Open account menu"
              >
                <span className="flex h-9 w-9 items-center justify-center rounded-full bg-[#f05537] text-xs font-bold text-white">
                  {initials}
                </span>
                <span className="hidden max-w-28 truncate text-sm font-semibold text-zinc-800 2xl:block">
                  {user.firstName || displayName}
                </span>
                <ChevronDown
                  size={16}
                  className={`text-zinc-500 transition duration-200 ${isProfileOpen ? "rotate-180" : ""}`}
                />
              </button>
              {isProfileOpen && <ProfileDropdown state={state} />}
            </div>
          ) : (
            <>
              <Link href="/login" className="rounded-lg px-4 py-2.5 text-sm font-semibold text-zinc-800 transition hover:bg-zinc-100">
                Log In
              </Link>
              <Link href="/register" className="rounded-lg px-4 py-2.5 text-sm font-semibold text-zinc-800 transition hover:bg-zinc-100">
                Sign Up
              </Link>
            </>
          )}
        </div>

        <button
          type="button"
          onClick={() => setIsMenuOpen((previous) => !previous)}
          className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg text-zinc-800 transition hover:bg-zinc-100 xl:hidden"
          aria-label="Toggle navigation menu"
          aria-expanded={isMenuOpen}
        >
          {isMenuOpen ? <X size={23} /> : <Menu size={23} />}
        </button>
      </div>

      <form onSubmit={handleSearch} className="mx-4 mb-3 flex items-center overflow-hidden rounded-xl bg-[#f7f7f7] ring-1 ring-zinc-200 lg:hidden">
        <div className="flex min-w-0 flex-1 items-center gap-2 px-3">
          <Search size={18} className="shrink-0 text-zinc-600" />
          <input
            type="text"
            value={searchText}
            onChange={(event) => setSearchText(event.target.value)}
            placeholder="Search events"
            className="h-11 min-w-0 flex-1 bg-transparent text-sm text-zinc-900 outline-none placeholder:text-zinc-500"
          />
        </div>
        <div className="h-6 w-px bg-zinc-300" />
        <button
          type="button"
          onClick={openLocationModal}
          className="flex h-11 max-w-[110px] items-center gap-1.5 px-2 text-left sm:max-w-none sm:w-36 sm:gap-2 sm:px-3"
        >
          <MapPin size={16} className="shrink-0 text-[#f05537]" />
          <span className="min-w-0 flex-1 truncate text-xs sm:text-sm font-medium text-zinc-800">
            {selectedLocation}
          </span>
          <ChevronDown size={13} className="shrink-0 text-zinc-500" />
        </button>
        <button type="submit" className="mr-1 flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-[#f05537] text-white" aria-label="Search events">
          <Search size={17} />
        </button>
      </form>

      <MobileMenu state={state} />
    </header>
  );
}

function LocationButton({ state }: NavbarHeaderProps) {
  return (
    <button
      type="button"
      onClick={state.openLocationModal}
      className="flex h-12 w-[190px] shrink-0 items-center gap-3 px-4 text-left transition hover:bg-zinc-100"
    >
      <MapPin size={20} className="shrink-0 text-[#f05537]" />
      <span className="min-w-0 flex-1 truncate text-sm font-semibold text-zinc-800">
        {state.selectedLocation}
      </span>
      <ChevronDown size={16} className="shrink-0 text-zinc-500" />
    </button>
  );
}

function ProfileDropdown({ state }: NavbarHeaderProps) {
  const {
    displayName,
    handleLogout,
    initials,
    profileHref,
    setIsProfileOpen,
    user,
  } = state;

  if (!user) return null;

  return (
    <div className="absolute right-0 top-14 w-72 overflow-hidden rounded-xl border border-zinc-200 bg-white p-2 shadow-[0_20px_60px_rgba(0,0,0,0.16)]">
      <div className="rounded-lg bg-zinc-50 p-4">
        <div className="flex items-center gap-3">
          <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-[#f05537] text-sm font-bold text-white">
            {initials}
          </span>
          <div className="min-w-0">
            <p className="truncate text-sm font-bold text-zinc-900">{displayName}</p>
            <p className="truncate text-xs text-zinc-500">{user.email}</p>
          </div>
        </div>
        <span className="mt-3 inline-flex rounded-full bg-orange-50 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-[#d9472d]">
          {user.role}
        </span>
      </div>

      <div className="mt-2 space-y-1">
        <DropdownLink href={profileHref} icon={<UserRound size={18} />} onClick={() => setIsProfileOpen(false)}>
          Profile
        </DropdownLink>
        <div className="my-1 h-px bg-zinc-200" />
        <button type="button" onClick={handleLogout} className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left text-sm font-semibold text-red-600 transition hover:bg-red-50">
          <LogOut size={18} />
          Log out
        </button>
      </div>
    </div>
  );
}

function MobileMenu({ state }: NavbarHeaderProps) {
  const {
    dashboardHref,
    displayName,
    handleCreateEventClick,
    handleLogout,
    initials,
    isAuthChecked,
    isMenuOpen,
    openLocationModal,
    profileHref,
    selectedLocation,
    user,
  } = state;

  return (
    <div className={`overflow-hidden border-zinc-200 bg-white transition-all duration-300 xl:hidden ${isMenuOpen ? "max-h-[800px] border-t opacity-100" : "max-h-0 opacity-0"}`}>
      <div className="mx-auto max-w-[1600px] px-4 py-4 sm:px-6">
        <div className="space-y-1">
          <button type="button" onClick={openLocationModal} className="flex w-full items-center gap-3 rounded-xl px-4 py-3 text-left text-sm font-semibold text-zinc-800 transition hover:bg-zinc-100">
            <span className="text-[#f05537]"><MapPin size={19} /></span>
            <span className="min-w-0 flex-1 truncate">{selectedLocation}</span>
            <ChevronDown size={16} className="text-zinc-500" />
          </button>
          <MobileLink href="/" icon={<Home size={19} />}>Home</MobileLink>
          <MobileLink href="/events" icon={<Search size={19} />}>Browse Events</MobileLink>
          <button type="button" onClick={handleCreateEventClick} disabled={!isAuthChecked} className="flex w-full items-center gap-3 rounded-xl px-4 py-3 text-left text-sm font-semibold text-zinc-800 transition hover:bg-zinc-100 disabled:cursor-not-allowed disabled:opacity-50">
            <span className="text-zinc-500"><Plus size={19} /></span>
            Create an Event
          </button>
          <MobileLink href="/my-tickets" icon={<Ticket size={19} />}>My Tickets</MobileLink>
          <MobileLink href="/contact" icon={<HelpCircle size={19} />}>Help</MobileLink>
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
                <p className="truncate text-sm font-bold text-zinc-900">{displayName}</p>
                <p className="truncate text-xs text-zinc-500">{user.email}</p>
              </div>
            </div>
            <MobileLink href={dashboardHref} icon={<LayoutDashboard size={19} />}>Dashboard</MobileLink>
            <MobileLink href={profileHref} icon={<UserRound size={19} />}>Profile</MobileLink>
            <button type="button" onClick={handleLogout} className="flex w-full items-center gap-3 rounded-xl px-4 py-3 text-left text-sm font-semibold text-red-600 transition hover:bg-red-50">
              <LogOut size={19} />
              Log out
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-3">
            <Link href="/login" className="rounded-xl border border-zinc-300 px-4 py-3 text-center text-sm font-semibold text-zinc-900 transition hover:bg-zinc-50">
              Log In
            </Link>
            <Link href="/register" className="rounded-xl bg-[#f05537] px-4 py-3 text-center text-sm font-bold text-white transition hover:bg-[#d9472d]">
              Sign Up
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
