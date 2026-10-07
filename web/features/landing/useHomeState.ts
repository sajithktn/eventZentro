"use client";

import { useEffect, useState } from "react";
import api from "@/lib/axios";
import { getAllEvents } from "@/services/event.service";
import { getPublicFeaturedEvents } from "@/services/featuredEvent.service";
import type { Event } from "@/types/event";
import { Category } from "./types";

export function useHomeState() {
  const [events, setEvents] = useState<Event[]>([]);

  const [featuredEvents, setFeaturedEvents] = useState<Event[]>([]);

  const [categories, setCategories] = useState<Category[]>([]);

  const [loadingEvents, setLoadingEvents] = useState(true);

  const [loadingCategories, setLoadingCategories,] = useState(true);

  const [searchText, setSearchText] = useState("");

  useEffect(() => {
      const fetchEvents = async () => {
          try {
              const response = await getAllEvents({
                  page: 1,
                  limit: 3,
                  sort: "price-high",
              });
              setEvents(response.data ||
                  response.events ||
                  []);
          }
          catch {
              setEvents([]);
          }
          finally {
              setLoadingEvents(false);
          }
      };
      void fetchEvents();
  }, []);

  useEffect(() => {
      const fetchFeaturedEvents = async () => {
          try {
              const response = await getPublicFeaturedEvents();
              setFeaturedEvents(response.data ||
                  response.events ||
                  []);
          }
          catch {
              setFeaturedEvents([]);
          }
      };
      void fetchFeaturedEvents();
  }, []);

  useEffect(() => {
      const fetchCategories = async () => {
          try {
              const response = await api.get("/categories");
              const result = response.data?.data ??
                  response.data?.categories ??
                  response.data;
              setCategories(Array.isArray(result)
                  ? result
                  : []);
          }
          catch {
              setCategories([]);
          }
          finally {
              setLoadingCategories(false);
          }
      };
      void fetchCategories();
  }, []);

  const popularEvents = events;

  const heroFeaturedEvent = featuredEvents[0];

  const secondFeaturedEvent = featuredEvents[1];

  const thirdFeaturedEvent = featuredEvents[2];

  const searchHref = searchText.trim()
      ? `/events?search=${encodeURIComponent(searchText.trim())}`
      : "/events";

  return {
    categories,
    heroFeaturedEvent,
    loadingCategories,
    loadingEvents,
    popularEvents,
    searchHref,
    searchText,
    secondFeaturedEvent,
    setSearchText,
    thirdFeaturedEvent,
  };
}

export type HomeState = ReturnType<typeof useHomeState>;
