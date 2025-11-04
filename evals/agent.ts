import { Experimental_Agent as Agent, Output } from "ai";
import { evalite } from "evalite";
// import { PossibleAutoeval, PossibleCustom } from "../scorer";
import { model, providerOptions, resolveDate, schema, systemPromptWithTool, testData } from "./options";

const agent = new Agent({
	model,
	system:systemPromptWithTool,
	tools: {
		resolveDate,
	},
	toolChoice: "required",
	experimental_output: Output.object({
		schema,
	}),
});

evalite.skip("agent", {
	data: testData,
	task: async (input) => {
    const result = await agent.generate({
			providerOptions,
			prompt: input,
		});

		return result.experimental_output;
	},
  columns: async ({expected, output}) => {
    return [
      {
				label: 'Output',
				value: output.actions,
			},
			{
				label: 'Expected',
				value: expected?.actions,
			},
    ]
  },
	// scorers: [PossibleAutoeval, PossibleCustom],
});
