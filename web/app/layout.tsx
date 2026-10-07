import type { Metadata } from "next";
import "react-datepicker/dist/react-datepicker.css";
import "./globals.css";

import { Toaster } from "sonner";
import ReduxProvider from "@/store/provider";
import RootShell from "@/components/layout/RootShell";

export const metadata: Metadata = {
  title: {
    default: "EventZentro",
    template: "%s | EventZentro",
  },
  description:
    "Discover exciting events, book tickets, and create unforgettable experiences with EventZentro.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="min-h-screen antialiased">
        <ReduxProvider>
          <RootShell>{children}</RootShell>

          <Toaster
            position="top-right"
            richColors
            closeButton
            theme="dark"
          />
        </ReduxProvider>
      </body>
    </html>
  );
}
