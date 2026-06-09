// Fetches Roblox game thumbnails and saves them to public/thumbnails/
// Run: node scripts/fetch-thumbnails.mjs
//
// After running, copy the printed thumbnail paths into config.ts

import { writeFileSync, mkdirSync } from "fs";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";

const __dir = dirname(fileURLToPath(import.meta.url));
const OUT_DIR = resolve(__dir, "../public/thumbnails");
mkdirSync(OUT_DIR, { recursive: true });

function placeIdFromUrl(url) {
	const m = url.match(/roblox\.com\/games\/(\d+)/);
	if (!m) throw new Error(`Cannot parse place ID from: ${url}`);
	return m[1];
}

async function universeId(placeId) {
	const res = await fetch(`https://apis.roblox.com/universes/v1/places/${placeId}/universe`);
	const json = await res.json();
	return json.universeId;
}

async function thumbnailUrl(uid) {
	const res = await fetch(
		`https://thumbnails.roblox.com/v1/games/icons?universeIds=${uid}&size=512x512&format=Png&isCircular=false`
	);
	const json = await res.json();
	return json.data?.[0]?.imageUrl;
}

async function download(url, dest) {
	const res = await fetch(url);
	const buf = Buffer.from(await res.arrayBuffer());
	writeFileSync(dest, buf);
}

// --- Edit this list when you add/remove games ---
const GAMES = [
	// { title: "Game Title", gameUrl: "https://www.roblox.com/games/000000/..." },
];
const JAMS = [
	// { title: "Game Title", gameUrl: "https://www.roblox.com/games/000000/..." },
];
// ------------------------------------------------

async function process(list, prefix) {
	for (const game of list) {
		const slug = game.title.toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, "");
		const filename = `${prefix}-${slug}.png`;
		const dest = resolve(OUT_DIR, filename);
		try {
			const pid = placeIdFromUrl(game.gameUrl);
			const uid = await universeId(pid);
			const imgUrl = await thumbnailUrl(uid);
			if (!imgUrl) { console.warn(`No thumbnail for ${game.title}`); continue; }
			await download(imgUrl, dest);
			console.log(`✓ ${game.title} → /thumbnails/${filename}`);
		} catch (e) {
			console.error(`✗ ${game.title}: ${e.message}`);
		}
	}
}

await process(GAMES, "game");
await process(JAMS, "jam");
console.log("\nDone. Add the paths above to config.ts thumbnail fields.");
