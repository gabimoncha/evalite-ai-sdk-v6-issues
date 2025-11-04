import { google } from "@ai-sdk/google";
import { generateObject } from "ai";
import { evalite } from "evalite";
import z from "zod";
import {systemPrompt} from "./systemPrompt";

// import { PossibleAutoeval, PossibleCustom } from "../scorer";

evalite("generateObject", {
	data: [
		{
			input: "Monday to Tuesday I need to do my homework for 2 hours each day",

			// The expected answer
			expected: {
				actions: [
					{
						name: "Homework",
						type: "task",
						startDate: "2025-11-04",
						endDate: "2025-11-05",
						duration: 120,
					},
				],
			},
		},
	],
	task: async (input) => {
		const result = await generateObject({
			model: google("gemini-2.5-flash-lite"),
			providerOptions: {
				google: {
					thinkingConfig: { thinkingBudget: 8192, includeThoughts: true },
				},
			},
			system: systemPrompt,
			schema: z.object({
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
			}),
			prompt: input,
		});

		return result;
	},
	columns: async ({ expected, output }) => {
		return [
			{
				label: "Output",
				value: output,
			},
			{
				label: "Expected",
				value: expected,
			},
		];
	},
	scorers: [
		{
			name: "Contains Paris",
			description: "Checks if the output contains the word 'Paris'.",
			scorer: async ({ output }) => {
				return 1;
			},
		},
	],
	// scorers: [PossibleAutoeval, PossibleCustom],
});
