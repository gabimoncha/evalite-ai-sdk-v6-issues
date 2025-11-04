import { generateText, Output, stepCountIs } from "ai";
import { evalite } from "evalite";
import {
	model,
	providerOptions,
	schema,
	systemPromptWithTool,
	testData,
	tools,
} from "./options";

evalite.skip("generateText with schema / json mode cannot be combined with tool/function calling", {
	data: testData,
	task: async (input) => {
		const result = await generateText({
			model: model,
			providerOptions,
			prompt: input,
			system: systemPromptWithTool,
			tools,
			toolChoice: "required",
			experimental_output: Output.object({
				schema,
			}),
      stopWhen: stepCountIs(20)
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
