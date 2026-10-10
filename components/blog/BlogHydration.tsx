'use client';

import { useEffect } from 'react';

/** Blog React migration bridge: prefetch list metadata once per session. */
export default function BlogHydration(): null {
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const key = 'pa-blog-hydrated';
    if (sessionStorage.getItem(key)) return;
    fetch('/api/blog-posts', { credentials: 'same-origin' })
      .then(() => sessionStorage.setItem(key, '1'))
      .catch(() => {});
  }, []);
  return null;
}
