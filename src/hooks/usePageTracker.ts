import { useEffect, useRef } from 'react';
import { useLocation } from 'react-router-dom';

const FUNCTIONS_URL = '/api';

async function getCountry() {
  try {
    const cached = sessionStorage.getItem('analytics_country');
    if (cached) return cached;
    
    // Fallback client-side geolocation (Vercel edge functions might not forward x-vercel-ip-country on rewrites)
    const res = await fetch('https://get.geojs.io/v1/ip/country.json');
    if (!res.ok) return null;
    const data = await res.json();
    const country = data.country;
    if (country) sessionStorage.setItem('analytics_country', country);
    return country;
  } catch {
    return null;
  }
}

export function usePageTracker() {
  const location = useLocation();
  const trackedRef = useRef(new Set<string>());
  const maxScrollRef = useRef(0);
  const startTimeRef = useRef(Date.now());
  const pathRef = useRef(location.pathname);

  useEffect(() => {
    const pagePath = location.pathname;
    pathRef.current = pagePath;
    startTimeRef.current = Date.now();
    maxScrollRef.current = 0;

    if (trackedRef.current.has(pagePath)) return;
    trackedRef.current.add(pagePath);

    getCountry().then(country => {
      fetch(`${FUNCTIONS_URL}/track`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          page: pagePath,
          referrer: document.referrer || null,
          event_type: 'view',
          country: country || undefined,
        }),
      }).catch(console.error);
    });

    const handleScroll = () => {
      const scrollY = window.scrollY;
      const height = document.documentElement.scrollHeight - window.innerHeight;
      if (height <= 0) return;

      const pct = Math.round((scrollY / height) * 100);
      const thresholds = [25, 50, 75, 90];
      
      thresholds.forEach((t) => {
        if (pct >= t && maxScrollRef.current < t) {
          maxScrollRef.current = t;
          getCountry().then(country => {
            fetch(`${FUNCTIONS_URL}/track`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                page: pagePath,
                event_type: 'scroll',
                event_data: { depth: t },
                country: country || undefined,
              }),
            }).catch(console.error);
          });
        }
      });
    };

    const handleClick = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      const a = target.closest('a');
      if (!a) return;
      
      const href = a.getAttribute('href');
      if (href && href.startsWith('http') && !href.includes(window.location.host)) {
        getCountry().then(country => {
          fetch(`${FUNCTIONS_URL}/track`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              page: pagePath,
              event_type: 'click',
              event_data: { url: href, text: a.innerText.slice(0, 100) },
              country: country || undefined,
            }),
          }).catch(console.error);
        });
      }
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    document.addEventListener('click', handleClick);

    return () => {
      window.removeEventListener('scroll', handleScroll);
      document.removeEventListener('click', handleClick);
      
      const durationSeconds = Math.round((Date.now() - startTimeRef.current) / 1000);
      if (durationSeconds > 2) {
        getCountry().then(country => {
          const payload = JSON.stringify({
            page: pagePath,
            event_type: 'leave',
            event_data: { duration: durationSeconds },
            country: country || undefined,
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
        });
      }
    };
  }, [location.pathname]);
}
