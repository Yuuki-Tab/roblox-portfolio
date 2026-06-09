import { useState } from "react";
import { config } from "../config";
import { useIntersectionObserver } from "../hooks/useIntersectionObserver";
import { ExternalLinkIcon } from "./ExternalLinkIcon";

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
				<div className="contrib-card-overlay" style={{ fontSize: "16px" }}>
					<ExternalLinkIcon />
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
					{items.map((item, i) => (
						<ContributionCard key={`${tab}-${i}`} {...item} />
					))}
				</div>
			</div>
		</section>
	);
}
