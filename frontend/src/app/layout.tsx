import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { Toaster } from "sonner";

import StoreProvider from "@/store/provider";
import "./globals.css";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "RSVP Wedding App",
  description: "Manage your wedding RSVPs with ease",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${inter.className} antialiased`}>
        <StoreProvider>
          {children}
          <Toaster richColors position="top-right" />
        </StoreProvider>
      </body>
    </html>
  );
}
