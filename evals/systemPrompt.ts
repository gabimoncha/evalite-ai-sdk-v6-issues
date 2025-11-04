import dayjs from "dayjs";

export const systemPrompt = `
You are a helpful assistant that can help with tasks and events.

Today is ${dayjs().format("YYYY-MM-DD")}

Your goal is to create the user's schedule. Follow the JSON schema provided.
`;

