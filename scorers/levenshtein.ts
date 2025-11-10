import { createScorer } from 'evalite';
import { distance } from 'fastest-levenshtein';

export const LevenshteinAutoeval = createScorer<string, any>({
	name: 'Levenshtein autoeval',
	description: 'Uses the Levenshtein distance to compare two strings.',
	scorer: async (opt) => {
		const outputStr = typeof opt.output === 'string' ? opt.output : JSON.stringify(opt.output);
		const expectedStr =
			typeof opt.expected === 'string' ? opt.expected : JSON.stringify(opt.expected);

		const [output, expected] = [`${outputStr}`, `${expectedStr}`];
		const maxLen = Math.max(output.length, expected.length);

		let score = 1;
		if (maxLen > 0) {
			score = 1 - distance(output, expected) / maxLen;
		}

		return {
			score,
		};
	},
});
