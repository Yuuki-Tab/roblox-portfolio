const TRACK_URL = "https://zlrskorrqwxsobkviwfc.supabase.co/functions/v1/track";
const ANALYTICS_URL = "https://zlrskorrqwxsobkviwfc.supabase.co/functions/v1/analytics";
const ORIGIN = "https://yuuki-dev.vercel.app";

const testCases = [
  // User 1 on Desktop Chrome
  { ip: "8.8.8.8", ua: "Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/120.0.0.0 Safari/537.36", payload: { page: "/", referrer: "https://twitter.com/roblox", country: "US" } },
  { ip: "8.8.8.8", ua: "Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/120.0.0.0 Safari/537.36", payload: { page: "/", event_type: "click", event_data: { url: "https://streamable.com/8du1mn" }, country: "US" } },
  // User 2 on Mobile Safari
  { ip: "1.1.1.1", ua: "Mozilla/5.0 (iPhone; CPU iPhone OS 16_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/16.5 Mobile/15E148 Safari/604.1", payload: { page: "/", referrer: "https://discord.com/", country: "IT" } },
];

async function run() {
  console.log("🚀 Starting Tracking Tests...");
  for (const t of testCases) {
    console.log(`Sending ${t.payload.event_type || 'view'} from IP ${t.ip}`);
    const res = await fetch(TRACK_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Origin": ORIGIN,
        "x-forwarded-for": t.ip,
        "user-agent": t.ua,
        "x-vercel-ip-country": t.payload.country,
      },
      body: JSON.stringify(t.payload),
    });
    console.log(`Response: ${res.status} ${res.statusText}`);
  }

  console.log("\n📊 Fetching Analytics Data...");
  const pwd = process.env.ANALYTICS_PASSWORD || "admin123"; // Adjust if needed
  const res = await fetch(ANALYTICS_URL + "?period=7d", {
    headers: {
      "Origin": ORIGIN,
      "Authorization": `Bearer ${pwd}`
    }
  });
  
  if (res.ok) {
    const data = await res.json();
    console.log("Summary:", data.summary);
    console.log("Top Pages:", data.top_pages);
    console.log("Top Referrers:", data.top_referrers);
    console.log("Countries:", data.countries);
    console.log("Recent Visitors:", data.recent_visitors.length);
  } else {
    console.error("Failed to fetch analytics:", res.status, await res.text());
  }
}

run();
