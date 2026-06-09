import { useEffect, useRef, type ReactElement } from "react";
import { config } from "../config";
import { useIntersectionObserver } from "../hooks/useIntersectionObserver";

const ICONS: Record<string, ReactElement> = {
	code: (
		<svg
			className="stat-icon"
			width="28"
			height="28"
			viewBox="0 0 24 24"
			fill="none"
			stroke="currentColor"
			strokeWidth="1.5"
			strokeLinecap="round"
			strokeLinejoin="round"
			aria-hidden="true"
		>
			<polyline points="16 18 22 12 16 6" />
			<polyline points="8 6 2 12 8 18" />
		</svg>
	),
	clock: (
		<svg
			className="stat-icon"
			width="28"
			height="28"
			viewBox="0 0 24 24"
			fill="none"
			stroke="currentColor"
			strokeWidth="1.5"
			strokeLinecap="round"
			strokeLinejoin="round"
			aria-hidden="true"
		>
			<circle cx="12" cy="12" r="10" />
			<polyline points="12 6 12 12 16 14" />
		</svg>
	),
	gamepad: (
		<svg
			className="stat-icon"
			width="28"
			height="28"
			viewBox="0 0 24 24"
			fill="none"
			stroke="currentColor"
			strokeWidth="1.5"
			strokeLinecap="round"
			strokeLinejoin="round"
			aria-hidden="true"
		>
			<path d="M17.32 5H6.68a4 4 0 0 0-3.978 3.59c-.006.052-.01.101-.017.152C2.604 9.416 2 14.456 2 16a3 3 0 0 0 3 3c1 0 1.5-.5 2-1l1.414-1.414A2 2 0 0 1 9.828 16h4.344a2 2 0 0 1 1.414.586L17 18c.5.5 1 1 2 1a3 3 0 0 0 3-3c0-1.545-.604-6.584-.685-7.258-.007-.05-.011-.1-.017-.151A4 4 0 0 0 17.32 5z" />
		</svg>
	),
};

// Parse a numeric value from strings like "6+", "3 yrs", "6"
function parseNum(val: string): number | null {
	const match = val.match(/(\d+)/);
	return match ? parseInt(match[1]) : null;
}

function getSuffix(val: string): string {
	return val.replace(/^\d+/, "");
}

// Animated counter — writes directly to DOM to avoid 60 setState calls per second
function Counter({
	target,
	suffix,
	started,
}: {
	target: number;
	suffix: string;
	started: boolean;
}) {
	const spanRef = useRef<HTMLSpanElement>(null);
	const animationFrameIdRef = useRef(0);
	const startTimeRef = useRef<number | null>(null);
	const DURATION = 1200;

	useEffect(() => {
		if (!started) return;
		startTimeRef.current = null;

		const step = (timestamp: number) => {
			if (!startTimeRef.current) startTimeRef.current = timestamp;
			const progress = Math.min((timestamp - startTimeRef.current) / DURATION, 1);
			const eased = 1 - Math.pow(1 - progress, 3);
			if (spanRef.current) {
				spanRef.current.textContent = String(Math.round(eased * target)) + suffix;
			}
			if (progress < 1) {
				animationFrameIdRef.current = requestAnimationFrame(step);
			}
		};

		animationFrameIdRef.current = requestAnimationFrame(step);
		return () => cancelAnimationFrame(animationFrameIdRef.current);
	}, [started, target, suffix]);

	return <span ref={spanRef}>0{suffix}</span>;
}

export function Stats() {
	const { ref, isVisible } = useIntersectionObserver(0.2);

	return (
		<div id="stats" className="stats-wrapper">
			<div
				ref={ref}
				className={`stats-inner reveal ${isVisible ? "in" : ""}`}
			>
				{config.stats.map((stat) => {
					const num = parseNum(stat.value);
					const suffix = getSuffix(stat.value);

					return (
						<div key={stat.label} className="stat-block">
							{ICONS[stat.icon]}
							<div className="stat-num">
								{num !== null ? (
									<Counter
										target={num}
										suffix={suffix}
										started={isVisible}
									/>
								) : (
									stat.value
								)}
							</div>
							<div className="stat-label mono">{stat.label}</div>
						</div>
					);
				})}
			</div>
		</div>
	);
}
