import { config } from '../config';

export function Hero() {
  return (
    <section className="pt-20 pb-16 sm:pt-32 sm:pb-20 border-b border-white/[0.06]">
      <div className="flex items-end justify-between gap-6 mb-5">
        <h1
          className="anim-wipe text-white leading-none tracking-tight select-none"
          style={{
            fontFamily: 'Barlow Condensed, sans-serif',
            fontWeight: 800,
            fontSize: 'clamp(80px, 14vw, 160px)',
          }}
        >
          YUUKI
        </h1>
        <div className="anim-fade-up shrink-0 mb-1" style={{ animationDelay: '500ms' }}>
          <img
            src={config.avatarUrl}
            alt={config.username}
            width={72}
            height={72}
            draggable={false}
            className="opacity-90"
            style={{ imageRendering: 'auto' }}
          />
        </div>
      </div>

      <div className="h-px bg-white/[0.07] mb-5 anim-wipe" style={{ animationDelay: '180ms' }} />

      <p
        className="anim-fade-up text-[11px] tracking-[0.28em] text-[#444] uppercase mb-5"
        style={{ animationDelay: '300ms' }}
      >
        Luau Developer&nbsp;&nbsp;·&nbsp;&nbsp;Roblox Systems Programming
      </p>

      <div className="h-px bg-white/[0.07] mb-8 anim-wipe" style={{ animationDelay: '380ms' }} />

      <p
        className="anim-fade-up max-w-lg text-[13px] text-[#4a4a4a] leading-[1.8]"
        style={{ animationDelay: '480ms' }}
      >
        {config.bio}
      </p>
    </section>
  );
}
