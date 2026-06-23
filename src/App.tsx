import { useEffect, useRef, useState } from "react";
import { Navbar } from "./components/Navbar";
import { Hero } from "./components/Hero";
import { Projects } from "./components/Projects";
import { Stats } from "./components/Stats";
import { Contributions } from "./components/Contributions";
import { Contact } from "./components/Contact";
import { Footer } from "./components/Footer";

const INTERACTIVE_SELECTOR = "a,button,.p-card,.social-link,.nav-cta";

function CursorDot() {
	const dotRef = useRef<HTMLDivElement>(null);

	useEffect(() => {
		const dot = dotRef.current;
		if (!dot) return;

		let hasReceivedFirstMove = false;

		const handleMouseMove = (event: MouseEvent) => {
			if (!hasReceivedFirstMove) {
				dot.style.opacity = "1";
				hasReceivedFirstMove = true;
			}
			// transform keeps the dot on the compositor thread — no layout reflow
			dot.style.transform = `translate(${event.clientX}px, ${event.clientY}px) translate(-50%, -50%)`;
		};

		const handleMouseOver = (event: MouseEvent) => {
			if ((event.target as Element).closest(INTERACTIVE_SELECTOR)) {
				document.body.classList.add("cursor-hover");
			}
		};

		const handleMouseOut = (event: MouseEvent) => {
			const matched = (event.target as Element).closest(
				INTERACTIVE_SELECTOR,
			);
			if (matched && !matched.contains(event.relatedTarget as Node)) {
				document.body.classList.remove("cursor-hover");
			}
		};

		document.addEventListener("mousemove", handleMouseMove, {
			passive: true,
		});

		document.addEventListener("mouseover", handleMouseOver, {
			passive: true,
		});

		document.addEventListener("mouseout", handleMouseOut, {
			passive: true,
		});

		return () => {
			document.removeEventListener("mousemove", handleMouseMove);
			document.removeEventListener("mouseover", handleMouseOver);
			document.removeEventListener("mouseout", handleMouseOut);
		};
	}, []);

	return <div ref={dotRef} className="cursor-dot" aria-hidden="true" />;
}

// Single scroll listener shared by both the progress bar and the scroll-to-top button
function ScrollUI() {
	const progressBarRef = useRef<HTMLDivElement>(null);
	const [showScrollToTop, setShowScrollToTop] = useState(false);

	useEffect(() => {
		const progressBar = progressBarRef.current;

		let ticking = false;
		const handleScroll = () => {
			if (ticking) return;
			ticking = true;
			requestAnimationFrame(() => {
				const totalScrollable =
					document.documentElement.scrollHeight - window.innerHeight;

				if (progressBar) {
					progressBar.style.width =
						totalScrollable > 0
							? `${(window.scrollY / totalScrollable) * 100}%`
							: "0%";
				}

				setShowScrollToTop(window.scrollY > window.innerHeight * 0.5);
				ticking = false;
			});
		};

		window.addEventListener("scroll", handleScroll, { passive: true });
		return () => window.removeEventListener("scroll", handleScroll);
	}, []);

	return (
		<>
			<div
				ref={progressBarRef}
				className="scroll-progress"
				aria-hidden="true"
			/>
			<button
				className={`scroll-top ${showScrollToTop ? "visible" : ""}`}
				onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
				aria-label="Scroll to top"
			>
				<svg
					width="16"
					height="16"
					viewBox="0 0 24 24"
					fill="none"
					stroke="currentColor"
					strokeWidth="2.5"
					strokeLinecap="round"
					strokeLinejoin="round"
					aria-hidden="true"
				>
					<path d="m18 15-6-6-6 6" />
				</svg>
			</button>
		</>
	);
}

export default function App() {
	return (
		<>
			<CursorDot />
			<ScrollUI />
			<div className="grid-bg" aria-hidden="true" />
			<Navbar />
			<main>
				<Hero />
				<Stats />
				<div className="section-divider" />
				<Projects />
				<div className="section-divider" />
				<Contributions />
				<div className="section-divider" />
				<Contact />
			</main>
			<Footer />
		</>
	);
}
