import type { Metadata } from "next";
import Script from "next/script";
import "./globals.css";
import { ThemeProvider } from "@/components/theme-provider";
import { BrandingProvider } from "@/contexts/BrandingContext";
import { Navbar } from "@/components/ui/navbar";
import { ReactScan } from "./react-scan";

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
      <head>
      </head>
      <body
        className="antialiased overflow-x-hidden"
      >
        {process.env.NODE_ENV === 'development' && (
          <>
            <Script
              src="https://unpkg.com/react-grab@latest/dist/index.global.js"
              strategy="beforeInteractive"
              data-enabled="true"
            />
            <Script
              id="react-grab-config"
              strategy="afterInteractive"
              dangerouslySetInnerHTML={{
                __html: `
                  // Enhanced react-grab: Use Option/Alt+Click as alternative
                  if (typeof window !== 'undefined') {
                    window.addEventListener('load', function() {
                      console.log('🎯 React Grab: Alternative shortcut enabled (Option+Click)');
                      
                      let isAltHeld = false;
                      
                      // Add alternative shortcut: Option/Alt + Click
                      document.addEventListener('keydown', function(e) {
                        if (e.altKey) {
                          isAltHeld = true;
                          document.body.style.cursor = 'crosshair';
                        }
                      }, true);
                      
                      document.addEventListener('keyup', function(e) {
                        if (e.key === 'Alt') {
                          isAltHeld = false;
                          document.body.style.cursor = '';
                        }
                      }, true);
                      
                      document.addEventListener('click', function(e) {
                        if (isAltHeld) {
                          e.preventDefault();
                          e.stopPropagation();
                          
                          const target = e.target;
                          if (target && target.closest) {
                            // Find the nearest component with meaningful content
                            const component = target.closest('[class*="component"], [class*="widget"], div, button, a, section, article, header, footer, nav, aside');
                            if (component) {
                              const html = component.outerHTML;
                              navigator.clipboard.writeText(html).then(() => {
                                console.log('✅ Copied element:', component.tagName, component.className);
                                // Visual feedback
                                const originalBorder = component.style.border;
                                component.style.border = '2px solid #00ff00';
                                component.style.transition = 'border 0.3s';
                                setTimeout(() => {
                                  component.style.border = originalBorder;
                                }, 500);
                              });
                            }
                          }
                        }
                      }, true);
                      
                      window.addEventListener('blur', function() {
                        isAltHeld = false;
                        document.body.style.cursor = '';
                      });
                    });
                  }
                `
              }}
            />
          </>
        )}
        {/* React Scan disabled */}
        {/* {process.env.NODE_ENV === 'development' && <ReactScan />} */}
        <BrandingProvider>
          <ThemeProvider
            attribute="class"
            defaultTheme="system"
            enableSystem
            disableTransitionOnChange
          >
            {/* Extensible Navbar - Traditional mode for most pages, Floating mode for Elementor/DocChat */}
            <Navbar
              traditionalOnPaths={['/elementor-editor', '/chat-doc', '/branding-settings']}
              hideMobileOnPaths={['/chat-doc']}
              hideButtonOnMobileForPaths={['/elementor-editor']}
            />

            <main>{children}</main>
          </ThemeProvider>
        </BrandingProvider>
      </body>
    </html>
  );
}
