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

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const LIMITS = { name: 100, email: 254, message: 2000 };

const RATE_WINDOW_MS = 60_000;
const RATE_MAX_HITS = 3;

// In-memory rate limit: max 3 submissions per IP per 60s.
// NOTE: isolate-local — not shared across edge regions, so this is a
// best-effort limit, not a global guarantee.
const rate = new Map<string, number[]>();
function isRateLimited(ip: string): boolean {
	const now = Date.now();
	// prune dead entries so the map can't grow unbounded
	if (rate.size > 1000) {
		for (const [key, timestamps] of rate) {
			if (now - timestamps[timestamps.length - 1] >= RATE_WINDOW_MS) {
				rate.delete(key);
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
	const contentLength = Number(req.headers.get("content-length") ?? 0);
	if (contentLength > 16_384) {
		return json({ error: "Payload too large" }, 413, cors);
	}

	const ip =
		req.headers.get("x-forwarded-for")?.split(",")[0].trim() ?? "unknown";
	if (isRateLimited(ip)) {
		return json({ error: "Too many requests" }, 429, cors);
	}

	try {
		const { name, email, message, turnstileToken } = await req.json();

		// Anti-bot: enforced only once the secret is configured, so the form
		// keeps working before the Cloudflare widget exists. Once set, the
		// check is mandatory (fail closed).
		const turnstileSecret = Deno.env.get("TURNSTILE_SECRET_KEY");
		if (turnstileSecret) {
			const token = String(turnstileToken ?? "");
			if (!token || token.length > 4096) {
				return json({ error: "Captcha required" }, 400, cors);
			}
			const verify = await fetch(
				"https://challenges.cloudflare.com/turnstile/v0/siteverify",
				{
					method: "POST",
					headers: { "Content-Type": "application/json" },
					body: JSON.stringify({
						secret: turnstileSecret,
						response: token,
						remoteip: ip,
					}),
				},
			);
			const outcome = await verify.json();
			// hostname check: the widget's hostname allowlist may be forced to
			// the bare public suffix (vercel.app) by Cloudflare's UI, so verify
			// here that the token was actually solved on OUR site
			const allowedHostnames = ALLOWED_ORIGINS.map((o: string) => new URL(o).hostname);
			if (!outcome.success || !allowedHostnames.includes(outcome.hostname)) {
				return json({ error: "Captcha failed" }, 403, cors);
			}
		}

		const n = String(name ?? "").trim();
		const e = String(email ?? "").trim();
		const m = String(message ?? "").trim();

		if (!n || !e || !m) {
			return json({ error: "Missing fields" }, 400, cors);
		}
		if (n.length > LIMITS.name || e.length > LIMITS.email || m.length > LIMITS.message) {
			return json({ error: "Input too long" }, 400, cors);
		}
		if (!EMAIL_RE.test(e)) {
			return json({ error: "Invalid email" }, 400, cors);
		}

		const supabase = getSupabase();

		const { error: dbError } = await supabase
			.from("contacts")
			.insert({ name: n, email: e, message: m });

		if (dbError) {
			// raised by the contacts_rate_guard DB trigger (durable limit,
			// unlike the in-memory one above)
			if (dbError.message.includes("rate_limit")) {
				return json({ error: "Too many requests" }, 429, cors);
			}
			throw new Error(dbError.message);
		}

		const resendRes = await fetch("https://api.resend.com/emails", {
			method: "POST",
			headers: {
				Authorization: `Bearer ${Deno.env.get("RESEND_API_KEY")}`,
				"Content-Type": "application/json",
			},
			body: JSON.stringify({
				from: "Portfolio Contact <onboarding@resend.dev>",
				to: [Deno.env.get("CONTACT_EMAIL")],
				// control chars stripped: user input must never shape the subject line
				subject: `Portfolio inquiry from ${n.replace(/[\r\n\t\x00-\x1f]+/g, " ")}`,
				text: `Name: ${n}\nEmail: ${e}\n\n${m}`,
			}),
		});

		if (!resendRes.ok) {
			console.error("Resend failed:", await resendRes.text());
		}

		return json({ ok: true }, 200, cors);
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
