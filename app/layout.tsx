import type { Metadata } from "next";
import { Plus_Jakarta_Sans, Young_Serif } from "next/font/google";
import "./globals.css";
import { Providers } from "@/app/providers";
import Navbar from "@/components/Navbar";
import { Toaster } from "@/components/ui/sonner";

const jakarta = Plus_Jakarta_Sans({
  subsets: ["latin"],
  variable: "--font-jakarta",
});

const youngSerif = Young_Serif({
  subsets: ["latin"],
  weight: "400",
  variable: "--font-young",
});

export const metadata: Metadata = {
  title: "ServeFlow | Church Service Scheduling",
  description: "Sophisticated task scheduling and coordination for church services.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${jakarta.variable} ${youngSerif.variable} dark`}>
      <body className="font-sans antialiased selection:bg-amber-500/30 selection:text-white bg-background text-white">
        <Providers>
          {/* Main Content Layer */}
          <div className="min-h-screen flex flex-col">
            <Navbar />
            <main className="flex-1">
              {children}
            </main>
          </div>
          <Toaster position="top-center" theme="dark" />
        </Providers>
      </body>
    </html>
  );
}
