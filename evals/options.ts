import { google } from "@ai-sdk/google";
import { groq } from "@ai-sdk/groq";
import { openrouter } from "@openrouter/ai-sdk-provider";
import { type LanguageModel, type ToolSet, tool } from "ai";
import { en } from "chrono-node";
import dayjs from "dayjs";
import z from "zod";

export const systemPrompt = `
You are a helpful assistant that can help with tasks and events.

Today is ${dayjs().format("YYYY-MM-DD")}

Your goal is to create the user's schedule. Follow the JSON schema provided.
`;

// console.log("systemPrompt:", systemPrompt);

export const systemPromptWithTool = `
You are a helpful assistant that can help with tasks and events.

Today is ${dayjs().format("YYYY-MM-DD")}

You have access to resolveDate tool to convert natural language date expressions from the input into ISO date strings. Besides single dates, you can also pass ranges of dates to the tool (e.g. "Wednesday to Monday").

Your task is to first get the ISO date string and then to create the user's schedule.
Follow the JSON schema provided.
`;

// export const model: LanguageModel = openrouter('openai/gpt-oss-120b', {
//   reasoning: {
//     effort: 'medium',
//   },
// });
export const model: LanguageModel = groq("openai/gpt-oss-120b");
//export const model = traceAISDKModel(google('gemini-2.5-flash-lite'));
export const providerOptions = {
	google: {
		thinkingConfig: { thinkingBudget: 8192, includeThoughts: true },
	},
};

export const outputSchema = z.object({
	actions: z.array(
		z.object({
			name: z.string().describe("Concise action name"),
			type: z
				.enum(["task", "travel", "meeting", "event", "habit", "goal"])
				.describe("The type of the action"),
			startDate: z
				.string()
				.nullable()
				.describe(
					"ISO 8601 format (YYYY-MM-DD). Use when date is mentioned, for repeating actions, or in chronological order.",
				),
			endDate: z
				.string()
				.nullable()
				.describe(
					"ISO 8601 format (YYYY-MM-DD). For deadlines, due dates, or multi-day actions",
				),
			startTime: z
				.string()
				.nullable()
				.describe(
					"24h format (HH:mm). Use when specific time mentioned, inferred from the input, or chronological order.",
				),
			endTime: z
				.string()
				.nullable()
				.describe(
					"24h format (HH:mm). Use for natural language boundaries (by/until/finish at) or time-blocked sequential actions",
				),
			duration: z
				.number()
				.min(10)
				.nullable()
				.describe("Duration in minutes or null if under 10 minutes"),
		}),
	),
});

// Alias for backward compatibility
export const schema = outputSchema;

export const tools = {
	resolveDate: tool({
		name: "resolveDate",
		description:
			"Convert natural language date expressions into ISO date strings.",
		inputSchema: z.object({
			input: z
				.string()
				.describe('Natural language date expression, e.g. "Tuesday next week"'),
		}),
		execute: async ({ input }) => {
			const reference = dayjs().toDate();
			const parsed = en.parse(input, reference, {
				forwardDate: true,
			});

			if (!parsed || parsed.length === 0) return null;

			return parsed.map((p) => ({
				start: dayjs(p.start.date()).format("YYYY-MM-DD"),
				end: p.end ? dayjs(p.end.date()).format("YYYY-MM-DD") : null,
			}));
		},
	}),
} satisfies ToolSet;

const friday = dayjs().day(5).format("YYYY-MM-DD");
const monday = dayjs().add(1, "week").day(1).format("YYYY-MM-DD");
const tuesday = dayjs().add(1, "week").day(2).format("YYYY-MM-DD");
const next_month_3rd = dayjs().add(1, "month").date(3);
const next_3rd = next_month_3rd.format("YYYY-MM-DD");
const next_7th = next_month_3rd.day(5).format("YYYY-MM-DD");
const next_9th = next_month_3rd.day(8).format("YYYY-MM-DD");

export const testData = [
	{
		// The input
		input:
			"My therapist called and asked me if I can go on Friday at 16:00, I also have to pay the rent until the 3rd of next month, and I'm going on vacation the weekend after",

		// The expected answer
		expected: {
			actions: [
				{
					name: "Travel to therapy",
					type: "task",
					startDate: `${friday}`,
					startTime: "15:15",
					endTime: "15:45",
				},
				{
					name: "Therapy session",
					type: "meeting",
					startDate: `${friday}`,
					startTime: "16:00",
					endTime: "16:50",
				},
				{
					name: "Travel back home",
					type: "task",
					startDate: `${friday}`,
					startTime: "17:05",
					endTime: "17:35",
				},
				{ name: "Pay bill", type: "task", endDate: `${next_3rd}` },
				{
					name: "Vacation",
					type: "event",
					startDate: `${next_7th}`,
					endDate: `${next_9th}`,
				},
			],
		},
	},
	{
    only: true,
		// The input
		input: "Monday to Tuesday I need to do my homework for 2 hours each day and this weekend i want to go for a run with my friends on saturday and on sunday I want to go to the gym",

		// The expected answer
		expected: {
			actions: [
				{
					name: "Homework",
					type: "task",
					startDate: `${monday}`,
					endDate: `${tuesday}`,
					duration: 120,
				},
			],
		},
	},
];
