'use client';

import { ReactNode } from 'react';

interface BottomNavProps {
  /** Optional page-specific actions (shows on bottom-right when mobile) */
  pageActions?: ReactNode;
  /** Show on mobile only (default: true) */
  mobileOnly?: boolean;
}

export function BottomNav({ pageActions, mobileOnly = true }: BottomNavProps) {
  return (
    <div
      className={`fixed bottom-0 left-0 right-0 pointer-events-none ${
        mobileOnly ? 'md:hidden' : ''
      }`}
      style={{
        paddingBottom: '58px', // 48px chat handle height + 10px spacing
        paddingLeft: '10px',
        paddingRight: '10px',
        zIndex: 3250, // Above chat drawer handle (3200) so buttons are visible
      }}
    >
      <div className="flex items-center justify-between max-w-screen-xl mx-auto">
        {/* Left: Hustle Tools nav button (injected by Navbar component) */}
        <div id="bottom-nav-left" className="pointer-events-auto flex items-center" />

        {/* Right: Page-specific actions (can be injected via portal OR passed as prop) */}
        <div id="bottom-nav-right" className="pointer-events-auto flex items-center">
          {pageActions}
        </div>
      </div>
    </div>
  );
}
