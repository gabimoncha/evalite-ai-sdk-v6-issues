import { generateObject } from "ai";
import { evalite } from "evalite";
import {actionSchema, model, providerOptions, systemPrompt, testData} from "./options";

evalite.skip("generateObject", {
	data: testData,
	task: async (input) => {
		const result = await generateObject({
			model: model,
			providerOptions: providerOptions,
			system: systemPrompt,
      output: 'array',
      schema: actionSchema,
			prompt: input,
		});

		return result;
	},
	columns: async ({ expected, output }) => {
		return [
			{
				label: "Reasoning",
				value: output.reasoning,
			},
			{
				label: "Output",
				value: output.object,
			},
			{
				label: "Expected",
				value: expected,
			},
		];
	},
});
