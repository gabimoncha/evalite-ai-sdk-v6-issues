import { gateway, generateObject, type LanguageModel } from 'ai';
import { createScorer } from 'evalite';
import { z } from 'zod';

export const FactualityAutoeval = (model: LanguageModel = gateway('xai/grok-4-fast-reasoning')) =>
	createScorer<string, any>({
		name: 'Factuality',
		description: 'Test whether an output is factual, compared to an original (`expected`) value.',
		scorer: async (opt) => {
      const output = typeof opt.output === 'string' ? opt.output : JSON.stringify(opt.output);
      const expected =
        typeof opt.expected === 'string' ? opt.expected : JSON.stringify(opt.expected);

			return checkFactuality({
				prompt: factuality_prompt(opt.input, output, expected),
				model,
			});
		},
	});

const checkFactuality = async (opts: { prompt: string; model: LanguageModel }) => {
	const result = await generateObject({
		model: opts.model,
		prompt: opts.prompt,
		schema: z.object({
			score: z.enum(['A', 'B', 'C', 'D', 'E']),
			rationale: z.string().describe('Brief explanation of the score'),
		}),
		seed: 42,
		providerOptions: {
			openrouter: {
				reasoning: {
					effort: 'high',
				},
			},
		},
	});

	/**
	 * LLM's are well documented at being poor at generating
	 */
	const scores = {
		A: 1,
		B: 0.75,
		C: 0.5,
		D: 0.25,
		E: 0,
	};

	return {
		score: scores[result.object.score],
		metadata: {
			rationale: result.object.rationale,
		},
	};
};

const factuality_prompt = (input: string, expected: string, output: string) => `
You are comparing a submitted answer to an expert answer on a given question. Here is the data:
[BEGIN DATA]
************
[Question]: ${input}
************
[Expert]: ${expected}
************
[Submission]: ${output}
************
[END DATA]

Compare the factual content of the submitted answer with the expert answer. Ignore any differences in style, grammar, or punctuation.
The submitted answer may either be a subset or superset of the expert answer, or it may conflict with it. Determine which case applies. Answer the question by selecting one of the following options:
(A) The submitted answer contains all the same details as the expert answer.
(B) The answers differ, but these differences don't matter from the perspective of factuality.
(C) The submitted answer is a superset of the expert answer and is fully consistent with it.
(D) The submitted answer is a subset of the expert answer and is fully consistent with it.
(E) There is a disagreement between the submitted answer and the expert answer.
`;
