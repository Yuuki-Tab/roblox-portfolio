import { useState, type FormEvent, type ReactElement } from "react";
import { useIntersectionObserver } from "../hooks/useIntersectionObserver";
import { config } from "../config";

const CONTACT_API_URL = "https://zlrskorrqwxsobkviwfc.supabase.co/functions/v1/contact";
const ACTIVE_SOCIALS = config.socials.filter((s) => s.url);

const SOCIAL_ICONS: Record<string, ReactElement> = {
	roblox: (
		<svg
			className="social-link-icon"
			stroke="currentColor"
			fill="currentColor"
			strokeWidth="0"
			role="img"
			viewBox="0 0 24 24"
			xmlns="http://www.w3.org/2000/svg"
			aria-hidden="true"
		>
			<path d="M18.926 23.998 0 18.892 5.075.002 24 5.108ZM15.348 10.09l-5.282-1.453-1.414 5.273 5.282 1.453z" />
		</svg>
	),
	discord: (
		<svg
			className="social-link-icon"
			stroke="currentColor"
			fill="currentColor"
			strokeWidth="0"
			role="img"
			viewBox="0 0 24 24"
			xmlns="http://www.w3.org/2000/svg"
			aria-hidden="true"
		>
			<path d="M20.317 4.3698a19.7913 19.7913 0 00-4.8851-1.5152.0741.0741 0 00-.0785.0371c-.211.3753-.4447.8648-.6083 1.2495-1.8447-.2762-3.68-.2762-5.4868 0-.1636-.3933-.4058-.8742-.6177-1.2495a.077.077 0 00-.0785-.037 19.7363 19.7363 0 00-4.8852 1.515.0699.0699 0 00-.0321.0277C.5334 9.0458-.319 13.5799.0992 18.0578a.0824.0824 0 00.0312.0561c2.0528 1.5076 4.0413 2.4228 5.9929 3.0294a.0777.0777 0 00.0842-.0276c.4616-.6304.8731-1.2952 1.226-1.9942a.076.076 0 00-.0416-.1057c-.6528-.2476-1.2743-.5495-1.8722-.8923a.077.077 0 01-.0076-.1277c.1258-.0943.2517-.1923.3718-.2914a.0743.0743 0 01.0776-.0105c3.9278 1.7933 8.18 1.7933 12.0614 0a.0739.0739 0 01.0785.0095c.1202.099.246.1981.3728.2924a.077.077 0 01-.0066.1276 12.2986 12.2986 0 01-1.873.8914.0766.0766 0 00-.0407.1067c.3604.698.7719 1.3628 1.225 1.9932a.076.076 0 00.0842.0286c1.961-.6067 3.9495-1.5219 6.0023-3.0294a.077.077 0 00.0313-.0552c.5004-5.177-.8382-9.6739-3.5485-13.6604a.061.061 0 00-.0312-.0286zM8.02 15.3312c-1.1825 0-2.1569-1.0857-2.1569-2.419 0-1.3332.9555-2.4189 2.157-2.4189 1.2108 0 2.1757 1.0952 2.1568 2.419 0 1.3332-.9555 2.4189-2.1569 2.4189zm7.9748 0c-1.1825 0-2.1569-1.0857-2.1569-2.419 0-1.3332.9554-2.4189 2.1569-2.4189 1.2108 0 2.1757 1.0952 2.1568 2.419 0 1.3332-.946 2.4189-2.1568 2.4189Z" />
		</svg>
	),
	github: (
		<svg
			className="social-link-icon"
			stroke="currentColor"
			fill="currentColor"
			strokeWidth="0"
			role="img"
			viewBox="0 0 24 24"
			xmlns="http://www.w3.org/2000/svg"
			aria-hidden="true"
		>
			<path d="M12 .297c-6.63 0-12 5.373-12 12 0 5.303 3.438 9.8 8.205 11.385.6.113.82-.258.82-.577 0-.285-.01-1.04-.015-2.04-3.338.724-4.042-1.61-4.042-1.61C4.422 18.07 3.633 17.7 3.633 17.7c-1.087-.744.084-.729.084-.729 1.205.084 1.838 1.236 1.838 1.236 1.07 1.835 2.809 1.305 3.495.998.108-.776.417-1.305.76-1.605-2.665-.3-5.466-1.332-5.466-5.93 0-1.31.465-2.38 1.235-3.22-.135-.303-.54-1.523.105-3.176 0 0 1.005-.322 3.3 1.23.96-.267 1.98-.399 3-.405 1.02.006 2.04.138 3 .405 2.28-1.552 3.285-1.23 3.285-1.23.645 1.653.24 2.873.12 3.176.765.84 1.23 1.91 1.23 3.22 0 4.61-2.805 5.625-5.475 5.92.42.36.81 1.096.81 2.22 0 1.606-.015 2.896-.015 3.286 0 .315.21.69.825.57C20.565 22.092 24 17.592 24 12.297c0-6.627-5.373-12-12-12" />
		</svg>
	),
};

