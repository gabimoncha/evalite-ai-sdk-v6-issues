import { generateText, Output } from "ai";
import { evalite } from "evalite";
import {
	model,
	providerOptions,
	resolveDate,
	schema,
	systemPromptWithTool,
	testData,
} from "./options";

evalite.skip("generateText with schema", {
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
			experimental_output: Output.object({
				schema,
			}),
		});

		return result;
	},
	columns: async ({ expected, output }) => {
		return [
			{
				label: "Output",
				value: output.experimental_output.actions,
			},
			{
				label: "Expected",
				value: expected?.actions,
			},
		];
	},
});
