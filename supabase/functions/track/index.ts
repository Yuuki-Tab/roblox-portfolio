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
		"Access-Control-Allow-Methods": "POST, OPTIONS",
		"Access-Control-Allow-Headers": "content-type",
		"Vary": "Origin",
	};
}

// Absolute cap on raw body bytes read — enforced on the actual stream,
// not on the Content-Length header (which is an untrusted hint).
const MAX_BODY_BYTES = 2_048;

// Read at most maxBytes from a ReadableStream<Uint8Array>.
// Returns null if the stream exceeds the limit — caller must 413.
async function readBodyCapped(
	body: ReadableStream<Uint8Array>,
	maxBytes: number,
): Promise<Uint8Array | null> {
	const reader = body.getReader();
	const chunks: Uint8Array[] = [];
	let total = 0;
	try {
		while (true) {
			const { done, value } = await reader.read();
			if (done) break;
			total += value.byteLength;
			if (total > maxBytes) return null;
			chunks.push(value);
		}
	} finally {
		reader.releaseLock();
	}
	const out = new Uint8Array(total);
	let offset = 0;
	for (const chunk of chunks) {
		out.set(chunk, offset);
		offset += chunk.byteLength;
	}
	return out;
}

// Privacy-first visitor ID: SHA-256(ip + userAgent + YYYY-MM-DD).
// Rotates daily so cross-day tracking is impossible; no raw IP stored.
async function makeVisitorId(ip: string, ua: string): Promise<string> {
	const date = new Date().toISOString().slice(0, 10); // YYYY-MM-DD
	const data = new TextEncoder().encode(ip + ua + date);
	const hash = await crypto.subtle.digest("SHA-256", data);
	return Array.from(new Uint8Array(hash))
		.map((b) => b.toString(16).padStart(2, "0"))
		.join("");
}

// Simple UA parsing — order matters (Edge before Chrome, Chrome before Safari).
function parseBrowser(ua: string): string | null {
	if (/Edg(?:e|A|iOS)?\//.test(ua)) return "Edge";
	if (/OPR\/|Opera\//.test(ua)) return "Opera";
	if (/SamsungBrowser\//.test(ua)) return "Samsung";
	if (/Firefox\//.test(ua)) return "Firefox";
	if (/Chrome\//.test(ua)) return "Chrome";
	if (/Safari\//.test(ua)) return "Safari";
	return null;
}

function parseDeviceType(ua: string): "mobile" | "tablet" | "desktop" {
	if (/Tablet|iPad/i.test(ua)) return "tablet";
	if (/Mobile|Android.*Mobile|iPhone/i.test(ua)) return "mobile";
	return "desktop";
}

function extractDomain(raw: string | undefined | null): string | null {
	if (!raw) return null;
	try {
		return new URL(raw).hostname || null;
	} catch {
		return null;
	}
}

// In-memory rate limit: max 60 hits per visitor_id per hour.
// NOTE: isolate-local — not shared across edge regions, so this is a
// best-effort first line of defence.
const RATE_WINDOW_MS = 3_600_000;
const RATE_MAX_HITS = 60;

const rate = new Map<string, number[]>();
function isRateLimited(key: string): boolean {
	const now = Date.now();
	// Prune stale entries so the map can't grow unbounded.
	if (rate.size > 1000) {
		for (const [k, timestamps] of rate) {
			if (now - timestamps[timestamps.length - 1] >= RATE_WINDOW_MS) {
				rate.delete(k);
			}
		}
	}
	const hits = (rate.get(key) ?? []).filter((t) => now - t < RATE_WINDOW_MS);
	if (hits.length >= RATE_MAX_HITS) {
		rate.set(key, hits);
		return true;
	}
	hits.push(now);
	rate.set(key, hits);
	return false;
}

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
	if (req.method !== "POST") {
		return json({ error: "Method not allowed" }, 405, cors);
	}
	if (!req.headers.get("content-type")?.includes("application/json")) {
		return json({ error: "Unsupported content type" }, 415, cors);
	}

	// Read the actual stream — Content-Length is an untrusted hint.
	if (!req.body) {
		return json({ error: "Empty body" }, 400, cors);
	}
	const raw = await readBodyCapped(req.body, MAX_BODY_BYTES);
	if (raw === null) {
		return json({ error: "Payload too large" }, 413, cors);
	}

	try {
		const { page, referrer } = JSON.parse(
			new TextDecoder().decode(raw),
		);

		const pagePath = String(page ?? "/").trim().slice(0, 500) || "/";
		const referrerDomain = extractDomain(referrer);

		const ip =
			req.headers.get("x-forwarded-for")?.split(",")[0].trim() ?? "unknown";
		const ua = req.headers.get("user-agent") ?? "";

		const visitorId = await makeVisitorId(ip, ua);

		if (isRateLimited(visitorId)) {
			return new Response(null, { status: 429, headers: cors });
		}

		const deviceType = parseDeviceType(ua);
		const browser = parseBrowser(ua);
		const country = (
			req.headers.get("cf-ipcountry") ??
			req.headers.get("x-vercel-ip-country") ??
			null
		);

		const supabase = getSupabase();

		const { error: dbError } = await supabase
			.from("page_views")
			.insert({
				visitor_id: visitorId,
				page_path: pagePath,
				referrer: referrerDomain,
				device_type: deviceType,
				browser,
				country: country?.slice(0, 2) ?? null,
			});

		if (dbError) {
			throw new Error(dbError.message);
		}

		return new Response(null, { status: 204, headers: cors });
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
