import { config } from '../config';
import { ProjectCard } from './ProjectCard';

export function Projects() {
  return (
    <section className="py-16">
      <div className="flex items-center gap-5 mb-10">
        <span className="text-accent text-[10px] tracking-[0.3em]">01</span>
        <div className="flex-1 h-px bg-white/[0.06]" />
        <span className="text-[9px] tracking-[0.4em] text-[#252525] uppercase">Projects</span>
        <div className="flex-1 h-px bg-white/[0.06]" />
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {config.projects.map((project, i) => (
          <ProjectCard key={project.title} project={project} index={i} />
        ))}
      </div>
    </section>
  );
}
