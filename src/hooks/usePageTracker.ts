import { useEffect } from 'react';

const FUNCTIONS_URL = 'https://zlrskorrqwxsobkviwfc.supabase.co/functions/v1';

export function usePageTracker() {
  useEffect(() => {
    // Don't track the analytics page itself
    if (window.location.pathname === '/analytics') return;

    const track = async () => {
      try {
        await fetch(`${FUNCTIONS_URL}/track`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            page: window.location.pathname,
            referrer: document.referrer || undefined,
          }),
          keepalive: true,
        });
      } catch {
        // silently fail
      }
    };
    track();
  }, []);
}
