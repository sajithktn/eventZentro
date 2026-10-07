"use client";

import { Check, LoaderCircle, LocateFixed, MapPin, Search, X } from "lucide-react";

import { popularCities } from "@/data/indianCities";
import type { NavbarState } from "./useNavbarState";

interface LocationModalProps {
  state: NavbarState;
}

export function LocationModal({ state }: LocationModalProps) {
  const {
    closeLocationModal,
    handleDetectLocation,
    handleLocationSelect,
    hasHiddenOtherCities,
    isDetectingLocation,
    isLocationsLoading,
    isSearchingLocations,
    isSelectedCity,
    locationSearch,
    otherCityOptions,
    searchedCities,
    selectedLocation,
    setLocationSearch,
    setShowAllCities,
    showAllCities,
    visibleOtherCities,
  } = state;

  return (
    <div
      className="fixed inset-0 z-[100] flex items-end justify-center bg-black/55 px-0 pt-20 backdrop-blur-sm sm:items-start sm:px-4 sm:pt-28"
      onMouseDown={closeLocationModal}
    >
      <div
        className="flex max-h-[86vh] w-full max-w-2xl flex-col overflow-hidden rounded-t-3xl bg-white shadow-[0_30px_100px_rgba(0,0,0,0.3)] sm:rounded-3xl"
        onMouseDown={(event) => event.stopPropagation()}
      >
        <div className="flex items-center justify-between border-b border-zinc-200 px-5 py-4 sm:px-6">
          <div>
            <h2 className="text-xl font-black text-zinc-900">Choose your location</h2>
            <p className="mt-1 text-sm text-zinc-500">
              Select a city to see events happening near you.
            </p>
          </div>
          <button type="button" onClick={closeLocationModal} className="flex h-10 w-10 items-center justify-center rounded-full text-zinc-500 transition hover:bg-zinc-100 hover:text-zinc-900" aria-label="Close location selector">
            <X size={21} />
          </button>
        </div>

        <div className="overflow-y-auto p-5 sm:p-6">
          <div className="flex items-center gap-3 rounded-2xl border border-zinc-200 bg-zinc-50 px-4 transition focus-within:border-[#f05537] focus-within:bg-white focus-within:ring-4 focus-within:ring-[#f05537]/10">
            <Search size={19} className="shrink-0 text-zinc-500" />
            <input
              type="text"
              value={locationSearch}
              onChange={(event) => setLocationSearch(event.target.value)}
              placeholder="Search for your city"
              className="h-12 min-w-0 flex-1 bg-transparent text-sm font-medium text-zinc-900 outline-none placeholder:text-zinc-500"
              autoFocus
            />
            {locationSearch && (
              <button type="button" onClick={() => setLocationSearch("")} className="flex h-8 w-8 items-center justify-center rounded-full text-zinc-400 transition hover:bg-zinc-200 hover:text-zinc-900">
                <X size={16} />
              </button>
            )}
          </div>

          <button type="button" onClick={handleDetectLocation} disabled={isDetectingLocation} className="mt-4 flex w-full items-center gap-3 rounded-2xl border border-zinc-200 bg-zinc-950 px-4 py-3.5 text-left text-white transition hover:border-[#f05537] hover:bg-zinc-900 disabled:cursor-not-allowed disabled:opacity-70">
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#f05537] text-white shadow-sm">
              {isDetectingLocation ? <LoaderCircle size={19} className="animate-spin" /> : <LocateFixed size={19} />}
            </span>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-bold">
                {isDetectingLocation ? "Detecting location..." : "Detect my location"}
              </p>
              <p className="mt-0.5 text-xs text-zinc-300">
                Use your current position to choose a city
              </p>
            </div>
          </button>

          <button type="button" onClick={() => handleLocationSelect("")} className="mt-4 flex w-full items-center gap-3 rounded-2xl border border-orange-100 bg-orange-50 px-4 py-3.5 text-left transition hover:border-orange-200 hover:bg-orange-100">
            <span className="flex h-10 w-10 items-center justify-center rounded-full bg-white text-[#f05537] shadow-sm">
              <LocateFixed size={19} />
            </span>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-bold text-zinc-900">All locations</p>
              <p className="mt-0.5 text-xs text-zinc-500">
                Show events from every city
              </p>
            </div>
            {selectedLocation === "All locations" && <Check size={19} className="text-[#f05537]" />}
          </button>

          {isSearchingLocations ? (
            <CityResults
              cities={searchedCities}
              emptyLabel="No cities found"
              emptyDescription="Try another city name."
              isSelectedCity={isSelectedCity}
              onSelect={handleLocationSelect}
            />
          ) : (
            <>
              <PopularCityGrid isSelectedCity={isSelectedCity} onSelect={handleLocationSelect} />
              <OtherCityGrid
                cities={visibleOtherCities}
                hasHiddenOtherCities={hasHiddenOtherCities}
                isLoading={isLocationsLoading}
                isSelectedCity={isSelectedCity}
                onSelect={handleLocationSelect}
                setShowAllCities={setShowAllCities}
                showAllCities={showAllCities}
                totalOtherCities={otherCityOptions.length}
              />
            </>
          )}
        </div>
      </div>
    </div>
  );
}

