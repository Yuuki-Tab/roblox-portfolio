import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const ALLOWED_ORIGINS = (Deno.env.get("ALLOWED_ORIGIN") ?? "https://yuuki-dev.vercel.app,http://localhost:5173").split(",").map((o: string) => o.trim());

function corsHeaders(origin: string) {
	return { "Access-Control-Allow-Origin": origin, "Access-Control-Allow-Methods": "POST, OPTIONS", "Access-Control-Allow-Headers": "content-type", "Vary": "Origin" };
}

async function readBodyCapped(body: ReadableStream<Uint8Array>, maxBytes: number): Promise<Uint8Array | null> {
	const reader = body.getReader(); const chunks: Uint8Array[] = []; let total = 0;
	try { while (true) { const { done, value } = await reader.read(); if (done) break; total += value.byteLength; if (total > maxBytes) return null; chunks.push(value); } } finally { reader.releaseLock(); }
	const out = new Uint8Array(total); let offset = 0; for (const chunk of chunks) { out.set(chunk, offset); offset += chunk.byteLength; } return out;
}

async function makeVisitorId(ip: string, ua: string): Promise<string> {
	const date = new Date().toISOString().slice(0, 10); const data = new TextEncoder().encode(ip + ua + date);
	const hash = await crypto.subtle.digest("SHA-256", data); return Array.from(new Uint8Array(hash)).map((b) => b.toString(16).padStart(2, "0")).join("");
}

function parseBrowser(ua: string) { if (/Edg(?:e|A|iOS)?\//.test(ua)) return "Edge"; if (/OPR\/|Opera\//.test(ua)) return "Opera"; if (/SamsungBrowser\//.test(ua)) return "Samsung"; if (/Firefox\//.test(ua)) return "Firefox"; if (/Chrome\//.test(ua)) return "Chrome"; if (/Safari\//.test(ua)) return "Safari"; return null; }
function parseOS(ua: string) { if (/Windows/i.test(ua)) return "Windows"; if (/Mac OS X/i.test(ua)) return "macOS"; if (/Android/i.test(ua)) return "Android"; if (/Linux/i.test(ua)) return "Linux"; if (/iPhone|iPad|iPod/i.test(ua)) return "iOS"; return null; }
function parseDeviceType(ua: string) { if (/Tablet|iPad/i.test(ua)) return "tablet"; if (/Mobile|Android.*Mobile|iPhone/i.test(ua)) return "mobile"; return "desktop"; }
function extractDomain(raw: string | undefined | null) { if (!raw) return null; try { return new URL(raw).hostname || null; } catch { return null; } }

const RATE_WINDOW_MS = 3_600_000;
const RATE_MAX_HITS = 60;
const rate = new Map<string, number[]>();
function isRateLimited(key: string) {
	const now = Date.now();
	if (rate.size > 1000) { for (const [k, timestamps] of rate) { if (now - timestamps[timestamps.length - 1] >= RATE_WINDOW_MS) rate.delete(k); } }
	const hits = (rate.get(key) ?? []).filter((t) => now - t < RATE_WINDOW_MS);
	if (hits.length >= RATE_MAX_HITS) { rate.set(key, hits); return true; }
	hits.push(now); rate.set(key, hits); return false;
}

let _supabase: ReturnType<typeof createClient> | null = null;
function getSupabase() { return _supabase ??= createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!); }

Deno.serve(async (req) => {
	const origin = req.headers.get("origin");
	if (origin && !ALLOWED_ORIGINS.includes(origin)) return new Response("Forbidden", { status: 403 });
	
	const cors = corsHeaders(origin || ALLOWED_ORIGINS[0]);
	
	if (req.method === "OPTIONS") return new Response("ok", { headers: cors });
	if (req.method !== "POST") return json({ error: "Method not allowed" }, 405, cors);
	if (!req.headers.get("content-type")?.includes("application/json")) return json({ error: "Unsupported content type" }, 415, cors);
	if (!req.body) return json({ error: "Empty body" }, 400, cors);
	const raw = await readBodyCapped(req.body, 2048);
	if (raw === null) return json({ error: "Payload too large" }, 413, cors);

	try {
		const payload = JSON.parse(new TextDecoder().decode(raw));
		const { page, referrer, event_type, event_data } = payload;
		const pagePath = String(page ?? "/").trim().slice(0, 500) || "/";
		const referrerDomain = extractDomain(referrer);
		const ip = req.headers.get("x-forwarded-for")?.split(",")[0].trim() ?? "unknown";
		const ua = req.headers.get("user-agent") ?? "";
		const visitorId = await makeVisitorId(ip, ua);

		if (isRateLimited(visitorId)) return new Response(null, { status: 429, headers: cors });

		const deviceType = parseDeviceType(ua);
		const browser = parseBrowser(ua);
		const os = parseOS(ua);
		const country = req.headers.get("x-vercel-ip-country") ?? req.headers.get("cf-ipcountry") ?? null;
		
		const supabase = getSupabase();
		const isEvent = event_type && event_type !== "view";

		if (isEvent) {
			const { error: dbError } = await supabase.from("events").insert({ visitor_id: visitorId, event_type: String(event_type).slice(0, 50), event_data: event_data ?? null, page_path: pagePath });
			if (dbError) throw new Error(dbError.message);
		} else {
			const { error: dbError } = await supabase.from("page_views").insert({ visitor_id: visitorId, page_path: pagePath, referrer: referrerDomain, device_type: deviceType, browser, os, country: country?.slice(0, 2) ?? null });
			if (dbError) throw new Error(dbError.message);
		}
		return new Response(null, { status: 204, headers: cors });
	} catch (err) {
		console.error(err);
		return json({ error: "Internal error" }, 500, cors);
	}
});

function json(body: unknown, status: number, cors: Record<string, string>) { return new Response(JSON.stringify(body), { status, headers: { ...cors, "Content-Type": "application/json" } }); }
