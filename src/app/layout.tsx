import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { AuthProvider } from "@/contexts/AuthContext";
import { UserManagementProvider } from "@/contexts/UserManagementContext";
import { DigitalAssetsProvider } from "@/contexts/DigitalAssetsContext";
import { ThemeProvider } from "@/contexts/ThemeContext";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Exozen - Asset Management System",
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
        <ThemeProvider>
          <AuthProvider>
            <UserManagementProvider>
              <DigitalAssetsProvider>
                {children}
              </DigitalAssetsProvider>
            </UserManagementProvider>
          </AuthProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
