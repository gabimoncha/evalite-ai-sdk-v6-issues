import {
	Experimental_Agent as Agent,
	Output,
	stepCountIs,
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

const agent = new Agent({
	model,
	system: systemPromptWithTool,
	tools,
	toolChoice: "required",
	experimental_output: Output.object({
		schema,
	}),
	stopWhen: stepCountIs(20),
});

evalite.skip("agent / json mode cannot be combined with tool/function calling", {
	data: testData,
	task: async (input) => {
		const result = await agent.generate({
			providerOptions,
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
				value: output,
			},
			{
				label: "Expected",
				value: expected,
			},
		];
	},
	// scorers: [PossibleAutoeval, PossibleCustom],
});
