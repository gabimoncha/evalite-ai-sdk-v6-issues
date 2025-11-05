import { generateText, Output, stepCountIs } from "ai";
import { evalite } from "evalite";
import {
  actionSchema,
	model,
	providerOptions,
	systemPromptWithTool,
	testData,
	tools,
} from "./options";

evalite.skip("generateText with schema", {
	data: testData,
	task: async (input) => {
		const result = await generateText({
			model: model,
			providerOptions,
			prompt: input,
			system: systemPromptWithTool,
			tools,
			toolChoice: "required",
			output: Output.array({
				element: actionSchema,
			}),
      stopWhen: stepCountIs(5)
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
				label: "tool calls",
				value: output.toolCalls,
			},
			{
				label: "tool results",
				value: output.toolResults,
			},
			{
				label: "output text",
				value: output.text,
			},
			{
				label: "output steps",
				value: output.steps,
			},
			{
				label: "output",
				value: output,
			},
		];
	},
});
