const RATE_WINDOW_MS = 120_000;
const MAX_FAILURES = 3;
const failedAttempts = new Map<string, number[]>();

function checkRateLimit(ip: string) {
	const now = Date.now();
	if (failedAttempts.size > 1000) {
		for (const [k, timestamps] of failedAttempts) {
			if (now - timestamps[timestamps.length - 1] >= RATE_WINDOW_MS) {
				failedAttempts.delete(k);
			}
		}
	}
	const hits = (failedAttempts.get(ip) ?? []).filter((t) => now - t < RATE_WINDOW_MS);
	
	return {
		locked: hits.length >= MAX_FAILURES,
		recordFailure: () => {
			hits.push(now);
			failedAttempts.set(ip, hits);
		}
	};
}

for (let i=0; i<5; i++) {
    const rl = checkRateLimit("unknown");
    console.log(`Req ${i}: locked=${rl.locked}`);
    rl.recordFailure();
}
