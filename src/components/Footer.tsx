import { config } from "../config";
import { scrollToSection } from "../utils";

const CURRENT_YEAR = new Date().getFullYear();

const FOOTER_LINKS = [
	{ label: "Projects", id: "projects" },
	{ label: "Stats", id: "stats" },
	{ label: "Contact", id: "contact" },
];

export function Footer() {
	return (
		<footer className="footer">
			<div className="footer-inner">
				<div className="footer-top">
					<div className="footer-brand mono">
						<span style={{ color: "var(--primary)" }}>~/</span>
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
									scrollToSection(l.id);
								}}
							>
								{l.label}
							</a>
						))}
					</nav>
				</div>

				<p className="footer-copy mono">
					© {CURRENT_YEAR} {config.username}. All rights reserved.
				</p>
			</div>
		</footer>
	);
}
