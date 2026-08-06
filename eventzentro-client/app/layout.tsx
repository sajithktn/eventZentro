import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "react-datepicker/dist/react-datepicker.css";
import "./globals.css";

import { Toaster } from "sonner";
import ReduxProvider from "@/redux/provider";
import RootShell from "@/components/common/RootShell";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

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
      <body
        className={`${geistSans.variable} ${geistMono.variable} min-h-screen antialiased`}
      >
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