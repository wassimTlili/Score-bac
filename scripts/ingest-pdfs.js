import fs from 'fs';
import path from 'path';
import pdfParse from 'pdf-parse';
import { PrismaClient } from '@prisma/client';
import { azureProvider } from '../src/lib/azureOpenAI.js';
import { generateEmbedding } from 'ai';

const prisma = new PrismaClient();
const PDF_DIR = './pdfs'; // Place your PDFs here

function chunkText(text, size = 500) {
  const chunks = [];
  for (let i = 0; i < text.length; i += size) {
    chunks.push(text.slice(i, i + size));
  }
  return chunks;
}

async function processPDF(filePath, type = 'guide') {
  const dataBuffer = fs.readFileSync(filePath);
  const pdfData = await pdfParse(dataBuffer);
  const chunks = chunkText(pdfData.text);

  const resource = await prisma.resource.create({
    data: {
      title: path.basename(filePath),
      type,
      filename: path.basename(filePath),
    },
  });

  for (const chunk of chunks) {
    if (chunk.trim().length < 20) continue;

    const { embedding } = await generateEmbedding({
      model: azureProvider.embedding(process.env.AZURE_OPENAI_EMBEDDING_DEPLOYMENT),
      input: chunk,
    });

    await prisma.embedding.create({
      data: {
        content: chunk,
        embedding,
        resourceId: resource.id,
      },
    });

    console.log(`Stored chunk for ${resource.title}`);
  }
}

async function main() {
  const files = fs.readdirSync(PDF_DIR).filter(f => f.endsWith('.pdf'));
  for (const file of files) {
    const type = file.toLowerCase().includes('score') ? 'score' : 'guide';
    await processPDF(path.join(PDF_DIR, file), type);
  }
  console.log('PDF ingestion complete!');
  process.exit(0);
}

main().catch(e => {
  console.error(e);
  process.exit(1);
});