// Add this to your existing @/lib/azureOpenAI.js file

import { embed, generateText, streamText } from 'ai';
import { createAzure } from '@ai-sdk/azure';

export const azureProvider = createAzure({
  apiKey: process.env.AZURE_OPENAI_API_KEY,
  baseURL: process.env.AZURE_OPENAI_TARGET,
});

export async function generateEmbedding(input) {
  try {
    const { embedding } = await embed({
      model: azureProvider.embedding(process.env.AZURE_OPENAI_EMBEDDING_DEPLOYMENT),
      value: input,
    });
    return { embedding };
  } catch (error) {
    console.error('Embedding generation error:', error);
    // If embed doesn't work, let's try the direct approach
    try {
      const embeddingModel = azureProvider.embedding(process.env.AZURE_OPENAI_EMBEDDING_DEPLOYMENT);
      const result = await embeddingModel.doEmbed({ values: [input] });
      return { embedding: result.embeddings[0] };
    } catch (fallbackError) {
      console.error('Fallback embedding error:', fallbackError);
      throw error;
    }
  }
}

export async function generateChatResponse(messages) {
  try {
    const { text } = await generateText({
      model: azureProvider(process.env.AZURE_OPENAI_CHAT_DEPLOYMENT || process.env.AZURE_OPENAI_DEPLOYMENT),
      messages: messages,
      temperature: 0.7,
      maxTokens: 1000,
    });
    
    return { text };
  } catch (error) {
    console.error('Chat response generation error:', error);
    throw error;
  }
}

// New streaming function using ai SDK
export async function generateChatResponseStream(messages) {
  try {
    const result = await streamText({
      model: azureProvider(process.env.AZURE_OPENAI_CHAT_DEPLOYMENT || process.env.AZURE_OPENAI_DEPLOYMENT),
      messages: messages,
      temperature: 0.7,
      maxTokens: 1000,
    });
    
    return result.textStream;
  } catch (error) {
    console.error('Streaming error:', error);
    throw new Error(`Streaming failed: ${error.message}`);
  }
}