import { useEffect, useRef, useState } from "react";
import { config } from "../config";
import { useMagnetic } from "../hooks/useMagnetic";
import { TERMINAL_FILES, type TerminalFile } from "../terminalFiles";

const LERP_FACTOR = 0.04;
const SETTLE_THRESHOLD = 0.0005;

function scrollToSection(id: string) {
	document.getElementById(id)?.scrollIntoView({ behavior: "smooth" });
}

function Terminal({
	file,
	typed,
	onFileChange,
}: {
	file: TerminalFile;
	typed: number;
	onFileChange: (index: number) => void;
}) {
	const visibleLines = file.lines.slice(0, typed);

	return (
		<div className="hero-terminal" aria-hidden="true">
			<div className="terminal-bar">
				<div className="terminal-dots">
					<span className="terminal-dot dot-red" />
					<span className="terminal-dot dot-yellow" />
					<span className="terminal-dot dot-green" />
				</div>
				<div className="terminal-tabs">
					{TERMINAL_FILES.map((terminalFile, index) => (
						<button
							key={terminalFile.name}
							className={`terminal-tab${terminalFile.name === file.name ? " active" : ""}`}
							onClick={() => onFileChange(index)}
						>
							{terminalFile.name}
						</button>
					))}
				</div>
			</div>
			<div className="terminal-body">
				{visibleLines.map((line, lineIndex) => (
					<div
						key={`${file.name}-${lineIndex}`}
						className="t-line"
						style={{ paddingLeft: `${line.indent * 20}px` }}
					>
						{line.parts.map((part, partIndex) => (
							<span key={partIndex} className={part.t}>
								{part.v}
							</span>
						))}
					</div>
				))}
				<span className="t-cursor" />
			</div>
		</div>
	);
}

export function Hero() {
	const [fileIndex, setFileIndex] = useState(0);
	const [typed, setTyped] = useState(0);
	const sectionRef = useRef<HTMLElement>(null);
	const orbRef1 = useRef<HTMLDivElement>(null);
	const orbRef2 = useRef<HTMLDivElement>(null);
	const primaryRef = useMagnetic<HTMLButtonElement>();
	const secondaryRef = useMagnetic<HTMLButtonElement>();

	const currentFile = TERMINAL_FILES[fileIndex];

	const handleFileChange = (index: number) => {
		setFileIndex(index);
		setTyped(0);
	};

	// Typewriter effect — advances one line at a time with variable delay
	useEffect(() => {
		if (typed >= currentFile.lines.length) return;
		const isFirstLine = typed === 0;
		const previousLineIsBlank = currentFile.lines[typed - 1]?.parts.length === 0;
		const delay = isFirstLine ? 300 : previousLineIsBlank ? 25 : 60;
		const timeoutId = setTimeout(() => setTyped((count) => count + 1), delay);
		return () => clearTimeout(timeoutId);
	}, [typed, currentFile]);

	// Orb parallax — lerp to mouse position, stop the loop when settled
	useEffect(() => {
		const section = sectionRef.current;
		if (!section) return;

		let targetX = 0;
		let targetY = 0;
		let currentX = 0;
		let currentY = 0;
		let animationFrameId = 0;

		// Cache section bounds; refresh only on resize to avoid layout reflow on every mousemove
		let sectionRect = section.getBoundingClientRect();
		// document-relative top so position stays valid after user scrolls
		let sectionDocumentTop = sectionRect.top + window.scrollY;
		const resizeObserver = new ResizeObserver(() => {
			sectionRect = section.getBoundingClientRect();
			sectionDocumentTop = sectionRect.top + window.scrollY;
		});
		resizeObserver.observe(section);

		const tickAnimation = () => {
			currentX += (targetX - currentX) * LERP_FACTOR;
			currentY += (targetY - currentY) * LERP_FACTOR;

			if (orbRef1.current) {
				orbRef1.current.style.transform = `translate(${currentX * 35}px, ${currentY * 25}px)`;
			}
			if (orbRef2.current) {
				orbRef2.current.style.transform = `translate(${-currentX * 25}px, ${-currentY * 18}px)`;
			}

			const hasSettled =
				Math.abs(targetX - currentX) < SETTLE_THRESHOLD &&
				Math.abs(targetY - currentY) < SETTLE_THRESHOLD;

			animationFrameId = hasSettled ? 0 : requestAnimationFrame(tickAnimation);
		};

		const handleMouseMove = (event: MouseEvent) => {
			targetX = (event.clientX - sectionRect.width / 2) / sectionRect.width;
			targetY = (event.pageY - sectionDocumentTop - sectionRect.height / 2) / sectionRect.height;
			if (!animationFrameId) {
				animationFrameId = requestAnimationFrame(tickAnimation);
			}
		};

		const handleMouseLeave = () => {
			targetX = 0;
			targetY = 0;
			if (!animationFrameId) {
				animationFrameId = requestAnimationFrame(tickAnimation);
			}
		};

		section.addEventListener("mousemove", handleMouseMove);
		section.addEventListener("mouseleave", handleMouseLeave);

		return () => {
			section.removeEventListener("mousemove", handleMouseMove);
			section.removeEventListener("mouseleave", handleMouseLeave);
			cancelAnimationFrame(animationFrameId);
			resizeObserver.disconnect();
		};
	}, []);

	return (
		<section id="hero" className="hero" ref={sectionRef}>
			<div className="hero-scanline" aria-hidden="true" />
			<div className="hero-orb-wrap" ref={orbRef1} aria-hidden="true">
				<div className="hero-orb" />
			</div>
			<div className="hero-orb-wrap" ref={orbRef2} aria-hidden="true">
				<div className="hero-orb-2" />
			</div>

			<div className="hero-inner">
				{/* Left */}
				<div>
					<div className="hero-tag">
						<span className="hero-tag-dot" aria-hidden="true" />
						Available for work
					</div>

					<h1 className="hero-name">{config.username}</h1>

					<p className="hero-role mono">
						<span>{">"}</span> Luau Developer &amp; Systems Programmer
					</p>

					<p className="hero-bio">{config.bio}</p>

					<div className="hero-actions">
						<button
							ref={primaryRef}
							className="btn-primary"
							onClick={() => scrollToSection("projects")}
						>
							<svg
								width="15"
								height="15"
								viewBox="0 0 24 24"
								fill="none"
								stroke="currentColor"
								strokeWidth="2"
								strokeLinecap="round"
								strokeLinejoin="round"
								aria-hidden="true"
							>
								<polyline points="16 18 22 12 16 6" />
								<polyline points="8 6 2 12 8 18" />
							</svg>
							View projects
						</button>
						<button
							ref={secondaryRef}
							className="btn-secondary"
							onClick={() => scrollToSection("contact")}
						>
							Contact me
						</button>
					</div>
				</div>

				{/* Right — animated terminal */}
				<Terminal
					file={currentFile}
					typed={typed}
					onFileChange={handleFileChange}
				/>
			</div>
		</section>
	);
}
