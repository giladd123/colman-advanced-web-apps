import OpenAI from "openai";

let client: OpenAI;

function init() {
  if (!client) {
    client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY! });
  }
}

export async function getEmbedding(text: string): Promise<number[]> {
  init();
  const response = await client.embeddings.create({
    model: "text-embedding-3-small",
    input: text,
  });
  return response.data[0].embedding;
}

export async function getEmbeddingWithContext(
  content: string,
  postContent?: string,
): Promise<number[]> {
  init();
  const textToSummarize = postContent ?? content;
  const summaryResponse = await client.chat.completions.create({
    model: "gpt-4o-mini",
    messages: [
      {
        role: "user",
        content: `In one sentence, summarize the key programming topic or question discussed in this forum content.\n\nContent: ${textToSummarize}`,
      },
    ],
    max_tokens: 60,
  });
  const summary = summaryResponse.choices[0].message.content || "";
  return getEmbedding(`${content}\n\nContext: ${summary}`);
}

export async function askLLM(prompt: string): Promise<string> {
  init();
  const response = await client.chat.completions.create({
    model: "gpt-4o-mini",
    messages: [{ role: "user", content: prompt }],
  });
  return response.choices[0].message.content || "";
}
