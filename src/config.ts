export const config = {
	username: "Yuuki",
	tagline: "Luau Developer · Systems Programming",
	bio: "Hi, I'm Yuuki. I'm a Luau developer specializing in systems programming for Roblox modular architectures, RNG systems, performance optimizations, and bug fixing. Programming is my passion. I enjoy solving hard problems and I'm always looking to learn and grow through real work and experience.",

	socials: [
		{ label: "Roblox", url: "https://www.roblox.com/users/1205213971/profile", id: "roblox" },
		{ label: "Discord", url: "https://discord.com/users/636602697323380757", id: "discord" },
	],

	stats: [
		{ value: "6+", label: "Systems built", icon: "code" },
		{ value: "5 yrs", label: "Luau experience", icon: "clock" },
		{ value: "6", label: "Roblox projects", icon: "gamepad" },
	],

	contributions: {
		games: [
			{
				title: "Steal a Singer",
				gameUrl: "https://www.roblox.com/games/103294729391923/Steal-a-Singer",
				thumbnail: "/thumbnails/game-steal-a-singer.png"
			},
			{
				title: "Find The Countryrot",
				gameUrl: "https://www.roblox.com/games/127360061895099/Find-The-Countryrot",
				thumbnail: "/thumbnails/game-find-the-countryrot.png"
			},
		],
		jams: [
			{
				title: "Build a Gift",
				gameUrl: "https://www.roblox.com/games/118888653495734/Build-a-Gift",
				thumbnail: "/thumbnails/jam-build-a-gift.png"
			},
			{
				title: "Hide the BOMB",
				gameUrl: "https://www.roblox.com/games/74450875081176/Hide-the-BOMB",
				thumbnail: "/thumbnails/jam-hide-the-bomb.png"
			},
		],
	},

	projects: [
		{
			title: "Maze Generation Algorithm",
			description: "Creates dynamic, random mazes with customizable rooms and unique paths.",
			videoUrl: "https://streamable.com/8du1mn",
			gameUrl: "https://www.roblox.com/games/102097252948710/MazePortfolio",
		},
		{
			title: "TimerSystem",
			description: "Customizable timer with configurable tick intervals, pause/resume, and on-tick/on-complete callbacks.",
			videoUrl: "https://streamable.com/6scqd4",
			gameUrl: "https://www.roblox.com/games/122345891327992/ShowcasePortfolio",
		},
		{
			title: "Global LeaderboardManager",
			description: "Retrieves, updates, and sorts player data with configurable update intervals, page sizes, and minimum scores.",
			videoUrl: "https://streamable.com/6s94dv",
			gameUrl: "https://www.roblox.com/games/122345891327992/ShowcasePortfolio",
		},
		{
			title: "2D Camera",
			description: "Smooth side-scrolling camera system with dynamic movement and precise control.",
			videoUrl: "https://streamable.com/l7svbd",
			gameUrl: "https://www.roblox.com/games/118752248103914/Parkour2D-Portfolio",
		},
		{
			title: "Tween",
			description: "Custom animation system that transitions object properties over time with easing styles, delays, and loop support.",
			videoUrl: "https://streamable.com/y6lp8p",
			gameUrl: "https://www.roblox.com/games/122345891327992/ShowcasePortfolio",
		},
		{
			title: "Formatter",
			description: "Utility library for abbreviating large numbers, formatting ordinals, and converting string representations to numeric values.",
			videoUrl: "https://streamable.com/jvb7zz",
			gameUrl: "https://www.roblox.com/games/122345891327992/ShowcasePortfolio",
		},
	],
} as const;

export type Project = (typeof config.projects)[number];
