import { config } from "../config";

function scrollTo(id: string) {
	document.getElementById(id)?.scrollIntoView({ behavior: "smooth" });
}

const FOOTER_LINKS = [
	{ label: "Projects", id: "projects" },
	{ label: "Stats", id: "stats" },
	{ label: "Contact", id: "contact" },
];

export function Footer() {
	const year = new Date().getFullYear();

	return (
		<footer className="footer">
			<div className="footer-inner">
				<div className="footer-top">
					<div className="footer-brand mono">
						<span style={{ color: "var(--cyan)" }}>~/</span>
						<span style={{ color: "var(--text-hi)" }}>
							{config.username}
						</span>
					</div>

					<nav
						className="footer-links"
						aria-label="Footer navigation"
					>
						{FOOTER_LINKS.map((l) => (
							<a
								key={l.id}
								href={`#${l.id}`}
								onClick={(e) => {
									e.preventDefault();
									scrollTo(l.id);
								}}
							>
								{l.label}
							</a>
						))}
					</nav>
				</div>

				<p className="footer-copy mono">
					© {year} {config.username}. All rights reserved.
				</p>
			</div>
		</footer>
	);
}
