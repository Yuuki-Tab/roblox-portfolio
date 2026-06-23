import { useEffect, useRef } from 'react';

export function useMagnetic<T extends HTMLElement>(strength = 0.4) {
	const elementRef = useRef<T>(null);

	useEffect(() => {
		const element = elementRef.current;
		if (!element) return;

		let cachedRect: DOMRect | null = null;
		let pendingFrameId = 0;

		const handleMouseEnter = () => {
			cachedRect = element.getBoundingClientRect();
			element.style.transition = 'transform 0.1s ease-out';
		};

		const handleMouseMove = (event: MouseEvent) => {
			if (!cachedRect) return;
			cancelAnimationFrame(pendingFrameId);
			const clientX = event.clientX;
			const clientY = event.clientY;
			pendingFrameId = requestAnimationFrame(() => {
				if (!cachedRect) return;
				const centerX = cachedRect.left + cachedRect.width / 2;
				const centerY = cachedRect.top + cachedRect.height / 2;
				const offsetX = (clientX - centerX) * strength;
				const offsetY = (clientY - centerY) * strength;
				element.style.transform = `translate(${offsetX}px, ${offsetY}px)`;
			});
		};

		const handleMouseLeave = () => {
			cachedRect = null;
			cancelAnimationFrame(pendingFrameId);
			element.style.transition = 'transform 0.6s cubic-bezier(0.34,1.56,0.64,1)';
			element.style.transform = 'translate(0,0)';
		};

		element.addEventListener('mouseenter', handleMouseEnter, { passive: true });
		element.addEventListener('mousemove', handleMouseMove, { passive: true });
		element.addEventListener('mouseleave', handleMouseLeave, { passive: true });
		
		return () => {
			element.removeEventListener('mouseenter', handleMouseEnter);
			element.removeEventListener('mousemove', handleMouseMove);
			element.removeEventListener('mouseleave', handleMouseLeave);
			cancelAnimationFrame(pendingFrameId);
		};
	}, [strength]);

	return elementRef;
}
