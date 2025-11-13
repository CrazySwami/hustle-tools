import type { Metadata } from "next";
import Script from "next/script";
import "./globals.css";
import { ThemeProvider } from "@/components/theme-provider";
import { BrandingProvider } from "@/contexts/BrandingContext";
import { Navbar } from "@/components/ui/navbar";
import { ReactScan } from "./react-scan";

// Using system fonts as fallback when Google Fonts are unavailable
const fontVariables = "--font-geist-sans --font-geist-mono";

// Dynamic metadata that uses branding settings
export async function generateMetadata(): Promise<Metadata> {
  let companyName = "Mirror Factory";

  try {
    // Fetch branding settings from API
    const response = await fetch(`${process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'}/api/branding`, {
      cache: 'no-store'
    });

    if (response.ok) {
      const branding = await response.json();
      if (branding?.company_name) {
        companyName = branding.company_name;
      }
    }
  } catch (error) {
    // Fall back to default if API fails
    console.log('Using default branding for metadata');
  }

  return {
    title: `${companyName} | Workstation`,
    description: "Multiply your expertise across every project with AI agents trained on your work.",
  };
}

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
