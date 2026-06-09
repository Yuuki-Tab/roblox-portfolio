import { useEffect, useRef, useState } from 'react';

export function useIntersectionObserver(threshold = 0.12) {
	const ref = useRef<HTMLDivElement>(null);
	const [isVisible, setIsVisible] = useState(false);

	useEffect(() => {
		const element = ref.current;
		if (!element) return;
		let alive = true;

		const observer = new IntersectionObserver(
			([entry]) => {
				if (entry.isIntersecting && alive) {
					setIsVisible(true);
					observer.unobserve(element);
				}
			},
			{ threshold }
		);

		observer.observe(element);
		return () => {
			alive = false;
			observer.disconnect();
		};
	}, [threshold]);

	return { ref, isVisible };
}
