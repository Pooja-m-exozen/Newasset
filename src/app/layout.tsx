import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { AuthProvider } from "@/contexts/AuthContext";
import { UserManagementProvider } from "@/contexts/UserManagementContext";
import { DigitalAssetsProvider } from "@/contexts/DigitalAssetsContext";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "FacilioTrack - Facility Management Platform",
  description: "Comprehensive facility management platform for smart asset tracking and maintenance",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <AuthProvider>
          <UserManagementProvider>
            <DigitalAssetsProvider>
              {children}
            </DigitalAssetsProvider>
          </UserManagementProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
