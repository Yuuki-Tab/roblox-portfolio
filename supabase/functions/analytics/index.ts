import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const ALLOWED_ORIGINS = (
	Deno.env.get("ALLOWED_ORIGIN") ??
	"https://yuuki-dev.vercel.app,http://localhost:5173"
).split(",").map((o: string) => o.trim());

function corsHeaders(origin: string) {
	return {
		"Access-Control-Allow-Origin": origin,
		"Access-Control-Allow-Methods": "GET, OPTIONS",
		"Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
	};
}

// Anti brute-force rate limit
const RATE_WINDOW_MS = 60_000;
const RATE_MAX_HITS = 5;
const rate = new Map<string, number[]>();

function isRateLimited(ip: string) {
	const now = Date.now();
	if (rate.size > 1000) {
		for (const [k, timestamps] of rate) {
			if (now - timestamps[timestamps.length - 1] >= RATE_WINDOW_MS) {
				rate.delete(k);
			}
		}
	}
	const hits = (rate.get(ip) ?? []).filter((t) => now - t < RATE_WINDOW_MS);
	if (hits.length >= RATE_MAX_HITS) {
		rate.set(ip, hits);
		return true;
	}
	hits.push(now);
	rate.set(ip, hits);
	return false;
}

let _supabase: ReturnType<typeof createClient> | null = null;
function getSupabase() {
	return _supabase ??= createClient(
		Deno.env.get("SUPABASE_URL")!,
		Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
	);
}

Deno.serve(async (req) => {
	const origin = req.headers.get("origin");
	if (origin && !ALLOWED_ORIGINS.includes(origin)) {
		return new Response("Forbidden", { status: 403 });
	}

	const cors = corsHeaders(origin || ALLOWED_ORIGINS[0]);

	if (req.method === "OPTIONS") {
		return new Response("ok", { headers: cors });
	}

	if (req.method !== "GET") {
		return new Response(JSON.stringify({ error: "Method not allowed" }), {
			status: 405,
			headers: { ...cors, "Content-Type": "application/json" }
		});
	}

	const authHeader = req.headers.get("authorization");
	if (!authHeader || !authHeader.startsWith("Bearer ")) {
		return new Response(JSON.stringify({ error: "Unauthorized" }), {
			status: 401,
			headers: { ...cors, "Content-Type": "application/json" }
		});
	}

	const ip = req.headers.get("x-forwarded-for")?.split(",")[0].trim() ?? "unknown";
	if (isRateLimited(ip)) {
		return new Response(JSON.stringify({ error: "Too many requests" }), {
			status: 429,
			headers: { ...cors, "Content-Type": "application/json" }
		});
	}

	const token = authHeader.substring(7);
	const expectedPassword = Deno.env.get("ANALYTICS_PASSWORD");
	
	if (!expectedPassword || token !== expectedPassword) {
		return new Response(JSON.stringify({ error: "Unauthorized" }), {
			status: 401,
			headers: { ...cors, "Content-Type": "application/json" }
		});
	}

	try {
		const url = new URL(req.url);
		const period = url.searchParams.get("period") || "7d";
		let hours = 24 * 7;
		if (period === "1d") hours = 24;
		if (period === "30d") hours = 24 * 30;
		if (period === "90d") hours = 24 * 90;

		const supabase = getSupabase();
		const since = new Date(Date.now() - hours * 60 * 60 * 1000).toISOString();

		const [summary, viewsByDay, viewsByHour, pages, referrers, devices, browsers, countries, recent, os, clicks, timeOnPage] = await Promise.all([
			supabase.rpc("analytics_summary", { since }),
			supabase.rpc("analytics_views_by_day", { since }),
			supabase.rpc("analytics_views_by_hour", { since }),
			supabase.rpc("analytics_top_pages", { since, lim: 10 }),
			supabase.rpc("analytics_top_referrers", { since, lim: 10 }),
			supabase.rpc("analytics_devices", { since }),
			supabase.rpc("analytics_browsers", { since, lim: 10 }),
			supabase.rpc("analytics_countries", { since, lim: 10 }),
			supabase.rpc("analytics_recent_visitors", { since, lim: 50 }),
			supabase.rpc("analytics_os", { since, lim: 10 }),
			supabase.rpc("analytics_outbound_clicks", { since, lim: 10 }),
			supabase.rpc("analytics_avg_time_on_page", { since, lim: 10 }),
		]);

		return new Response(JSON.stringify({
			summary: summary.data?.[0] || { total_views: 0, unique_visitors: 0 },
			views_by_day: viewsByDay.data || [],
			views_by_hour: viewsByHour.data || [],
			top_pages: pages.data || [],
			top_referrers: referrers.data || [],
			devices: devices.data || [],
			browsers: browsers.data || [],
			countries: countries.data || [],
			recent_visitors: recent.data || [],
			os: os.data || [],
			outbound_clicks: clicks.data || [],
			avg_time_on_page: timeOnPage.data || [],
		}), {
			status: 200,
			headers: { ...cors, "Content-Type": "application/json" }
		});
	} catch (err) {
		console.error(err);
		return new Response(JSON.stringify({ error: "Internal error" }), {
			status: 500,
			headers: { ...cors, "Content-Type": "application/json" }
		});
	}
});
