import { useEffect, useRef, useState } from "react";
import { config } from "../config";
import { useMagnetic } from "../hooks/useMagnetic";
import { TERMINAL_FILES, type TerminalFile } from "../terminalFiles";

function scrollTo(id: string) {
	document.getElementById(id)?.scrollIntoView({ behavior: "smooth" });
}

function Terminal({
	file,
	typed,
	onFileChange,
}: {
	file: TerminalFile;
	typed: number;
	onFileChange: (i: number) => void;
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
					{TERMINAL_FILES.map((f, i) => (
						<button
							key={f.name}
							className={`terminal-tab${f.name === file.name ? " active" : ""}`}
							onClick={() => onFileChange(i)}
						>
							{f.name}
						</button>
					))}
				</div>
			</div>
			<div className="terminal-body">
				{visibleLines.map((line, i) => (
					<div
						key={i}
						className="t-line"
						style={{ paddingLeft: `${line.indent * 20}px` }}
					>
						{line.parts.map((p, j) => (
							<span key={j} className={p.t}>
								{p.v}
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

	const handleFileChange = (i: number) => {
		setFileIndex(i);
		setTyped(0);
	};

	// Typewriter effect
	useEffect(() => {
		if (typed >= currentFile.lines.length) return;
		const delay =
			typed === 0
				? 300
				: currentFile.lines[typed - 1].parts.length === 0
					? 25
					: 60;
		const t = setTimeout(() => setTyped((n) => n + 1), delay);
		return () => clearTimeout(t);
	}, [typed, currentFile]);

	// Orb parallax — wrappers get style.transform so orbFloat animation is unaffected
	useEffect(() => {
		const section = sectionRef.current;
		if (!section) return;

		let targetX = 0,
			targetY = 0;
		let currentX = 0,
			currentY = 0;
		let raf: number;

		const onMove = (e: MouseEvent) => {
			const rect = section.getBoundingClientRect();
			targetX = (e.clientX - rect.width / 2) / rect.width;
			targetY = (e.clientY - rect.top - rect.height / 2) / rect.height;
		};

		const onLeave = () => {
			targetX = 0;
			targetY = 0;
		};

		const loop = () => {
			currentX += (targetX - currentX) * 0.04;
			currentY += (targetY - currentY) * 0.04;
			if (orbRef1.current) {
				orbRef1.current.style.transform = `translate(${currentX * 35}px, ${currentY * 25}px)`;
			}
			if (orbRef2.current) {
				orbRef2.current.style.transform = `translate(${-currentX * 25}px, ${-currentY * 18}px)`;
			}
			raf = requestAnimationFrame(loop);
		};

		section.addEventListener("mousemove", onMove);
		section.addEventListener("mouseleave", onLeave);
		raf = requestAnimationFrame(loop);

		return () => {
			section.removeEventListener("mousemove", onMove);
			section.removeEventListener("mouseleave", onLeave);
			cancelAnimationFrame(raf);
		};
	}, []);

	return (
		<section id="hero" className="hero" ref={sectionRef}>
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
						<span>{">"}</span> Luau Developer &amp; Systems
						Programmer
					</p>

					<p className="hero-bio">{config.bio}</p>

					<div className="hero-actions">
						<button
							ref={primaryRef}
							className="btn-primary"
							onClick={() => scrollTo("projects")}
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
							onClick={() => scrollTo("contact")}
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