const ARROW = (
	<svg
		className="social-link-arrow"
		width="14"
		height="14"
		viewBox="0 0 24 24"
		fill="none"
		stroke="currentColor"
		strokeWidth="2"
		strokeLinecap="round"
		strokeLinejoin="round"
		aria-hidden="true"
	>
		<path d="M5 12h14" />
		<path d="m12 5 7 7-7 7" />
	</svg>
);

export function Contact() {
	const { ref, isVisible } = useIntersectionObserver();
	const [form, setForm] = useState({ name: "", email: "", message: "" });
	const [status, setStatus] = useState<"idle" | "sending" | "sent" | "error">("idle");

	const handleSubmit = async (e: FormEvent) => {
		e.preventDefault();
		setStatus("sending");
		try {
			const res = await fetch(
				CONTACT_API_URL,
				{
					method: "POST",
					headers: { "Content-Type": "application/json" },
					body: JSON.stringify(form),
				},
			);
			if (!res.ok) throw new Error();
			setStatus("sent");
			setForm({ name: "", email: "", message: "" });
			setTimeout(() => setStatus("idle"), 4000);
		} catch {
			setStatus("error");
			setTimeout(() => setStatus("idle"), 4000);
		}
	};

	return (
		<section id="contact" className="section">
			<div ref={ref} className={`reveal ${isVisible ? "in" : ""}`}>
				<div className="section-label">
					<span className="section-label-line" />
					<span className="section-label-text">Contact</span>
				</div>
				<h2 className="section-title">
					Get in <em>touch</em>
				</h2>

				<div className="contact-grid">
					{/* Form */}
					<form className="contact-form" onSubmit={handleSubmit}>
						<div className="form-field">
							<label htmlFor="f-name">name</label>
							<input
								id="f-name"
								type="text"
								placeholder="your name"
								required
								value={form.name}
								onChange={(e) =>
									setForm((f) => ({
										...f,
										name: e.target.value,
									}))
								}
							/>
						</div>
						<div className="form-field">
							<label htmlFor="f-email">email</label>
							<input
								id="f-email"
								type="email"
								placeholder="your@email.com"
								required
								value={form.email}
								onChange={(e) =>
									setForm((f) => ({
										...f,
										email: e.target.value,
									}))
								}
							/>
						</div>
						<div className="form-field">
							<label htmlFor="f-msg">message</label>
							<textarea
								id="f-msg"
								rows={5}
								placeholder="what are you working on?"
								required
								value={form.message}
								onChange={(e) =>
									setForm((f) => ({
										...f,
										message: e.target.value,
									}))
								}
							/>
						</div>
						<button
							type="submit"
							className="contact-submit"
							disabled={status === "sending" || status === "sent"}
						>
							{status === "sent" ? "✓ message sent" :
							 status === "error" ? "✗ failed, try again" :
							 status === "sending" ? "sending…" : (
								<>
									send message
									<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
										<path d="m22 2-7 20-4-9-9-4Z" />
										<path d="M22 2 11 13" />
									</svg>
								</>
							)}
						</button>
					</form>

					{/* Aside */}
					<div className="contact-aside">
						<p className="contact-aside-title mono">
							// or find me on
						</p>
						{ACTIVE_SOCIALS.map((s) => (
							<a
								key={s.label}
								href={s.url}
								target="_blank"
								rel="noopener noreferrer"
								className="social-link"
							>
								{SOCIAL_ICONS[s.id]}
								<span className="social-link-label">
									{s.label}
								</span>
								{ARROW}
							</a>
						))}
					</div>
				</div>
			</div>
		</section>
	);
}
