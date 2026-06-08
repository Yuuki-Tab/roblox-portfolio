import { config } from '../config';
import { useIntersectionObserver } from '../hooks/useIntersectionObserver';

type Project = typeof config.projects[number];

interface Props {
  project: Project;
  index: number;
}

export function ProjectCard({ project, index }: Props) {
  const { ref, isVisible } = useIntersectionObserver();
  const videoId = project.videoUrl.split('/').pop()!;
  const slug = '//' + project.title.toLowerCase().replace(/\s+/g, '_');

  const visibilityClass = isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4';

  return (
    <div
      ref={ref}
      style={{ transitionDelay: `${index * 50}ms` }}
      className={`group relative flex flex-col bg-[#0c0c0c] overflow-hidden transition-all duration-500 hover:bg-[#101010] ${visibilityClass}`}
    >
      <div
        className="absolute left-0 top-0 bottom-0 w-[2px] bg-transparent group-hover:bg-accent transition-colors duration-200"
      />

      <div className="relative aspect-video bg-black">
        <iframe
          src={`https://streamable.com/e/${videoId}`}
          className="absolute inset-0 w-full h-full"
          allow="autoplay;fullscreen"
          allowFullScreen
          title={project.title}
          style={{ border: 'none' }}
        />
        <div className="absolute inset-0 bg-gradient-to-b from-accent/[0.04] to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none" />
      </div>

      <div className="flex flex-col flex-1 p-5 gap-3 border-t border-white/[0.05]">
        <span className="text-[10px] text-accent tracking-[0.1em]">{slug}</span>
        <h3 className="text-[13px] font-medium text-white leading-tight tracking-wide">
          {project.title}
        </h3>
        <p className="text-[12px] text-[#484848] leading-[1.7] flex-1">
          {project.description}
        </p>
        <a
          href={project.gameUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="text-[10px] tracking-[0.25em] text-[#2e2e2e] hover:text-white transition-colors duration-150 active:opacity-60 uppercase w-fit mt-1"
        >
          → PLAY
        </a>
      </div>
    </div>
  );
}
