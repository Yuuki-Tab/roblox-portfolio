import { useEffect, useRef } from 'react';

export function useMagnetic<T extends HTMLElement>(strength = 0.4) {
	const ref = useRef<T>(null);

	useEffect(() => {
		const el = ref.current;
		if (!el) return;

		const onMove = (e: MouseEvent) => {
			const rect = el.getBoundingClientRect();
			const x = (e.clientX - (rect.left + rect.width / 2)) * strength;
			const y = (e.clientY - (rect.top + rect.height / 2)) * strength;
			el.style.transform = `translate(${x}px, ${y}px)`;
			el.style.transition = 'transform 0.1s ease-out';
		};

		const onLeave = () => {
			el.style.transition = 'transform 0.6s cubic-bezier(0.34,1.56,0.64,1)';
			el.style.transform = 'translate(0,0)';
		};

		el.addEventListener('mousemove', onMove);
		el.addEventListener('mouseleave', onLeave);
		return () => {
			el.removeEventListener('mousemove', onMove);
			el.removeEventListener('mouseleave', onLeave);
		};
	}, [strength]);

	return ref;
}
