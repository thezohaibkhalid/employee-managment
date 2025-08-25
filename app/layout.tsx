import type React from "react";
import type { Metadata } from "next";
import { GeistSans } from "geist/font/sans";
import { GeistMono } from "geist/font/mono";
import { MainLayout } from "../components/layout/main-layout";
import "./globals.css";

export const metadata: Metadata = {
  title: "Manufacturing Management System",
  description:
    "Complete manufacturing management system for production, employees, and salary calculations",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${GeistSans.variable} ${GeistMono.variable}`}>
      <body className="font-sans">
        <MainLayout>{children}</MainLayout>
      </body>
    </html>
  );
}
