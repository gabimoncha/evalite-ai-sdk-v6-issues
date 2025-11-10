import { generateObject, type LanguageModel } from 'ai';
import { createScorer } from 'evalite';
import { z } from 'zod';

export const PossibleAutoeval = (model: LanguageModel) =>
	createScorer<string, any>({
		name: 'Possible autoeval',
		description:
			'Test whether an output is a possible solution to the challenge posed in the input.',
		scorer: async (opt) => {
      const output = typeof opt.output === 'string' ? opt.output : JSON.stringify(opt.output);
			return checkInstructions({
				prompt: possible_prompt(opt.input, output),
				model,
			});
		},
	});

const checkInstructions = async (opts: { prompt: string; model: LanguageModel }) => {
	const result = await generateObject({
		model: opts.model,
		prompt: opts.prompt,
		schema: z.object({
			score: z.enum(['YES', 'NO']),
			rationale: z.string().describe('Brief explanation of the score'),
		}),
	});

	/**
	 * LLM's are well documented at being poor at generating
	 */
	const scores = {
		YES: 1,
		NO: 0,
	};

	return {
		score: scores[result.object.score],
		metadata: {
			rationale: result.object.rationale,
		},
	};
};

const possible_prompt = (input: string, output: string) => `
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

(YES) The statement declares the task to be impossible
(NO) The statement provides instructions on how to solve a given task, or provides a solution
`;
