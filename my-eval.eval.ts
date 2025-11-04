import { google } from "@ai-sdk/google";
import { Output, ToolLoopAgent, tool } from "ai";
import { en } from "chrono-node";
import dayjs from "dayjs";
import { evalite } from "evalite";
// import { traceAISDKModelV3 } from "evalite/ai-sdk";
import z from "zod";

// import { PossibleAutoeval, PossibleCustom } from "./scorer";


const friday = dayjs().day(5).format("YYYY-MM-DD");
const monday = dayjs().add(1, "week").day(1).format("YYYY-MM-DD");
const tuesday = dayjs().add(1, "week").day(2).format("YYYY-MM-DD");
const next_month_3rd = dayjs().add(1, "month").date(3);
const next_3rd = next_month_3rd.format("YYYY-MM-DD");
const next_7th = next_month_3rd.day(5).format("YYYY-MM-DD");
const next_9th = next_month_3rd.day(8).format("YYYY-MM-DD");

// const model = traceAISDKModelV3(google("gemini-2.5-flash"));
const providerOptions = {
	google: {
		thinkingConfig: { thinkingBudget: 8192, includeThoughts: true },
	},
};

evalite("output judge", {
	data: [
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
			// The input
			input: "Monday to Tuesday I need to do my homework for 2 hours each day",

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
	],
	task: async (input) => {
    const agent = new ToolLoopAgent({
      model: google("gemini-2.5-flash"),
      providerOptions,
      instructions:
        "You are a helpful assistant that can help with tasks and events. You have access to resolveDate to convert natural language date expressions into ISO date strings.",
      tools: {
        resolveDate: tool({
          name: "resolveDate",
          description:
            "Convert natural language date expressions into ISO date strings.",
          inputSchema: z.object({
            input: z
              .string()
              .describe(
                'Natural language date expression, e.g. "Tuesday next week"',
              ),
          }),
          execute: async ({ input }) => {
            const reference = dayjs().toDate();
            const parsed = en.parseDate(input, reference, {
              forwardDate: true,
            });
    
            if (!parsed) return null;
    
            return dayjs(parsed).format("YYYY-MM-DD");
          },
        }),
      },
      output: Output.object({
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
      }),
    });


		const result = await agent.generate({
			prompt: input,
		});

		return result;
	},
	columns: async ({ expected, output }) => {
		return [
			{
				label: "Output",
				value: output.output.actions,
			},
			{
				label: "Expected",
				value: expected,
			},
		];
	},
	// scorers: [
	// 	PossibleAutoeval,
	// 	PossibleCustom,
	// ],
});
