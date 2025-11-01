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
      className={`fixed bottom-0 left-0 right-0 z-[9998] pointer-events-none ${
        mobileOnly ? 'md:hidden' : ''
      }`}
      style={{
        paddingBottom: '10px', // 10px from bottom edge
        paddingLeft: '10px',
        paddingRight: '10px',
      }}
    >
      <div className="flex items-end justify-between max-w-screen-xl mx-auto">
        {/* Left: Hustle Together nav button (injected by Navbar component) */}
        <div id="bottom-nav-left" className="pointer-events-auto" />

        {/* Right: Page-specific actions (optional) */}
        {pageActions && (
          <div className="pointer-events-auto">{pageActions}</div>
        )}
      </div>
    </div>
  );
}
