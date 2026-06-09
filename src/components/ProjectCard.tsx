import { useRef, useState } from "react";
import { config } from "../config";
import { useIntersectionObserver } from "../hooks/useIntersectionObserver";

type Project = (typeof config.projects)[number];

interface Props {
	project: Project;
	index: number;
	layout?: "default" | "horizontal";
}

function getVideoId(url: string) {
	return url.split("/").filter(Boolean).pop()!;
}

function VideoEmbed({ project }: { project: Project }) {
	const [playing, setPlaying] = useState(false);
	const [thumbErr, setThumbErr] = useState(false);
	const videoId = getVideoId(project.videoUrl);
	const thumbUrl = `https://cdn-cf-east.streamable.com/image/${videoId}.jpg`;

	if (playing) {
		return (
			<div className="p-card-media">
				<iframe
					src={`https://streamable.com/e/${videoId}?autoplay=1`}
					allow="autoplay; fullscreen; picture-in-picture"
					allowFullScreen
					title={project.title}
					style={{ border: "none" }}
				/>
				<button
					className="p-card-media-close"
					onClick={() => setPlaying(false)}
					aria-label="Close video"
				>
					<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" aria-hidden="true">
						<path d="M18 6 6 18M6 6l12 12"/>
					</svg>
				</button>
			</div>
		);
	}

	return (
		<a
			href={project.videoUrl}
			target="_blank"
			rel="noopener noreferrer"
			className="p-card-media-fallback"
			title={`Watch ${project.title} on Streamable`}
			onClick={(e) => { e.preventDefault(); setPlaying(true); }}
		>
			{!thumbErr && (
				<img
					src={thumbUrl}
					alt={project.title}
					onError={() => setThumbErr(true)}
				/>
			)}
			<div className="p-card-media-play">
				<svg width="28" height="28" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
					<path d="M8 5v14l11-7z" />
				</svg>
			</div>
			<div className="p-card-media-label">Watch on Streamable ↗</div>
		</a>
	);
}

export function ProjectCard({ project, index, layout = "default" }: Props) {
	const { ref, isVisible } = useIntersectionObserver();
	const num = String(index + 1).padStart(2, "0");
	const cachedRectRef = useRef<DOMRect | null>(null);
	const pendingFrameIdRef = useRef(0);

	const handleMouseEnter = (event: React.MouseEvent<HTMLDivElement>) => {
		cachedRectRef.current = event.currentTarget.getBoundingClientRect();
		event.currentTarget.style.transition = "transform 0.1s ease-out";
	};

	const handleMouseMove = (event: React.MouseEvent<HTMLDivElement>) => {
		const card = event.currentTarget;
		const cachedRect = cachedRectRef.current;
		if (!cachedRect) return;
		cancelAnimationFrame(pendingFrameIdRef.current);
		const clientX = event.clientX;
		const clientY = event.clientY;
		pendingFrameIdRef.current = requestAnimationFrame(() => {
			const normalizedX = (clientX - cachedRect.left) / cachedRect.width - 0.5;
			const normalizedY = (clientY - cachedRect.top) / cachedRect.height - 0.5;
			card.style.transform = `perspective(1000px) rotateX(${-normalizedY * 6}deg) rotateY(${normalizedX * 6}deg) translateY(-6px)`;
		});
	};

	const handleMouseLeave = (event: React.MouseEvent<HTMLDivElement>) => {
		cachedRectRef.current = null;
		cancelAnimationFrame(pendingFrameIdRef.current);
		event.currentTarget.style.transition = "transform 0.5s cubic-bezier(0.34,1.56,0.64,1)";
		event.currentTarget.style.transform = "";
	};

	return (
		<div
			ref={ref}
			style={{ transitionDelay: `${(index % 2) * 80}ms` }}
			className={`p-card reveal ${isVisible ? "in" : ""} ${layout === "horizontal" ? "horizontal" : ""}`}
			onMouseEnter={handleMouseEnter}
			onMouseMove={handleMouseMove}
			onMouseLeave={handleMouseLeave}
		>
			<VideoEmbed project={project} />

			<div className="p-card-info">
				<span className="p-card-index mono">{num} / system</span>
				<h3 className="p-card-title">{project.title}</h3>
				<p className="p-card-desc">{project.description}</p>
				<a
					href={project.gameUrl}
					target="_blank"
					rel="noopener noreferrer"
					className="p-card-link mono"
					aria-label={`Open ${project.title} on Roblox`}
				>
					<svg
						width="12"
						height="12"
						viewBox="0 0 24 24"
						fill="none"
						stroke="currentColor"
						strokeWidth="2"
						strokeLinecap="round"
						strokeLinejoin="round"
						aria-hidden="true"
					>
						<path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
						<polyline points="15 3 21 3 21 9" />
						<line x1="10" x2="21" y1="14" y2="3" />
					</svg>
					Open in Roblox
				</a>
			</div>
		</div>
	);
}
