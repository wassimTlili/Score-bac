import { azureProvider } from './azureOpenAI';
import { OpenAIEmbeddingModel } from 'ai';

const embeddingModel = new OpenAIEmbeddingModel({
  provider: azureProvider.embedding(process.env.AZURE_OPENAI_EMBEDDING_DEPLOYMENT),
});

export async function generateEmbedding(input) {
  const result = await embeddingModel.embed(input);
  return result;
}
