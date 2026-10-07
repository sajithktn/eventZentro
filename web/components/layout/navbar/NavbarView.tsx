"use client";

import { LocationModal } from "./LocationModal";
import { NavbarHeader } from "./NavbarHeader";
import type { NavbarState } from "./useNavbarState";

interface NavbarViewProps {
  state: NavbarState;
}

export function NavbarView({ state }: NavbarViewProps) {
  return (
    <>
      <NavbarHeader state={state} />
      {state.isLocationOpen && <LocationModal state={state} />}
    </>
  );
}
