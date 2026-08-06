"use client";

import {
  useState,
  type ChangeEvent,
} from "react";
import { toast } from "sonner";
import {
  LoaderCircle,
  LocateFixed,
  MapPin,
} from "lucide-react";

import {
  reverseGeocodeCoordinates,
  type ReverseGeocodeCoordinates,
} from "@/services/location.service";

interface LocationSelectorProps {
  value?: string;
  onChange?: (location: string) => void;
  onLocationDetected?: (
    location: string,
    coordinates?: ReverseGeocodeCoordinates
  ) => void;
  inputId?: string;
  inputName?: string;
  placeholder?: string;
  required?: boolean;
  disabled?: boolean;
  inputClassName?: string;
  title?: string;
  description?: string;
}

const geolocationOptions: PositionOptions = {
  enableHighAccuracy: true,
  timeout: 10000,
  maximumAge: 0,
};

const getGeolocationErrorMessage = (
  error: GeolocationPositionError
) => {
  switch (error.code) {
    case error.PERMISSION_DENIED:
      return "Location permission was denied. Please select your location manually.";

    case error.POSITION_UNAVAILABLE:
      return "Location information is unavailable.";

    case error.TIMEOUT:
      return "Location request timed out.";

    default:
      return "An unknown location error occurred.";
  }
};

export default function LocationSelector({
  value = "",
  onChange,
  onLocationDetected,
  inputId,
  inputName,
  placeholder = "Enter your location",
  required = false,
  disabled = false,
  inputClassName = "",
  title = "Find events near you",
  description = "Location permission is requested only after clicking the button.",
}: LocationSelectorProps) {
  const [coordinates, setCoordinates] =
    useState<ReverseGeocodeCoordinates | null>(
      null
    );

  const [locationName, setLocationName] =
    useState("");

  const [isDetecting, setIsDetecting] =
    useState(false);

  const [
    hasDeniedLocationPermission,
    setHasDeniedLocationPermission,
  ] = useState(false);

  const handleManualLocationChange = (
    event: ChangeEvent<HTMLInputElement>
  ) => {
    onChange?.(event.target.value);
  };

  const handleDetectLocation = () => {
    if (!("geolocation" in navigator)) {
      toast.error(
        "Your browser does not support geolocation."
      );
      return;
    }

    if (hasDeniedLocationPermission) {
      toast.error(
        "Location permission was denied. Please select your location manually."
      );
      return;
    }

    setIsDetecting(true);

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const nextCoordinates = {
          latitude:
            position.coords.latitude,
          longitude:
            position.coords.longitude,
        };

        try {
          const detectedLocation =
            await reverseGeocodeCoordinates(
              nextCoordinates
            );

          const detectedLocationName = [
            detectedLocation.city,
            detectedLocation.state,
          ]
            .filter(Boolean)
            .join(", ");

          setCoordinates(nextCoordinates);
          setLocationName(
            detectedLocationName
          );
          onChange?.(detectedLocationName);

          onLocationDetected?.(
            detectedLocationName,
            nextCoordinates
          );

          toast.success(
            onChange
              ? `Location detected: ${detectedLocationName}.`
              : `Showing events near ${detectedLocationName}.`
          );
        } catch (error) {
          toast.error(
            error instanceof Error
              ? error.message
              : "Unable to detect your city."
          );
        } finally {
          setIsDetecting(false);
        }
      },
      (error) => {
        setIsDetecting(false);

        if (
          error.code ===
          error.PERMISSION_DENIED
        ) {
          setHasDeniedLocationPermission(true);
        }

        toast.error(
          getGeolocationErrorMessage(
            error
          )
        );
      },
      geolocationOptions
    );
  };

  return (
    <section className="w-full overflow-hidden rounded-2xl border border-slate-200 bg-slate-50 p-4">
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div className="flex min-w-0 items-center gap-3">
          <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-blue-100 text-blue-600">
            <MapPin size={20} />
          </span>

          <div className="min-w-0">
            <p className="text-sm font-bold text-slate-900">
              {title}
            </p>

            <p className="mt-1 text-xs text-slate-500">
              {locationName
                ? `Detected location: ${locationName}`
                : description}
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={handleDetectLocation}
          disabled={isDetecting}
          className="inline-flex min-h-11 shrink-0 items-center justify-center gap-2 rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-bold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-70"
        >
          {isDetecting ? (
            <>
              <LoaderCircle
                size={17}
                className="animate-spin"
              />

              Detecting...
            </>
          ) : (
            <>
              <LocateFixed size={17} />
              Detect my location
            </>
          )}
        </button>
      </div>

      {onChange && (
        <div className="mt-4">
          <div className="relative">
            <MapPin
              size={18}
              className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"
            />

            <input
              id={inputId}
              name={inputName}
              type="text"
              value={value}
              onChange={handleManualLocationChange}
              placeholder={placeholder}
              required={required}
              disabled={disabled}
              className={[
                "h-12 w-full rounded-xl border bg-white pl-11 pr-4 text-sm outline-none transition-all duration-300",
                inputClassName ||
                  "border-slate-200 text-slate-900 placeholder:text-slate-400 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10",
              ]
                .filter(Boolean)
                .join(" ")}
            />
          </div>
        </div>
      )}

      {coordinates && (
        <p className="mt-3 text-xs text-slate-400">
          Latitude:{" "}
          {coordinates.latitude.toFixed(
            6
          )}
          {" · "}
          Longitude:{" "}
          {coordinates.longitude.toFixed(
            6
          )}
        </p>
      )}
    </section>
  );
}
