import type { Metadata } from "next";
import "./globals.css";
import { ThemeProvider } from "@/components/theme-provider";
import { Navbar } from "@/components/ui/navbar";

// Using system fonts as fallback when Google Fonts are unavailable
const fontVariables = "--font-geist-sans --font-geist-mono";

export const metadata: Metadata = {
  title: "Hustle Tools",
  description: "A collection of tools to streamline your workflow.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className="antialiased overflow-x-hidden"
      >
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          <Navbar />
          <main>{children}</main>
        </ThemeProvider>
      </body>
    </html>
  );
}
