import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const CORS = {
	"Access-Control-Allow-Origin": Deno.env.get("ALLOWED_ORIGIN") ?? "*",
	"Access-Control-Allow-Headers": "content-type",
};

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const LIMITS = { name: 100, email: 254, message: 2000 };

// In-memory rate limit: max 3 submissions per IP per 60s
const rate = new Map<string, number[]>();
function isRateLimited(ip: string): boolean {
	const now = Date.now();
	const window = 60_000;
	const hits = (rate.get(ip) ?? []).filter((t) => now - t < window);
	if (hits.length === 0) { rate.delete(ip); return false; }
	if (hits.length >= 3) return true;
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
	if (req.method === "OPTIONS") {
		return new Response("ok", { headers: CORS });
	}

	const ip =
		req.headers.get("x-forwarded-for")?.split(",")[0].trim() ?? "unknown";
	if (isRateLimited(ip)) {
		return json({ error: "Too many requests" }, 429);
	}

	try {
		const { name, email, message } = await req.json();

		const n = String(name ?? "").trim();
		const e = String(email ?? "").trim();
		const m = String(message ?? "").trim();

		if (!n || !e || !m) {
			return json({ error: "Missing fields" }, 400);
		}
		if (n.length > LIMITS.name || e.length > LIMITS.email || m.length > LIMITS.message) {
			return json({ error: "Input too long" }, 400);
		}
		if (!EMAIL_RE.test(e)) {
			return json({ error: "Invalid email" }, 400);
		}

		const supabase = getSupabase();

		const { error: dbError } = await supabase
			.from("contacts")
			.insert({ name: n, email: e, message: m });

		if (dbError) throw new Error(dbError.message);

		const resendRes = await fetch("https://api.resend.com/emails", {
			method: "POST",
			headers: {
				Authorization: `Bearer ${Deno.env.get("RESEND_API_KEY")}`,
				"Content-Type": "application/json",
			},
			body: JSON.stringify({
				from: "Portfolio Contact <onboarding@resend.dev>",
				to: [Deno.env.get("CONTACT_EMAIL")],
				subject: `Portfolio inquiry from ${n}`,
				text: `Name: ${n}\nEmail: ${e}\n\n${m}`,
			}),
		});

		if (!resendRes.ok) {
			console.error("Resend failed:", await resendRes.text());
		}

		return json({ ok: true }, 200);
	} catch (err) {
		console.error(err);
		return json({ error: "Internal error" }, 500);
	}
});

function json(body: unknown, status: number) {
	return new Response(JSON.stringify(body), {
		status,
		headers: { ...CORS, "Content-Type": "application/json" },
	});
}
