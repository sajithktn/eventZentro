"use client";

export const locationStorageKey = "eventzentro-selected-location";

export const locationChangeEvent = "eventzentro-location-change";

export const geolocationOptions: PositionOptions = {
    enableHighAccuracy: true,
    timeout: 10000,
    maximumAge: 0,
};

export const visibleOtherCityCount = 15;
