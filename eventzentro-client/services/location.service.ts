export interface ReverseGeocodeCoordinates {
  latitude: number;
  longitude: number;
}

export interface DetectedLocation {
  city: string;
  state: string;
  country: string;
  latitude: number;
  longitude: number;
}

interface ReverseGeocodeProviderResponse {
  city?: string;
  locality?: string;
  principalSubdivision?: string;
  countryName?: string;
  countryCode?: string;
}

const validateCoordinates = ({
  latitude,
  longitude,
}: ReverseGeocodeCoordinates) => {
  const hasValidLatitude =
    Number.isFinite(latitude) &&
    latitude >= -90 &&
    latitude <= 90;

  const hasValidLongitude =
    Number.isFinite(longitude) &&
    longitude >= -180 &&
    longitude <= 180;

  if (!hasValidLatitude || !hasValidLongitude) {
    throw new Error(
      "Invalid location coordinates received."
    );
  }
};

export const reverseGeocodeCoordinates = async ({
  latitude,
  longitude,
}: ReverseGeocodeCoordinates): Promise<DetectedLocation> => {
  validateCoordinates({
    latitude,
    longitude,
  });

  const url = new URL(
    "https://api.bigdatacloud.net/data/reverse-geocode-client"
  );

  url.searchParams.set(
    "latitude",
    latitude.toString()
  );
  url.searchParams.set(
    "longitude",
    longitude.toString()
  );
  url.searchParams.set("localityLanguage", "en");

  const response = await fetch(url.toString(), {
    method: "GET",
    headers: {
      Accept: "application/json",
    },
    cache: "no-store",
  });

  if (!response.ok) {
    throw new Error(
      "Unable to identify your city. Please select it manually."
    );
  }

  const data =
    (await response.json()) as ReverseGeocodeProviderResponse;

  const city =
    data.city?.trim() || data.locality?.trim();

  if (!city) {
    throw new Error(
      "Unable to identify your city from the detected location."
    );
  }

  return {
    city,
    state: data.principalSubdivision?.trim() || "",
    country: data.countryName?.trim() || "",
    latitude,
    longitude,
  };
};
