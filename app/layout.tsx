import type { Metadata } from "next";
import Script from "next/script";
import "./globals.css";

export const metadata: Metadata = {
  title: "Build Your Truck | Diehl's Truck World",
  description: "Configure Isuzu, Freightliner, and Western Star commercial trucks around your application, payload, body, chassis, and upfit needs."
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body>
        {children}
        <Script
          type="module"
          src="https://unpkg.com/@google/model-viewer@4.1.0/dist/model-viewer.min.js"
          strategy="afterInteractive"
        />
      </body>
    </html>
  );
}
