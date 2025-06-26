import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { generateEmbedding, generateChatResponseStream } from '@/lib/azureOpenAI';

const prisma = new PrismaClient();

export async function POST(req) {
  try {
    console.log('API Chat: Request received');
    
    // Parse the request body
    let body;
    try {
      body = await req.json();
      console.log('API Chat: Request body parsed:', body);
    } catch (parseError) {
      console.error('API Chat: Failed to parse request body:', parseError);
      return NextResponse.json(
        { error: 'Invalid JSON in request body' }, 
        { status: 400 }
      );
    }

    const { question } = body;
    console.log('API Chat: Question extracted:', question);

    // Validate question (removed minimum length requirement)
    if (!question) {
      console.log('API Chat: No question provided');
      return NextResponse.json(
        { error: 'Question manquante' }, 
        { status: 400 }
      );
    }

    if (typeof question !== 'string') {
      console.log('API Chat: Question is not a string:', typeof question);
      return NextResponse.json(
        { error: 'La question doit être une chaîne de caractères' }, 
        { status: 400 }
      );
    }

    if (question.trim().length > 1000) {
      console.log('API Chat: Question too long:', question.trim().length);
      return NextResponse.json(
        { error: 'La question ne peut pas dépasser 1000 caractères' }, 
        { status: 400 }
      );
    }

    console.log('API Chat: Question validation passed');

    // 1. Generate embedding for the question
    console.log('API Chat: Generating embedding...');
    let questionEmbedding;
    try {
      const result = await generateEmbedding(question);
      questionEmbedding = result.embedding;
      console.log('API Chat: Embedding generated successfully');
    } catch (embeddingError) {
      console.error('API Chat: Embedding generation failed:', embeddingError);
      // Continue without embedding-based search
      questionEmbedding = null;
    }

    // 2. Search for similar chunks
    console.log('API Chat: Searching for similar chunks...');
    let similarChunks = [];
    
    if (questionEmbedding) {
      try {
        const vectorString = `[${questionEmbedding.join(',')}]`;
        console.log('API Chat: Attempting vector similarity search...');
        
        similarChunks = await prisma.$queryRaw`
          SELECT e.content, e.metadata, r.title, r.type, r.filename,
                 (e.embedding::vector <-> ${vectorString}::vector) as distance
          FROM "Embedding" e
          JOIN "Resource" r ON e."resourceId" = r.id
          ORDER BY e.embedding::vector <-> ${vectorString}::vector
          LIMIT 5;
        `;
        console.log('API Chat: Vector search successful, found', similarChunks.length, 'chunks');
      } catch (vectorError) {
        console.log('API Chat: Vector search failed, falling back to text search:', vectorError.message);
      }
    }

    // Fallback to text search if vector search failed or no embedding
    if (similarChunks.length === 0) {
      try {
        console.log('API Chat: Attempting text-based search...');
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
        console.log('API Chat: Text search found', similarChunks.length, 'chunks');
      } catch (textSearchError) {
        console.error('API Chat: Text search also failed:', textSearchError);
        // Continue with empty context
      }
    }

    // 3. Prepare context from retrieved chunks
    console.log('API Chat: Preparing context...');
    const context = similarChunks.length > 0 
      ? similarChunks
          .map(chunk => {
            // Handle both vector search results and regular findMany results
            const title = chunk.title || chunk.resource?.title || 'Document';
            const content = chunk.content;
            return `Document: ${title}\nContent: ${content}`;
          })
          .join('\n\n---\n\n')
      : 'Aucun contexte spécifique trouvé dans les documents.';

    console.log('API Chat: Context prepared, length:', context.length);

    // 4. Generate streaming response using Azure OpenAI
    console.log('API Chat: Generating streaming chat response...');
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

    try {
      // Try streaming first
      console.log('API Chat: Using streaming response');
      const textStream = await generateChatResponseStream(messages);
      
      // Create a ReadableStream for streaming response
      const stream = new ReadableStream({
        async start(controller) {
          try {
            for await (const chunk of textStream) {
              const data = `data: ${JSON.stringify({ content: chunk })}\n\n`;
              controller.enqueue(new TextEncoder().encode(data));
            }
            
            // Send done signal
            controller.enqueue(new TextEncoder().encode('data: [DONE]\n\n'));
            controller.close();
          } catch (streamError) {
            console.error('API Chat: Streaming error:', streamError);
            const errorData = `data: ${JSON.stringify({ error: 'Erreur de streaming' })}\n\n`;
            controller.enqueue(new TextEncoder().encode(errorData));
            controller.close();
          }
        }
      });

      return new Response(stream, {
        headers: {
          'Content-Type': 'text/stream',
          'Cache-Control': 'no-cache',
          'Connection': 'keep-alive',
        },
      });
    } catch (chatError) {
      console.error('API Chat: Streaming failed, falling back to regular response:', chatError);
      
      // Fallback to regular response if streaming fails
      try {
        const { generateChatResponse } = await import('@/lib/azureOpenAI');
        const result = await generateChatResponse(messages);
        const answer = result.text;
        
        console.log('API Chat: Chat response generated successfully (fallback)');
        return NextResponse.json({ answer });
      } catch (fallbackError) {
        console.error('API Chat: Fallback also failed:', fallbackError);
        const fallbackAnswer = 'Je suis désolé, mais je rencontre des difficultés techniques pour générer une réponse personnalisée. Pouvez-vous reformuler votre question ou réessayer dans quelques instants ?';
        return NextResponse.json({ answer: fallbackAnswer });
      }
    }

  } catch (error) {
    console.error('API Chat: Unexpected error:', error);
    console.error('API Chat: Error stack:', error.stack);
    
    // Provide a more specific fallback response based on error type
    let fallbackAnswer = 'Je rencontre actuellement des difficultés techniques. ';
    
    if (error.message?.includes('embedding')) {
      fallbackAnswer += 'Pouvez-vous reformuler votre question de manière plus simple ?';
    } else if (error.message?.includes('database') || error.message?.includes('prisma')) {
      fallbackAnswer += 'Il y a un problème avec la base de données. Veuillez réessayer dans quelques instants.';
    } else if (error.message?.includes('azure') || error.message?.includes('openai')) {
      fallbackAnswer += 'Le service de génération de réponses est temporairement indisponible.';
    } else {
      fallbackAnswer += 'Veuillez réessayer votre question dans quelques instants.';
    }

    return NextResponse.json({ 
      answer: fallbackAnswer,
      error: 'Erreur technique temporaire'
    }, { status: 500 });
  }
}

// Handle GET requests (optional, for testing)
export async function GET(req) {
  return NextResponse.json({ 
    message: 'API Chat endpoint is working',
    streaming: true,
    timestamp: new Date().toISOString()
  });
}