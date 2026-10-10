'use client';

import { useEffect } from 'react';

/**
 * Settings React migration hook: warms session data without LegacyBoot re-fetch churn.
 * Full Settings UI remains in client/modules until page-by-page cutover completes.
 */
export default function SettingsHydration(): null {
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const key = 'pa-settings-hydrated';
    if (sessionStorage.getItem(key)) return;
    fetch('/api/bootstrap', { credentials: 'same-origin' })
      .then(() => sessionStorage.setItem(key, '1'))
      .catch(() => {});
  }, []);
  return null;
}
