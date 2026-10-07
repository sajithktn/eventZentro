"use client";

import { HomeView } from "./HomeView";
import { useHomeState } from "./useHomeState";

export default function Home() {
  return <HomeView state={useHomeState()} />;
}
