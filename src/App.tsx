import { useEffect, useRef, useState } from 'react';
import { Navbar } from './components/Navbar';
import { Hero } from './components/Hero';
import { Projects } from './components/Projects';
import { Stats } from './components/Stats';
import { Contributions } from './components/Contributions';
import { Contact } from './components/Contact';
import { Footer } from './components/Footer';

function CursorDot() {
	const dotRef = useRef<HTMLDivElement>(null);

	useEffect(() => {
		if (!window.matchMedia('(pointer: fine)').matches) return;
		const dot = dotRef.current;
		if (!dot) return;

		let moved = false;

		const SELECTOR = 'a,button,.p-card,.social-link,.nav-cta';

		const onMove = (e: MouseEvent) => {
			if (!moved) { dot.style.opacity = '1'; moved = true; }
			dot.style.left = e.clientX + 'px';
			dot.style.top = e.clientY + 'px';
		};

		const onOver = (e: MouseEvent) => {
			if ((e.target as Element).closest(SELECTOR))
				document.body.classList.add('cursor-hover');
		};

		const onOut = (e: MouseEvent) => {
			const matched = (e.target as Element).closest(SELECTOR);
			if (matched && !matched.contains(e.relatedTarget as Node))
				document.body.classList.remove('cursor-hover');
		};

		document.addEventListener('mousemove', onMove);
		document.addEventListener('mouseover', onOver);
		document.addEventListener('mouseout', onOut);

		return () => {
			document.removeEventListener('mousemove', onMove);
			document.removeEventListener('mouseover', onOver);
			document.removeEventListener('mouseout', onOut);
		};
	}, []);

	return <div ref={dotRef} className="cursor-dot" aria-hidden="true" />;
}

function ScrollBar() {
	const barRef = useRef<HTMLDivElement>(null);

	useEffect(() => {
		const bar = barRef.current;
		if (!bar) return;
		const onScroll = () => {
			const total = document.documentElement.scrollHeight - window.innerHeight;
			bar.style.width = total > 0 ? `${(window.scrollY / total) * 100}%` : '0%';
		};
		window.addEventListener('scroll', onScroll, { passive: true });
		return () => window.removeEventListener('scroll', onScroll);
	}, []);

	return <div ref={barRef} className="scroll-progress" aria-hidden="true" />;
}

function ScrollToTop() {
	const [visible, setVisible] = useState(false);
	useEffect(() => {
		const onScroll = () => setVisible(window.scrollY > window.innerHeight * 0.5);
		window.addEventListener('scroll', onScroll, { passive: true });
		return () => window.removeEventListener('scroll', onScroll);
	}, []);
	return (
		<button
			className={`scroll-top ${visible ? 'visible' : ''}`}
			onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
			aria-label="Scroll to top"
		>
			<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
				<path d="m18 15-6-6-6 6"/>
			</svg>
		</button>
	);
}

export default function App() {
	return (
		<>
			<CursorDot />
			<ScrollBar />
			<ScrollToTop />
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
