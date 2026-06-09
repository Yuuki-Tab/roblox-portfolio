type Token = { t: string; v: string };
type Line = { parts: Token[]; indent: number };
export type TerminalFile = { name: string; lines: Line[] };

export const TERMINAL_FILES: TerminalFile[] = [
	{
		name: "Yuuki.luau",
		lines: [
			{ indent: 0, parts: [{ t: "t-comment", v: "--// Yuuki · Luau Developer" }] },
			{
				indent: 0,
				parts: [
					{ t: "t-keyword", v: "local" },
					{ t: "t-var", v: " Yuuki" },
					{ t: "t-op", v: " = {}" },
				],
			},
			{
				indent: 0,
				parts: [
					{ t: "t-var", v: "Yuuki" },
					{ t: "t-op", v: ".__index = " },
					{ t: "t-var", v: "Yuuki" },
				],
			},
			{ indent: 0, parts: [] },
			{
				indent: 0,
				parts: [
					{ t: "t-keyword", v: "function" },
					{ t: "t-fn", v: " Yuuki" },
					{ t: "t-op", v: ":" },
					{ t: "t-fn", v: "init" },
					{ t: "t-op", v: "()" },
				],
			},
			{
				indent: 1,
				parts: [
					{ t: "t-keyword", v: "self" },
					{ t: "t-op", v: "." },
					{ t: "t-var", v: "skills" },
					{ t: "t-op", v: " = {" },
				],
			},
			{
				indent: 2,
				parts: [
					{ t: "t-string", v: '"Luau"' },
					{ t: "t-op", v: ", " },
					{ t: "t-string", v: '"Systems"' },
					{ t: "t-op", v: ", " },
					{ t: "t-string", v: '"RNG"' },
				],
			},
			{ indent: 1, parts: [{ t: "t-op", v: "}" }] },
			{
				indent: 1,
				parts: [
					{ t: "t-keyword", v: "self" },
					{ t: "t-op", v: "." },
					{ t: "t-var", v: "experience" },
					{ t: "t-op", v: " = " },
					{ t: "t-num", v: "5" },
					{ t: "t-comment", v: " --// years" },
				],
			},
			{ indent: 0, parts: [{ t: "t-keyword", v: "end" }] },
			{ indent: 0, parts: [] },
			{
				indent: 0,
				parts: [
					{ t: "t-keyword", v: "function" },
					{ t: "t-fn", v: " Yuuki" },
					{ t: "t-op", v: ":" },
					{ t: "t-fn", v: "hire" },
					{ t: "t-op", v: "(): " },
					{ t: "t-type", v: "boolean" },
				],
			},
			{
				indent: 1,
				parts: [
					{ t: "t-keyword", v: "return" },
					{ t: "t-type", v: " true" },
				],
			},
			{ indent: 0, parts: [{ t: "t-keyword", v: "end" }] },
		],
	},
	{
		name: "Yuuki.py",
		lines: [
			{ indent: 0, parts: [{ t: "t-comment", v: "# Yuuki · Python Developer" }] },
			{
				indent: 0,
				parts: [
					{ t: "t-keyword", v: "class" },
					{ t: "t-fn", v: " Yuuki" },
					{ t: "t-op", v: ":" },
				],
			},
			{
				indent: 1,
				parts: [
					{ t: "t-keyword", v: "def" },
					{ t: "t-fn", v: " __init__" },
					{ t: "t-op", v: "(self):" },
				],
			},
			{
				indent: 2,
				parts: [
					{ t: "t-keyword", v: "self" },
					{ t: "t-op", v: ".skills = [" },
				],
			},
			{
				indent: 3,
				parts: [
					{ t: "t-string", v: '"Python"' },
					{ t: "t-op", v: ", " },
					{ t: "t-string", v: '"Bots"' },
					{ t: "t-op", v: ", " },
					{ t: "t-string", v: '"Automation"' },
				],
			},
			{ indent: 2, parts: [{ t: "t-op", v: "]" }] },
			{
				indent: 2,
				parts: [
					{ t: "t-keyword", v: "self" },
					{ t: "t-op", v: ".experience = " },
					{ t: "t-num", v: "3" },
					{ t: "t-comment", v: "  # years" },
				],
			},
			{ indent: 0, parts: [] },
			{
				indent: 1,
				parts: [
					{ t: "t-keyword", v: "def" },
					{ t: "t-fn", v: " hire" },
					{ t: "t-op", v: "(self) -> " },
					{ t: "t-type", v: "bool" },
					{ t: "t-op", v: ":" },
				],
			},
			{
				indent: 2,
				parts: [
					{ t: "t-keyword", v: "return" },
					{ t: "t-type", v: " True" },
				],
			},
		],
	},
	{
		name: "Yuuki.java",
		lines: [
			{ indent: 0, parts: [{ t: "t-comment", v: "// Yuuki · Java Developer" }] },
			{
				indent: 0,
				parts: [
					{ t: "t-keyword", v: "public class" },
					{ t: "t-fn", v: " Yuuki" },
					{ t: "t-op", v: " {" },
				],
			},
			{
				indent: 1,
				parts: [
					{ t: "t-type", v: "String" },
					{ t: "t-op", v: "[] " },
					{ t: "t-var", v: "skills" },
					{ t: "t-op", v: " = {" },
				],
			},
			{
				indent: 2,
				parts: [
					{ t: "t-string", v: '"Java"' },
					{ t: "t-op", v: ", " },
					{ t: "t-string", v: '"OOP"' },
					{ t: "t-op", v: ", " },
					{ t: "t-string", v: '"Algorithms"' },
				],
			},
			{ indent: 1, parts: [{ t: "t-op", v: "};" }] },
			{
				indent: 1,
				parts: [
					{ t: "t-type", v: "int" },
					{ t: "t-op", v: " " },
					{ t: "t-var", v: "experience" },
					{ t: "t-op", v: " = " },
					{ t: "t-num", v: "2" },
					{ t: "t-comment", v: "; // years" },
				],
			},
			{ indent: 0, parts: [] },
			{
				indent: 1,
				parts: [
					{ t: "t-keyword", v: "public" },
					{ t: "t-type", v: " boolean" },
					{ t: "t-fn", v: " hire" },
					{ t: "t-op", v: "() {" },
				],
			},
			{
				indent: 2,
				parts: [
					{ t: "t-keyword", v: "return" },
					{ t: "t-type", v: " true" },
					{ t: "t-op", v: ";" },
				],
			},
			{ indent: 1, parts: [{ t: "t-op", v: "}" }] },
			{ indent: 0, parts: [{ t: "t-op", v: "}" }] },
		],
	},
];
