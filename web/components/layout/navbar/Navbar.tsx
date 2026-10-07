"use client";

import { NavbarView } from "./NavbarView";
import { useNavbarState } from "./useNavbarState";

export default function Navbar() {
  return <NavbarView state={useNavbarState()} />;
}
