import { generateText, type StopCondition } from "ai";
import { evalite } from "evalite";
import {
	model,
	providerOptions,
	systemPromptWithTool,
	testData,
	tools,
} from "./options";

const hasAnswer: StopCondition<typeof tools> = ({ steps }) => {
	// Stop when the model generates text containing "ANSWER:"
	return steps.some((step) => step.content[0]?.type === "text");
};

evalite.skip("generateText", {
	data: testData,
	task: async (input) => {
		const result = await generateText({
			model: model,
			providerOptions,
			prompt: input,
			system: systemPromptWithTool,
			tools,
			stopWhen: hasAnswer,
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
		];
	},
	// scorers: [PossibleAutoeval, PossibleCustom],
});
