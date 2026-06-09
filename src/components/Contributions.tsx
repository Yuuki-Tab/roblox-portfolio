import { useState } from "react";
import { config } from "../config";
import { useIntersectionObserver } from "../hooks/useIntersectionObserver";

type Tab = "games" | "jams";

function ContributionCard({ title, gameUrl, thumbnail }: { title: string; gameUrl: string; thumbnail: string }) {
	return (
		<a
			href={gameUrl}
			target="_blank"
			rel="noopener noreferrer"
			className="contrib-card"
			aria-label={`Open ${title} on Roblox`}
		>
			<div className="contrib-card-thumb">
				{thumbnail ? (
					<img src={thumbnail} alt={title} loading="lazy" />
				) : (
					<div className="contrib-card-placeholder">
						<svg width="32" height="32" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
							<path d="M18.926 23.998 0 18.892 5.075.002 24 5.108ZM15.348 10.09l-5.282-1.453-1.414 5.273 5.282 1.453z" />
						</svg>
					</div>
				)}
				<div className="contrib-card-overlay">
					<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
						<path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
						<polyline points="15 3 21 3 21 9" />
						<line x1="10" x2="21" y1="14" y2="3" />
					</svg>
				</div>
			</div>
			<span className="contrib-card-title">{title}</span>
		</a>
	);
}

export function Contributions() {
	const { ref, isVisible } = useIntersectionObserver();
	const [tab, setTab] = useState<Tab>("games");

	const items =
		tab === "games"
			? config.contributions.games
			: config.contributions.jams;

	return (
		<section id="contributions" className="section">
			<div ref={ref} className={`reveal ${isVisible ? "in" : ""}`}>
				<div className="section-label">
					<span className="section-label-line" />
					<span className="section-label-text">Contributions</span>
				</div>
				<h2 className="section-title">
					Games I <em>worked on</em>
				</h2>

				<div className="contrib-tabs">
					<button
						className={`contrib-tab${tab === "games" ? " active" : ""}`}
						onClick={() => setTab("games")}
					>
						Games
					</button>
					<button
						className={`contrib-tab${tab === "jams" ? " active" : ""}`}
						onClick={() => setTab("jams")}
					>
						Game Jams
					</button>
				</div>

				<div className="contrib-grid">
					{items.map((item) => (
						<ContributionCard key={item.title + item.gameUrl} {...item} />
					))}
				</div>
			</div>
		</section>
	);
}