function CityResults({
  cities,
  emptyDescription,
  emptyLabel,
  isSelectedCity,
  onSelect,
}: {
  cities: string[];
  emptyDescription?: string;
  emptyLabel: string;
  isSelectedCity: (city: string) => boolean;
  onSelect: (city: string) => void;
}) {
  return (
    <div className="mt-6">
      <p className="text-xs font-bold uppercase tracking-[0.18em] text-zinc-500">
        Search results
      </p>
      {cities.length === 0 ? (
        <EmptyCities label={emptyLabel} description={emptyDescription} />
      ) : (
        <div className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-3">
          {cities.map((city) => (
            <CityButton key={city} city={city} isSelected={isSelectedCity(city)} onSelect={onSelect} />
          ))}
        </div>
      )}
    </div>
  );
}

function PopularCityGrid({
  isSelectedCity,
  onSelect,
}: {
  isSelectedCity: (city: string) => boolean;
  onSelect: (city: string) => void;
}) {
  return (
    <div className="mt-6">
      <p className="text-xs font-bold uppercase tracking-[0.18em] text-zinc-500">
        Popular cities
      </p>
      <div className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-3">
        {popularCities.map((city) => (
          <button
            key={city.name}
            type="button"
            onClick={() => onSelect(city.name)}
            className={`flex min-h-24 flex-col justify-between rounded-2xl border px-4 py-3 text-left transition ${
              isSelectedCity(city.name)
                ? "border-[#f05537] bg-orange-50 text-[#d9472d]"
                : "border-zinc-200 bg-white text-zinc-900 hover:border-orange-200 hover:bg-orange-50"
            }`}
          >
            <div className="flex items-center justify-between gap-2">
              <MapPin size={19} className={isSelectedCity(city.name) ? "text-[#f05537]" : "text-zinc-400"} />
              {isSelectedCity(city.name) && <Check size={18} className="text-[#f05537]" />}
            </div>
            <div>
              <p className="line-clamp-1 text-sm font-black">{city.name}</p>
              <p className="mt-0.5 line-clamp-1 text-xs text-zinc-500">{city.state}</p>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}

function OtherCityGrid({
  cities,
  hasHiddenOtherCities,
  isLoading,
  isSelectedCity,
  onSelect,
  setShowAllCities,
  showAllCities,
  totalOtherCities,
}: {
  cities: string[];
  hasHiddenOtherCities: boolean;
  isLoading: boolean;
  isSelectedCity: (city: string) => boolean;
  onSelect: (city: string) => void;
  setShowAllCities: React.Dispatch<React.SetStateAction<boolean>>;
  showAllCities: boolean;
  totalOtherCities: number;
}) {
  return (
    <div className="mt-7">
      <div className="flex items-center justify-between gap-4">
        <p className="text-xs font-bold uppercase tracking-[0.18em] text-zinc-500">
          Other cities
        </p>
        {hasHiddenOtherCities && (
          <button type="button" onClick={() => setShowAllCities((previous) => !previous)} className="text-xs font-bold text-[#f05537] transition hover:text-[#d9472d]">
            {showAllCities ? "Hide all cities" : "Show all cities"}
          </button>
        )}
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center gap-2 py-10 text-sm font-medium text-zinc-500">
          <LoaderCircle size={20} className="animate-spin" />
          Loading locations...
        </div>
      ) : totalOtherCities === 0 ? (
        <EmptyCities label="No event cities available yet." />
      ) : (
        <div className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-3">
          {cities.map((city) => (
            <CityButton key={city} city={city} isSelected={isSelectedCity(city)} onSelect={onSelect} compact />
          ))}
        </div>
      )}
    </div>
  );
}

function CityButton({
  city,
  compact = false,
  isSelected,
  onSelect,
}: {
  city: string;
  compact?: boolean;
  isSelected: boolean;
  onSelect: (city: string) => void;
}) {
  return (
    <button
      type="button"
      onClick={() => onSelect(city)}
      className={`${compact ? "flex min-h-16 items-center gap-2 text-left" : "flex min-h-20 flex-col items-center justify-center text-center"} rounded-2xl border px-3 py-3 transition ${
        isSelected
          ? "border-[#f05537] bg-orange-50 text-[#d9472d]"
          : "border-zinc-200 bg-white text-zinc-800 hover:border-orange-200 hover:bg-orange-50"
      }`}
    >
      <MapPin size={compact ? 18 : 21} className={isSelected ? "text-[#f05537]" : "text-zinc-400"} />
      <span className={`${compact ? "min-w-0 flex-1 truncate" : "mt-2 line-clamp-1"} text-sm font-bold`}>
        {city}
      </span>
      {compact && isSelected && <Check size={18} className="shrink-0 text-[#f05537]" />}
    </button>
  );
}

function EmptyCities({
  description,
  label,
}: {
  description?: string;
  label: string;
}) {
  return (
    <div className="py-10 text-center">
      <MapPin size={34} className="mx-auto text-zinc-300" />
      <p className="mt-3 text-sm font-bold text-zinc-800">{label}</p>
      {description && <p className="mt-1 text-xs text-zinc-500">{description}</p>}
    </div>
  );
}
