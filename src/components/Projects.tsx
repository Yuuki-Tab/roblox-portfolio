import { config } from "../config";
import { ProjectCard } from "./ProjectCard";
import { useIntersectionObserver } from "../hooks/useIntersectionObserver";

type Project = (typeof config.projects)[number];

export function Projects() {
	const { ref, isVisible } = useIntersectionObserver();
	const projects = config.projects;

	const rows: { items: readonly Project[] }[] = [];
	for (let i = 0; i < projects.length; i += 2) {
		rows.push({ items: projects.slice(i, i + 2) });
	}

	return (
		<section id="projects" className="section">
			<div ref={ref} className={`reveal ${isVisible ? "in" : ""}`}>
				<h2 className="section-title">
					My <em>Projects</em>
				</h2>
			</div>

			{/* Centered fading divider — above the grid */}
			<div
				className={`section-divider-label reveal ${isVisible ? "in" : ""}`}
			>
				<span className="section-divider-label-line" />
				<span className="section-divider-label-text">Systems</span>
				<span className="section-divider-label-line right" />
			</div>

			<div className="projects-list">
				{rows.map((row, rowIdx) => (
					<div
						key={rowIdx}
						className={`project-row ${row.items.length === 1 ? "single" : ""}`}
					>
						{row.items.map((project, colIdx) => (
							<ProjectCard
								key={project.title}
								project={project}
								index={rowIdx * 2 + colIdx}
								layout={
									row.items.length === 1
										? "horizontal"
										: "default"
								}
							/>
						))}
					</div>
				))}
			</div>
		</section>
	);
}
