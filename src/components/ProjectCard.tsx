import { useRef, useState } from "react";
import { type Project } from "../config";
import { useIntersectionObserver } from "../hooks/useIntersectionObserver";
import { ExternalLinkIcon } from "./ExternalLinkIcon";

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
	const [imgLoaded, setImgLoaded] = useState(false);
	const videoId = getVideoId(project.videoUrl);
	const thumbUrl = `https://cdn-cf-east.streamable.com/image/${videoId}.jpg`;

	if (playing) {
		return (
			<div className="p-card-media">
				<iframe
					src={`https://streamable.com/e/${videoId}?autoplay=1`}
					allow="autoplay; fullscreen; picture-in-picture"
					sandbox="allow-scripts allow-same-origin allow-presentation"
					title={project.title}
					style={{ border: "none" }}
				/>
				<button
					className="p-card-media-close"
					onClick={() => setPlaying(false)}
					aria-label="Close video"
				>
					<svg
						width="14"
						height="14"
						viewBox="0 0 24 24"
						fill="none"
						stroke="currentColor"
						strokeWidth="2.5"
						strokeLinecap="round"
						aria-hidden="true"
					>
						<path d="M18 6 6 18M6 6l12 12" />
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
			onClick={(e) => {
				e.preventDefault();
				setPlaying(true);
				window.dispatchEvent(new Event("hide-cursor"));
			}}
		>
			{!thumbErr && (
				<>
					{!imgLoaded && <div className="skeleton-loader" />}
					<img
						src={thumbUrl}
						alt={project.title}
						onLoad={() => setImgLoaded(true)}
						onError={() => setThumbErr(true)}
						style={imgLoaded ? {} : { opacity: 0 }}
					/>
				</>
			)}
			<div className="p-card-media-play">
				<svg
					width="28"
					height="28"
					viewBox="0 0 24 24"
					fill="currentColor"
					aria-hidden="true"
				>
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
	const pendingFrameIdRef = useRef<number | null>(null);

	const handleMouseEnter = (event: React.MouseEvent<HTMLDivElement>) => {
		cachedRectRef.current = event.currentTarget.getBoundingClientRect();
		event.currentTarget.style.transition = "transform 0.1s ease-out";
	};

	const handleMouseMove = (event: React.MouseEvent<HTMLDivElement>) => {
		const card = event.currentTarget;
		const cachedRect = cachedRectRef.current;
		if (!cachedRect) return;
		if (pendingFrameIdRef.current !== null)
			cancelAnimationFrame(pendingFrameIdRef.current);
		const clientX = event.clientX;
		const clientY = event.clientY;
		pendingFrameIdRef.current = requestAnimationFrame(() => {
			const normalizedX =
				(clientX - cachedRect.left) / cachedRect.width - 0.5;
			const normalizedY =
				(clientY - cachedRect.top) / cachedRect.height - 0.5;
			card.style.transform = `perspective(1000px) rotateX(${-normalizedY * 6}deg) rotateY(${normalizedX * 6}deg) translateY(-6px)`;
		});
	};

	const handleMouseLeave = (event: React.MouseEvent<HTMLDivElement>) => {
		cachedRectRef.current = null;
		if (pendingFrameIdRef.current !== null)
			cancelAnimationFrame(pendingFrameIdRef.current);
		pendingFrameIdRef.current = null;
		event.currentTarget.style.transition =
			"transform 0.5s cubic-bezier(0.34,1.56,0.64,1)";
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
					<ExternalLinkIcon />
					Open in Roblox
				</a>
			</div>
		</div>
	);
}
