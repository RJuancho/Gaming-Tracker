import type { Metadata, Viewport } from "next";

import { ToastProvider } from "./toast-provider";

import "./globals.css";

export const metadata: Metadata = {
  title: "Gaming Tracker",
  description:
    "A personal gaming tracker and meta analytics workspace for TFT and Pokémon Champions.",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  themeColor: "#020617",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className="h-full antialiased">
      <body className="min-h-full flex flex-col">
        {children}
        <ToastProvider />
      </body>
    </html>
  );
}
