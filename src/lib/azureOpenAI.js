import { createAzureOpenAI } from '@ai-sdk/azure';

export const azureProvider = createAzureOpenAI({
  apiKey: process.env.AZURE_OPENAI_API_KEY,
  baseURL: process.env.AZURE_OPENAI_TARGET,
});
export async function generateEmbedding(input) {
  try {
    const { embedding } = await aiGenerateEmbedding({
      model: azureProvider.embedding(process.env.AZURE_OPENAI_EMBEDDING_DEPLOYMENT),
      value: input,
    });
    return { embedding };
  } catch (error) {
    console.error('Embedding generation error:', error);
    throw error;
  }
}