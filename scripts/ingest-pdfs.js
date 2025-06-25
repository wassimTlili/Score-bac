import fs from 'fs';
import path from 'path';
import { PrismaClient } from '@prisma/client';
import { generateEmbedding } from '../src/lib/azureOpenAI.js';
import 'dotenv/config';

const prisma = new PrismaClient();
const PDF_DIR = './pdfs'; 

// Alternative PDF parsing function to avoid pdf-parse issues
async function extractTextFromPDF(filePath) {
  try {
    // Try dynamic import to avoid module loading issues
    const pdfParse = await import('pdf-parse');
    const dataBuffer = fs.readFileSync(filePath);
    const pdfData = await pdfParse.default(dataBuffer);
    return pdfData.text;
  } catch (error) {
    console.error('Error with pdf-parse, trying alternative method:', error.message);
    
    // Fallback: Try using pdf2pic or other alternatives
    // For now, we'll throw the error and suggest manual text extraction
    throw new Error(`Could not parse PDF: ${filePath}. Please try converting to text manually or use a different PDF parsing library.`);
  }
}

function chunkText(text, size = 500) {
  const chunks = [];
  // Clean the text first
  const cleanText = text.replace(/\s+/g, ' ').trim();
  
  for (let i = 0; i < cleanText.length; i += size) {
    chunks.push(cleanText.slice(i, i + size));
  }
  return chunks.filter(chunk => chunk.trim().length > 20);
}

async function processPDF(filePath, type = 'guide') {
  try {
    console.log(`Processing PDF: ${filePath}`);
    
    // Check if file exists
    if (!fs.existsSync(filePath)) {
      console.error(`File does not exist: ${filePath}`);
      return;
    }

    // Get file stats to ensure it's not empty
    const stats = fs.statSync(filePath);
    if (stats.size === 0) {
      console.error(`File is empty: ${filePath}`);
      return;
    }

    console.log(`File size: ${(stats.size / 1024).toFixed(2)} KB`);
    
    const text = await extractTextFromPDF(filePath);
    
    if (!text || text.trim().length === 0) {
      console.log(`No text found in ${filePath}`);
      return;
    }
    
    const chunks = chunkText(text);
    console.log(`Created ${chunks.length} chunks from ${filePath}`);

    if (chunks.length === 0) {
      console.log(`No valid chunks created from ${filePath}`);
      return;
    }

    // Check if resource already exists
    const existingResource = await prisma.resource.findFirst({
      where: { filename: path.basename(filePath) }
    });

    let resource;
    if (existingResource) {
      console.log(`Resource already exists: ${path.basename(filePath)}, updating...`);
      // Delete existing embeddings
      await prisma.embedding.deleteMany({
        where: { resourceId: existingResource.id }
      });
      resource = existingResource;
    } else {
      resource = await prisma.resource.create({
        data: {
          title: path.basename(filePath),
          type,
          filename: path.basename(filePath),
        },
      });
    }

    let successCount = 0;
    for (const [index, chunk] of chunks.entries()) {
      try {
        console.log(`Processing chunk ${index + 1}/${chunks.length} for ${resource.title}`);
        
        const { embedding } = await generateEmbedding(chunk);

        if (!embedding || embedding.length === 0) {
          console.warn(`Empty embedding for chunk ${index + 1}`);
          continue;
        }

        await prisma.embedding.create({
          data: {
            content: chunk,
            embedding: `[${embedding.join(',')}]`,
            resourceId: resource.id,
            metadata: {
              chunkIndex: index,
              totalChunks: chunks.length,
              sourceFile: path.basename(filePath)
            }
          },
        });

        successCount++;
        console.log(`✓ Stored chunk ${index + 1}/${chunks.length} for ${resource.title}`);
        
        // Add small delay to avoid rate limiting
        await new Promise(resolve => setTimeout(resolve, 100));
        
      } catch (error) {
        console.error(`✗ Error processing chunk ${index + 1} of ${filePath}:`, error.message);
      }
    }
    
    console.log(`Successfully processed ${successCount}/${chunks.length} chunks for ${path.basename(filePath)}`);
    
  } catch (error) {
    console.error(`Error processing PDF ${filePath}:`, error.message);
    
    // Provide helpful error messages
    if (error.message.includes('ENOENT')) {
      console.error('This error suggests the pdf-parse library is looking for test files that don\'t exist.');
      console.error('Try reinstalling pdf-parse or using an alternative PDF parsing library.');
    }
  }
}

async function main() {
  try {
    console.log('Starting PDF ingestion process...');
    console.log('Current working directory:', process.cwd());
    console.log('Looking for PDFs in:', path.resolve(PDF_DIR));
    
    // Check if PDF directory exists
    if (!fs.existsSync(PDF_DIR)) {
      console.log(`Creating PDF directory: ${PDF_DIR}`);
      fs.mkdirSync(PDF_DIR, { recursive: true });
      console.log(`✅ Created directory ${PDF_DIR}`);
      console.log('Please add your PDF files to this directory and run the script again.');
      process.exit(0);
    }

    const files = fs.readdirSync(PDF_DIR).filter(f => f.toLowerCase().endsWith('.pdf'));
    
    if (files.length === 0) {
      console.log(`No PDF files found in ${PDF_DIR}`);
      console.log('Please add your PDF files to the pdfs directory and run the script again.');
      process.exit(0);
    }

    console.log(`Found ${files.length} PDF files to process:`);
    files.forEach(file => console.log(`  - ${file}`));

    // Test database connection
    try {
      await prisma.$connect();
      console.log('✅ Database connected successfully');
    } catch (dbError) {
      console.error('❌ Database connection failed:', dbError.message);
      console.log('Please check your DATABASE_URL environment variable');
      process.exit(1);
    }

    // Test Azure OpenAI connection
    try {
      console.log('Testing Azure OpenAI connection...');
      await generateEmbedding('test');
      console.log('✅ Azure OpenAI connected successfully');
    } catch (aiError) {
      console.error('❌ Azure OpenAI connection failed:', aiError.message);
      console.log('Please check your Azure OpenAI environment variables');
      process.exit(1);
    }

    for (const file of files) {
      const type = file.toLowerCase().includes('score') || file.toLowerCase().includes('seuil') 
        ? 'score' 
        : 'guide';
      
      console.log(`\n--- Processing ${file} as type: ${type} ---`);
      await processPDF(path.join(PDF_DIR, file), type);
    }
    
    console.log('\n🎉 PDF ingestion complete!');
    
    // Show summary
    const totalResources = await prisma.resource.count();
    const totalEmbeddings = await prisma.embedding.count();
    console.log(`📊 Summary: ${totalResources} resources, ${totalEmbeddings} embeddings`);
    
  } catch (error) {
    console.error('❌ Main process error:', error);
  } finally {
    await prisma.$disconnect();
    process.exit(0);
  }
}

// Handle uncaught errors
process.on('uncaughtException', (error) => {
  console.error('Uncaught Exception:', error);
  process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason);
  process.exit(1);
});

main().catch(e => {
  console.error('Script failed:', e);
  process.exit(1);
});