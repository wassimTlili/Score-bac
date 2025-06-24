import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { generateText } from 'ai';
import { azureProvider } from '@/lib/azureOpenAI';

const prisma = new PrismaClient();

export async function POST(req) {
  try {
    const { question } = await req.json();

    if (!question || question.trim().length < 3) {
      return NextResponse.json({ error: 'Question invalide' }, { status: 400 });
    }

    // 1. Generate embedding for the question
    const { embedding: questionEmbedding } = await generateEmbedding(question);

    // 2. Search for similar chunks using vector similarity
    const vectorString = `[${questionEmbedding.join(',')}]`;
    
    const similarChunks = await prisma.$queryRaw`
      SELECT e.content, e.metadata, r.title, r.type, r.filename,
             (e.embedding <-> ${vectorString}::vector) as distance
      FROM "Embedding" e
      JOIN "Resource" r ON e."resourceId" = r.id
      ORDER BY e.embedding <-> ${vectorString}::vector
      LIMIT 5;
    `;

    // 3. Prepare context from retrieved chunks
    const context = similarChunks
      .map(chunk => `Document: ${chunk.title}\nContent: ${chunk.content}`)
      .join('\n\n---\n\n');

    // 4. Generate response using Azure OpenAI
    const { text: answer } = await generateText({
      model: azureProvider.chat(process.env.AZURE_OPENAI_CHAT_DEPLOYMENT),
      messages: [
        {
          role: 'system',
          content: `Tu es Guide El Bac, un assistant intelligent spécialisé dans l'orientation post-bac en Tunisie. 
          Tu aides les étudiants avec les scores du bac, l'orientation universitaire, et les conseils académiques.
          
          Utilise les informations suivantes pour répondre à la question de l'étudiant de manière précise et utile.
          Si les informations ne sont pas suffisantes, dis-le clairement et propose des alternatives.
          
          Contexte disponible:
          ${context}
          `
        },
        {
          role: 'user',
          content: question
        }
      ],
      temperature: 0.7,
      maxTokens: 500,
    });

    return NextResponse.json({ answer });

  } catch (error) {
    console.error('API Chat Error:', error);
    return NextResponse.json(
      { error: 'Erreur interne du serveur' }, 
      { status: 500 }
    );
  }
}

// Helper function to generate embeddings
async function generateEmbedding(text) {
  const { embedding } = await generateEmbedding({
    model: azureProvider.embedding(process.env.AZURE_OPENAI_EMBEDDING_DEPLOYMENT),
    input: text,
  });
  return { embedding };
}