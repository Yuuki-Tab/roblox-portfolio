export const config = {
	username: "Yuuki",
	tagline: "Luau Developer · Systems Programming",
	bio: "Hi, I'm Yuuki. I'm a Luau developer specializing in systems programming for Roblox modular architectures, RNG systems, performance optimizations, and bug fixing. Programming is my passion. I enjoy solving hard problems and I'm always looking to learn and grow through real work and experience.",
	contactEmail: "", // Add your email here

	socials: [
		{ label: "Roblox", url: "https://www.roblox.com/users/1205213971/profile", id: "roblox" },
		{ label: "Discord", url: "https://discord.com/users/636602697323380757", id: "discord" },
		{ label: "GitHub", url: "", id: "github" },
	],

	stats: [
		{ value: "6+", label: "Systems built", icon: "code" },
		{ value: "5 yrs", label: "Luau experience", icon: "clock" },
		{ value: "6", label: "Roblox projects", icon: "gamepad" },
	],

	contributions: {
		games: [
			{ title: "Game Title", gameUrl: "https://www.roblox.com/games/000000000/Game-Title", thumbnail: "" },
			{ title: "Game Title", gameUrl: "https://www.roblox.com/games/000000000/Game-Title", thumbnail: "" },
		],
		jams: [
			{ title: "Game Title", gameUrl: "https://www.roblox.com/games/000000000/Game-Title", thumbnail: "" },
			{ title: "Game Title", gameUrl: "https://www.roblox.com/games/000000000/Game-Title", thumbnail: "" },
		],
	},

	projects: [
		{
			title: "Maze Generation Algorithm",
			description: "Creates dynamic, random mazes with customizable rooms and unique paths using recursive backtracking.",
			videoUrl: "https://streamable.com/q921oz",
			gameUrl: "https://www.roblox.com/games/102097252948710/MazePortfolio",
		},
		{
			title: "TimerSystem",
			description: "Customizable timer with configurable tick intervals, pause/resume, and on-tick/on-complete callbacks.",
			videoUrl: "https://streamable.com/d0iwkg",
			gameUrl: "https://www.roblox.com/games/122345891327992/ShowcasePortfolio",
		},
		{
			title: "Global LeaderboardManager",
			description: "Retrieves, updates, and sorts player data with configurable update intervals, page sizes, and minimum scores.",
			videoUrl: "https://streamable.com/peklit",
			gameUrl: "https://www.roblox.com/games/122345891327992/ShowcasePortfolio",
		},
		{
			title: "2D Camera",
			description: "Smooth side-scrolling camera system with dynamic movement and precise control.",
			videoUrl: "https://streamable.com/4x2s4v",
			gameUrl: "https://www.roblox.com/games/118752248103914/Parkour2D-Portfolio",
		},
		{
			title: "Tween",
			description: "Custom animation system that transitions object properties over time with easing styles, delays, and loop support.",
			videoUrl: "https://streamable.com/jfcgui",
			gameUrl: "https://www.roblox.com/games/122345891327992/ShowcasePortfolio",
		},
		{
			title: "Formatter",
			description: "Utility library for abbreviating large numbers, formatting ordinals, and converting string representations to numeric values.",
			videoUrl: "https://streamable.com/x373ge",
			gameUrl: "https://www.roblox.com/games/122345891327992/ShowcasePortfolio",
		},
	],
} as const;
