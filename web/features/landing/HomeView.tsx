"use client";

import { HomeCategories } from "./HomeCategories";
import { HomeEventsSection } from "./HomeEventsSection";
import { HomeHero } from "./HomeHero";
import { HomeStyles } from "./HomeStyles";
import type { HomeState } from "./useHomeState";

interface HomeViewProps {
  state: HomeState;
}

export function HomeView({ state }: HomeViewProps) {
  return (
    <main className="min-h-screen overflow-hidden bg-[#08070d] text-white">
      <HomeHero state={state} />
      <HomeCategories state={state} />
      <HomeEventsSection state={state} />
      <HomeStyles />
    </main>
  );
}
