import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { generateEmbedding, generateChatResponse } from '@/lib/azureOpenAI';

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
    
    let similarChunks;
    try {
      // Try vector similarity search first
      similarChunks = await prisma.$queryRaw`
        SELECT e.content, e.metadata, r.title, r.type, r.filename,
               (e.embedding::vector <-> ${vectorString}::vector) as distance
        FROM "Embedding" e
        JOIN "Resource" r ON e."resourceId" = r.id
        ORDER BY e.embedding::vector <-> ${vectorString}::vector
        LIMIT 5;
      `;
    } catch (vectorError) {
      console.log('Vector search failed, falling back to text search:', vectorError.message);
      // Fallback to basic text search
      similarChunks = await prisma.embedding.findMany({
        where: {
          content: {
            contains: question,
            mode: 'insensitive'
          }
        },
        include: {
          resource: true
        },
        take: 5
      });
    }

    // 3. Prepare context from retrieved chunks
    const context = similarChunks.length > 0 
      ? similarChunks
          .map(chunk => `Document: ${chunk.title}\nContent: ${chunk.content}`)
          .join('\n\n---\n\n')
      : 'Aucun contexte spécifique trouvé dans les documents.';

    // 4. Generate response using Azure OpenAI
    const messages = [
      {
        role: 'system',
        content: `Tu es Guide El Bac, un assistant intelligent spécialisé dans l'orientation post-bac en Tunisie. 
        Tu aides les étudiants avec les scores du bac, l'orientation universitaire, et les conseils académiques.
        
        Utilise les informations suivantes pour répondre à la question de l'étudiant de manière précise et utile.
        Si les informations ne sont pas suffisantes dans le contexte fourni, utilise tes connaissances générales 
        sur le système éducatif tunisien pour donner une réponse utile.
        
        Sois toujours encourageant et constructif dans tes réponses.
        
        Contexte disponible:
        ${context}
        `
      },
      {
        role: 'user',
        content: question
      }
    ];

    const { text: answer } = await generateChatResponse(messages);

    return NextResponse.json({ answer });

  } catch (error) {
    console.error('API Chat Error:', error);
    
    // Provide a fallback response if there's an error
    let fallbackAnswer = 'Je rencontre actuellement des difficultés techniques. ';
    
    if (error.message?.includes('embedding')) {
      fallbackAnswer += 'Pouvez-vous reformuler votre question de manière plus simple ?';
    } else if (error.message?.includes('database')) {
      fallbackAnswer += 'Il y a un problème avec la base de données. Veuillez réessayer dans quelques instants.';
    } else {
      fallbackAnswer += 'Veuillez réessayer votre question dans quelques instants.';
    }

    return NextResponse.json({ 
      answer: fallbackAnswer,
      error: 'Erreur technique temporaire'
    });
  }
}