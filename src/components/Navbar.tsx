import { useState, useEffect } from "react";

const NAV_LINKS = [
	{ label: "Projects", href: "#projects" },
	{ label: "Stats", href: "#stats" },
	{ label: "Contributions", href: "#contributions" },
	{ label: "Contact", href: "#contact" },
];

function scrollTo(id: string) {
	document.getElementById(id)?.scrollIntoView({ behavior: "smooth" });
}

const SECTION_IDS = ['hero', 'projects', 'stats', 'contributions', 'contact'];

function useActiveSection() {
	const [active, setActive] = useState('hero');
	useEffect(() => {
		const observers = SECTION_IDS.map((id) => {
			const el = document.getElementById(id);
			if (!el) return null;
			const obs = new IntersectionObserver(
				([entry]) => { if (entry.isIntersecting) setActive(id); },
				{ rootMargin: '-40% 0px -55% 0px', threshold: 0 }
			);
			obs.observe(el);
			return obs;
		});
		return () => observers.forEach((o) => o?.disconnect());
	}, []);
	return active;
}

export function Navbar() {
	const [open, setOpen] = useState(false);
	const active = useActiveSection();

	return (
		<>
			<nav className="nav">
				{/* Brand */}
				<a
					className="nav-brand"
					href="#hero"
					onClick={(e) => {
						e.preventDefault();
						window.scrollTo({ top: 0, behavior: "smooth" });
					}}
				>
					<span className="nav-brand-prompt">~/</span>
					<span className="nav-brand-name">Yuuki</span>
				</a>

				{/* Desktop links */}
				<div className="nav-links">
					{NAV_LINKS.map((l) => (
						<a
							key={l.label}
							href={l.href}
							className={active === l.href.slice(1) ? 'active' : ''}
							onClick={(e) => {
								e.preventDefault();
								scrollTo(l.href.slice(1));
							}}
						>
							{l.label}
						</a>
					))}
				</div>

				{/* CTA + Mobile btn */}
				<div
					style={{
						display: "flex",
						gap: "12px",
						alignItems: "center",
					}}
				>
					<a
						className="nav-cta"
						href="#contact"
						onClick={(e) => {
							e.preventDefault();
							scrollTo("contact");
						}}
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
							<path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
							<polyline points="22,6 12,13 2,6" />
						</svg>
						Hire me
					</a>
					<button
						className="nav-mobile-btn"
						onClick={() => setOpen((o) => !o)}
						aria-label="Menu"
					>
						{open ? (
							<svg
								width="22"
								height="22"
								viewBox="0 0 24 24"
								fill="none"
								stroke="currentColor"
								strokeWidth="2"
								strokeLinecap="round"
								strokeLinejoin="round"
								aria-hidden="true"
							>
								<path d="M18 6 6 18" />
								<path d="m6 6 12 12" />
							</svg>
						) : (
							<svg
								width="22"
								height="22"
								viewBox="0 0 24 24"
								fill="none"
								stroke="currentColor"
								strokeWidth="2"
								strokeLinecap="round"
								strokeLinejoin="round"
								aria-hidden="true"
							>
								<path d="M4 6h16" />
								<path d="M4 12h16" />
								<path d="M4 18h16" />
							</svg>
						)}
					</button>
				</div>
			</nav>

			{/* Mobile drawer */}
			<div className={`mobile-drawer ${open ? "open" : ""}`}>
				{NAV_LINKS.map((l) => (
					<a
						key={l.label}
						href={l.href}
						onClick={(e) => {
							e.preventDefault();
							setOpen(false);
							scrollTo(l.href.slice(1));
						}}
					>
						{l.label}
					</a>
				))}
				<a
					className="nav-cta"
					style={{ width: "fit-content" }}
					href="#contact"
					onClick={(e) => {
						e.preventDefault();
						setOpen(false);
						scrollTo("contact");
					}}
				>
					Hire me
				</a>
			</div>
		</>
	);
}
