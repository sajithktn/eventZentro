"use client";

import type { ReactNode } from "react";
import { usePathname } from "next/navigation";

import Navbar from "@/components/common/Navbar";
import Footer from "@/components/common/Footer";

interface RootShellProps {
  children: ReactNode;
}

export default function RootShell({
  children,
}: RootShellProps) {
  const pathname = usePathname();

  const isAdminRoute =
    pathname === "/admin" ||
    pathname.startsWith("/admin/");

  if (isAdminRoute) {
    return <div className="min-h-screen">{children}</div>;
  }

  return (
    <div className="flex min-h-screen flex-col">
      <Navbar />

      <main className="flex-1">{children}</main>

      <Footer />
    </div>
  );
}