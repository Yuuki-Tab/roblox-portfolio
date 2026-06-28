import { useEffect } from 'react';

const FUNCTIONS_URL = '/api';

export function usePageTracker() {
  useEffect(() => {
    // Don't track the analytics page itself or if user opted out
    if (window.location.pathname === '/analytics') return;
    if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') return;
    
    if (window.location.search.includes('admin=true')) {
      localStorage.setItem('ignore_analytics', 'true');
    }
    
    if (localStorage.getItem('ignore_analytics') === 'true') return;

    // 1. Initial page view
    const trackView = async () => {
      try {
        await fetch(`${FUNCTIONS_URL}/track`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            page: window.location.pathname,
            referrer: document.referrer || undefined,
            event_type: 'view'
          }),
          keepalive: true,
        });
      } catch {}
    };
    trackView();

    // Utility to send event
    const sendEvent = (type: string, data: Record<string, unknown>) => {
      // Use sendBeacon for unload events if possible, or fetch keepalive
      const payload = JSON.stringify({
        page: window.location.pathname,
        event_type: type,
        event_data: data
      });
      if (navigator.sendBeacon) {
        navigator.sendBeacon(`${FUNCTIONS_URL}/track`, new Blob([payload], { type: 'application/json' }));
      } else {
        fetch(`${FUNCTIONS_URL}/track`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: payload,
          keepalive: true,
        }).catch(() => {});
      }
    };

    // 2. Track outbound clicks
    const handleMouseUp = (e: MouseEvent) => {
      const target = (e.target as Element).closest('a');
      if (target && target.href && !target.href.startsWith(window.location.origin)) {
        sendEvent('click', { url: target.href, text: target.innerText || target.title || 'link' });
      }
    };
    document.addEventListener('mouseup', handleMouseUp);

    // 3. Track scroll depth
    let maxScroll = 0;
    const reportedDepths = new Set<number>();
    const handleScroll = () => {
      const scrollPercent = Math.round((window.scrollY + window.innerHeight) / document.documentElement.scrollHeight * 100);
      if (scrollPercent > maxScroll) maxScroll = scrollPercent;
      
      [25, 50, 75, 100].forEach(depth => {
        if (maxScroll >= depth && !reportedDepths.has(depth)) {
          reportedDepths.add(depth);
          sendEvent('scroll', { depth });
        }
      });
    };
    window.addEventListener('scroll', handleScroll, { passive: true });

    // 4. Track time on page
    const startTime = Date.now();
    const handleUnload = () => {
      const duration = Math.round((Date.now() - startTime) / 1000);
      sendEvent('leave', { duration });
    };
    window.addEventListener('pagehide', handleUnload);

    return () => {
      document.removeEventListener('mouseup', handleMouseUp);
      window.removeEventListener('scroll', handleScroll);
      window.removeEventListener('pagehide', handleUnload);
    };
  }, []);
}
