"use client";

export const getCityKey = (city: string) => city.trim().toLowerCase();

export const sortCities = (cities: string[]) => [...cities].sort((firstCity, secondCity) => firstCity.localeCompare(secondCity));

export const dedupeCities = (cities: string[]) => {
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
