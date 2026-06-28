import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

// Comma-separated allowlist; first entry is the canonical production origin.
const ALLOWED_ORIGINS = (
	Deno.env.get("ALLOWED_ORIGIN") ??
	"https://yuuki-dev.vercel.app,http://localhost:5173"
).split(",").map((o: string) => o.trim());

// Only call with an allowlisted origin — the gate in the handler runs first.
function corsHeaders(origin: string) {
	return {
		"Access-Control-Allow-Origin": origin,
		"Access-Control-Allow-Methods": "GET, OPTIONS",
		"Access-Control-Allow-Headers": "authorization, content-type",
		"Vary": "Origin",
	};
}

// Timing-safe string comparison — always compares all bytes to prevent
// timing attacks that could leak the password character by character.
function timingSafeEqual(a: string, b: string): boolean {
	const enc = new TextEncoder();
	const aBuf = enc.encode(a);
	const bBuf = enc.encode(b);
	if (aBuf.byteLength !== bBuf.byteLength) {
		let mismatch = 1;
		for (let i = 0; i < aBuf.byteLength; i++) {
			mismatch |= aBuf[i] ^ (bBuf[i % bBuf.byteLength] ?? 0);
		}
		return mismatch === 0;
	}
	let mismatch = 0;
	for (let i = 0; i < aBuf.byteLength; i++) {
		mismatch |= aBuf[i] ^ bBuf[i];
	}
	return mismatch === 0;
}



const VALID_PERIODS: Record<string, number> = {
	"1d": 1,
	"7d": 7,
	"30d": 30,
	"90d": 90,
};

let _supabase: ReturnType<typeof createClient> | null = null;
function getSupabase() {
	return _supabase ??= createClient(
		Deno.env.get("SUPABASE_URL")!,
		Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
	);
}

Deno.serve(async (req) => {
	// Reject calls not coming from the portfolio (curl, other sites, missing
	// Origin) before anything else — preflights from foreign origins included.
	const origin = req.headers.get("origin");
	if (!origin || !ALLOWED_ORIGINS.includes(origin)) {
		return new Response("Forbidden", { status: 403 });
	}

	const cors = corsHeaders(origin);

	if (req.method === "OPTIONS") {
		return new Response("ok", { headers: cors });
	}
	if (req.method !== "GET") {
		return json({ error: "Method not allowed" }, 405, cors);
	}

	const ip = req.headers.get("x-forwarded-for")?.split(",")[0].trim() ?? "unknown";
	
	const supabase = getSupabase();

	// Check DB-backed rate limit
	const { data: isLocked } = await supabase.rpc("check_rate_limit", { client_ip: ip });
	if (isLocked) {
		return json({ error: "Too many failed attempts. Try again in 2 minutes." }, 429, cors);
	}

	// Auth: Bearer <password> checked against ANALYTICS_PASSWORD env var.
	const password = Deno.env.get("ANALYTICS_PASSWORD");
	if (!password) {
		console.error("ANALYTICS_PASSWORD not configured");
		return json({ error: "Internal error" }, 500, cors);
	}

	const authHeader = req.headers.get("authorization") ?? "";
	const token = authHeader.startsWith("Bearer ")
		? authHeader.slice(7)
		: "";
		
	if (!token || !timingSafeEqual(token, password)) {
		await supabase.rpc("record_failed_login", { client_ip: ip });
		return json({ error: "Unauthorized" }, 401, cors);
	}

	// Reset attempts on successful login
	await supabase.from("failed_logins").delete().eq("ip", ip);

	try {
		const url = new URL(req.url);
		const period = url.searchParams.get("period") ?? "7d";
		const days = VALID_PERIODS[period];
		if (!days) {
			return json({ error: "Invalid period. Use: 1d, 7d, 30d, 90d" }, 400, cors);
		}

		const since = new Date(Date.now() - days * 86_400_000).toISOString();
		const supabase = getSupabase();

		// Fire all RPC calls in parallel for speed.
		const [
			summaryRes,
			viewsByDayRes,
			viewsByHourRes,
			topPagesRes,
			topReferrersRes,
			devicesRes,
			browsersRes,
			countriesRes,
			recentRes,
		] = await Promise.all([
			supabase.rpc("analytics_summary", { since }),
			supabase.rpc("analytics_views_by_day", { since }),
			supabase.rpc("analytics_views_by_hour", { since }),
			supabase.rpc("analytics_top_pages", { since }),
			supabase.rpc("analytics_top_referrers", { since }),
			supabase.rpc("analytics_devices", { since }),
			supabase.rpc("analytics_browsers", { since }),
			supabase.rpc("analytics_countries", { since }),
			supabase.rpc("analytics_recent_visitors", { since }),
		]);

		// If any RPC errored, throw the first one.
		for (const res of [
			summaryRes,
			viewsByDayRes,
			viewsByHourRes,
			topPagesRes,
			topReferrersRes,
			devicesRes,
			browsersRes,
			countriesRes,
			recentRes,
		]) {
			if (res.error) throw new Error(res.error.message);
		}

		// analytics_summary returns a single row; extract it.
		const summary = Array.isArray(summaryRes.data)
			? summaryRes.data[0] ?? { total_views: 0, unique_visitors: 0 }
			: { total_views: 0, unique_visitors: 0 };

		return json({
			period,
			since,
			summary,
			views_by_day: viewsByDayRes.data,
			views_by_hour: viewsByHourRes.data,
			top_pages: topPagesRes.data,
			top_referrers: topReferrersRes.data,
			devices: devicesRes.data,
			browsers: browsersRes.data,
			countries: countriesRes.data,
			recent_visitors: recentRes.data,
		}, 200, cors);
	} catch (err) {
		console.error(err);
		return json({ error: "Internal error" }, 500, cors);
	}
});

function json(body: unknown, status: number, cors: Record<string, string>) {
	return new Response(JSON.stringify(body), {
		status,
		headers: { ...cors, "Content-Type": "application/json" },
	});
}
