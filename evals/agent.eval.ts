import {
	Output,
	stepCountIs,
  ToolLoopAgent,
} from "ai";
import { evalite } from "evalite";
// import { PossibleAutoeval, PossibleCustom } from "../scorer";
import {
	model,
	providerOptions,
	schema,
	systemPromptWithTool,
	testData,
	tools,
} from "./options";

const agent = new ToolLoopAgent({
	model,
  providerOptions,
	instructions: systemPromptWithTool,
	tools,
	toolChoice: "required",
	output: Output.object({
		schema,
	}),
});

evalite.skip("agent", {
	data: testData,
	task: async (input) => {
		const result = await agent.generate({
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
	// scorers: [PossibleAutoeval, PossibleCustom],
});
