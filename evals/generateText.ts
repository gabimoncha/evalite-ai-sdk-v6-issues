import { generateText } from "ai";
import { evalite } from "evalite";
import {
	model,
	providerOptions,
	resolveDate,
	systemPromptWithTool,
  testData,
} from "./options";

evalite.skip("generateText", {
	data: testData,
	task: async (input) => {
		const result = await generateText({
			model: model,
			providerOptions,
			prompt: input,
			system: systemPromptWithTool,
			tools: {
				resolveDate,
			},
			toolChoice: "required",
		});

		return result;
	},
  columns: async ({expected, output}) => {
    return [
      {
				label: 'Output',
				value: output.text,
			},
			{
				label: 'Expected',
				value: expected?.actions,
			},
    ]
  },
	// scorers: [PossibleAutoeval, PossibleCustom],
});
