import { config } from '../config';

export function Footer() {
  const links = config.socials.filter(s => s.url);

  return (
    <footer className="border-t border-white/[0.06] py-8">
      <div className="max-w-6xl mx-auto px-6 flex items-center justify-between gap-6 flex-wrap">
        <span className="text-[10px] tracking-[0.2em] text-[#1e1e1e] uppercase">
          {config.username} © 2025
        </span>
        <div className="flex gap-6">
          {links.map(social => (
            <a
              key={social.label}
              href={social.url}
              target="_blank"
              rel="noopener noreferrer"
              className="text-[10px] tracking-[0.25em] text-[#333] hover:text-white transition-colors duration-150 active:opacity-60 uppercase"
            >
              {social.label}
            </a>
          ))}
        </div>
      </div>
    </footer>
  );
}
