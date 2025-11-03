'use client';

import { useEffect } from 'react';

export function ReactScan() {
  useEffect(() => {
    if (process.env.NODE_ENV === 'development') {
      import('react-scan').then(({ scan }) => {
        scan({
          enabled: true,
          log: true, // logs render info to console
          // Additional options:
          // showToolbar: true, // shows floating toolbar
          // alwaysShowLabels: false, // always show component labels
        });
      });
    }
  }, []);

  return null;
}

