import { OpenAI } from 'openai';

// Create Azure OpenAI client with proper configuration
const openai = new OpenAI({
  apiKey: process.env.AZURE_OPENAI_API_KEY, 
  baseURL: `${process.env.AZURE_OPENAI_TARGET}/openai/deployments`,
  defaultQuery: { 'api-version': '2024-02-01' },
  defaultHeaders: {
    'api-key': process.env.AZURE_OPENAI_API_KEY,
  },
});

export async function generateEmbedding(input) {
  try {
    // Validate environment variables
    if (!process.env.AZURE_OPENAI_API_KEY) {
      throw new Error('AZURE_OPENAI_API_KEY environment variable is missing');
    }
    if (!process.env.AZURE_OPENAI_TARGET) {
      throw new Error('AZURE_OPENAI_TARGET environment variable is missing');
    }
    if (!process.env.AZURE_OPENAI_EMBEDDING_DEPLOYMENT) {
      throw new Error('AZURE_OPENAI_EMBEDDING_DEPLOYMENT environment variable is missing');
    }

    console.log('Generating embedding for:', input.substring(0, 100) + '...');
    
    const response = await openai.embeddings.create({
      model: process.env.AZURE_OPENAI_EMBEDDING_DEPLOYMENT,
      input: input,
    });

    console.log('Embedding generated successfully');
    return { embedding: response.data[0].embedding };
  } catch (error) {
    console.error('Embedding generation error:', error);
    throw error;
  }
}

export async function generateChatResponse(messages) {
  try {
    // Validate environment variables
    if (!process.env.AZURE_OPENAI_API_KEY) {
      throw new Error('AZURE_OPENAI_API_KEY environment variable is missing');
    }
    if (!process.env.AZURE_OPENAI_TARGET) {
      throw new Error('AZURE_OPENAI_TARGET environment variable is missing');
    }
    if (!process.env.AZURE_OPENAI_CHAT_DEPLOYMENT) {
      throw new Error('AZURE_OPENAI_CHAT_DEPLOYMENT environment variable is missing');
    }

    console.log('Generating chat response...');
    
    const response = await openai.chat.completions.create({
      model: process.env.AZURE_OPENAI_CHAT_DEPLOYMENT,
      messages: messages,
      temperature: 0.7,
      max_tokens: 500,
    });

    console.log('Chat response generated successfully');
    return { text: response.choices[0].message.content };
  } catch (error) {
    console.error('Chat generation error:', error);
    throw error;
  }
}

// For backward compatibility with the AI SDK approach
export const azureProvider = {
  chat: (model) => ({ model }),
  embedding: (model) => ({ model })
};