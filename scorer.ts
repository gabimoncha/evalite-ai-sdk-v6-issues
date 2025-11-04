import {google} from "@ai-sdk/google";
import { generateObject } from "ai";
import { createScorer } from "evalite";
import {traceAISDKModelV3} from "evalite/ai-sdk";
import { z } from "zod";

const model = google("gemini-2.5-flash");
// const model = traceAISDKModelV3(google("gemini-2.5-flash"));
const providerOptions = {
  google: {
    thinkingConfig: { thinkingBudget: 8192, includeThoughts: true }
  }
};

export const PossibleAutoeval =
	createScorer<string, { output: object }, { actions: object[] }>({
		name: "Possible autoeval",
		description:
			"Test whether an output is a possible solution to the challenge posed in the input.",
		scorer: async (opt) => {
			const expected = JSON.stringify(opt.expected?.actions || []);
			const output = JSON.stringify(opt.output.output);
			return checkInstructions({
				prompt: possible_prompt(opt.input, expected, output),
			});
		},
	});

export const PossibleCustom = createScorer<
	string,
	{ output: object },
	{ actions: object[] }
>({
	name: "Possible custom",
	description:
		"Test whether an output is a possible solution to the challenge posed in the input.",
	scorer: async (opt) => {
		const expected = JSON.stringify(opt.expected?.actions || []);
		const output = JSON.stringify(opt.output.output);
		return checkInstructions({
			prompt: possible_custom_prompt(opt.input, expected, output),
		});
	},
});

const checkInstructions = async (opts: { prompt: string }) => {
	const result = await generateObject({
		model: model,
		providerOptions: providerOptions,
		prompt: opts.prompt,
		schema: z.object({
			score: z.enum(["A", "B", "C"]),
			missing_instructions: z
				.array(z.string())
				.describe("A list of instructions that are missing"),
			correct_instructions: z
				.array(z.string())
				.describe("A list of instructions that are correct"),
			rationale: z.string().describe("Brief explanation of the score"),
		}),
	});

	/**
	 * LLM's are well documented at being poor at generating
	 */
	const scores = {
		A: 0,
		B: 1,
		C: 0.5,
	};

	return {
		score: scores[result.object.score],
		metadata: {
			rationale: result.object.rationale,
			missing_instructions: result.object.missing_instructions,
			correct_instructions: result.object.correct_instructions,
		},
	};
};

const possible_custom_prompt = (
	input: string,
	expected: string,
	output: string,
) => `
You are analyzing a statement for a task.
You want to figure out if the statement declares the task as impossible or provides a solution.
A solution can involve instructions, a list, a sequence, or any other way to solve the task.
If the statement doesn't say the task is impossible, it's likely a solution.

[BEGIN DATA]
************
[Task]: ${input}
************
[Submission]: ${output}
************
[Expected]: ${expected}
************
[END DATA]

(A) The statement declares the task to be impossible
(B) The statement provides instructions on how to solve a given task, or provides a solution similar to the expected output
(C) The statement provides partial instructions on how to solve a given task, but is missing important details
`;

const possible_prompt = (input: string, expected: string, output: string) => `
You are analyzing a statement for a task.
You want to figure out if the statement declares the task as impossible or provides a solution.
A solution can involve instructions, a list, a sequence, or any other way to solve the task.
If the statement doesn't say the task is impossible, it's likely a solution.

[BEGIN DATA]
************
[Task]: ${input}
************
[Submission]: ${output}
************
[END DATA]

(A) The statement declares the task to be impossible
(B) The statement provides instructions on how to solve a given task, or provides a solution
`;
