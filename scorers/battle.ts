import { generateObject, type LanguageModel } from 'ai';
import { createScorer } from 'evalite';
import { z } from 'zod';

export const BattleAutoeval = (
	instructions: string,
	model: LanguageModel,
) =>
	createScorer<string, any>({
		name: 'Battle autoeval',
		description:
			'Test whether an output _better_ performs the `instructions` than the original (expected) value.',
		scorer: async (opt) => {
      const output = typeof opt.output === 'string' ? opt.output : JSON.stringify(opt.output);
      const expected =
        typeof opt.expected === 'string' ? opt.expected : JSON.stringify(opt.expected);

			return battle({
				prompt: battle_prompt(instructions, output, expected),
				model,
			});
		},
	});

const battle = async (opts: { prompt: string; model: LanguageModel }) => {
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

const battle_prompt = (instructions: string, output: string, expected: string) => `
You are comparing responses to the following instructions.

[Instruction 1]
${instructions}
[Response 1]
${output}

[Instruction 2]
${instructions}
[Response 2]
${expected}


Is the first response better than the second? You must provide one answer based on your subjective view.
`;
