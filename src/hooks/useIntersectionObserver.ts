import { useEffect, useRef, useState } from 'react';

export function useIntersectionObserver(threshold = 0.12) {
	const ref = useRef<HTMLDivElement>(null);
	const [isVisible, setIsVisible] = useState(false);

	useEffect(() => {
		const el = ref.current;
		if (!el) return;
		let alive = true;

		const observer = new IntersectionObserver(
			([entry]) => {
				if (entry.isIntersecting && alive) {
					setIsVisible(true);
					observer.unobserve(el);
				}
			},
			{ threshold }
		);

		observer.observe(el);
		return () => {
			alive = false;
			observer.disconnect();
		};
	}, [threshold]);

	return { ref, isVisible };
}
