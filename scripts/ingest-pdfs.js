import fs from 'fs';
import path from 'path';
import { PrismaClient } from '@prisma/client';
import { generateEmbedding } from '../src/lib/azureOpenAI.js';
import 'dotenv/config';

const prisma = new PrismaClient();
const PDF_DIR = './pdfs'; 

// Alternative PDF parsing using pdf-poppler (more reliable)
async function extractTextFromPDF(filePath) {
  try {
    console.log(`Attempting to parse PDF with pdf-poppler: ${filePath}`);
    
    // Try pdf-poppler first
    const poppler = await import('pdf-poppler');
    
    const options = {
      format: 'text',
      out_dir: './temp',
      out_prefix: 'temp_pdf',
      page: null // Convert all pages
    };

    // Create temp directory if it doesn't exist
    if (!fs.existsSync('./temp')) {
      fs.mkdirSync('./temp');
    }

    const result = await poppler.convert(filePath, options);
    
    let fullText = '';
    
    // Read all generated text files
    if (Array.isArray(result)) {
      for (const pageFile of result) {
        if (fs.existsSync(pageFile)) {
          const pageText = fs.readFileSync(pageFile, 'utf8');
          fullText += pageText + '\n';
          fs.unlinkSync(pageFile); // Clean up temp file
        }
      }
    }

    // Clean up temp directory
    if (fs.existsSync('./temp') && fs.readdirSync('./temp').length === 0) {
      fs.rmdirSync('./temp');
    }

    if (fullText.trim().length > 0) {
      console.log(`✓ Successfully parsed with pdf-poppler: ${fullText.length} characters`);
      return fullText;
    }

  } catch (error) {
    console.log(`pdf-poppler failed: ${error.message}`);
  }

  // Fallback to pdf-parse with better error handling
  try {
    console.log('Falling back to pdf-parse...');
    const pdfParse = await import('pdf-parse');
    const dataBuffer = fs.readFileSync(filePath);
    
    const pdfData = await pdfParse.default(dataBuffer, {
      // Options to avoid test file issues
      max: 0,
      normalizeWhitespace: true,
      disableCombineTextItems: false
    });
    
    if (pdfData.text && pdfData.text.trim().length > 0) {
      console.log(`✓ Successfully parsed with pdf-parse: ${pdfData.text.length} characters`);
      return pdfData.text;
    }
  } catch (error) {
    console.log(`pdf-parse also failed: ${error.message}`);
  }

  // Last resort: manual text extraction
  try {
    console.log('Attempting manual text extraction...');
    const text = await extractTextManually(filePath);
    if (text) {
      console.log(`✓ Manual extraction successful: ${text.length} characters`);
      return text;
    }
  } catch (error) {
    console.log(`Manual extraction failed: ${error.message}`);
  }

  return null;
}

// Manual text extraction for simple PDFs
async function extractTextManually(filePath) {
  try {
    const buffer = fs.readFileSync(filePath);
    const pdfString = buffer.toString('latin1');
    
    // Look for text between common PDF operators
    const textRegex = /BT\s+(.*?)\s+ET/gs;
    const matches = [...pdfString.matchAll(textRegex)];
    
    let extractedText = '';
    
    for (const match of matches) {
      const textBlock = match[1];
      // Extract text from Tj operators: (text) Tj
      const textMatches = textBlock.match(/\((.*?)\)\s*Tj/g);
      if (textMatches) {
        for (const textMatch of textMatches) {
          const text = textMatch.match(/\((.*?)\)/);
          if (text && text[1]) {
            extractedText += text[1] + ' ';
          }
        }
      }
    }
    
    // Clean extracted text
    extractedText = extractedText
      .replace(/\\[rn]/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();
    
    return extractedText.length > 50 ? extractedText : null;
  } catch (error) {
    throw new Error(`Manual extraction failed: ${error.message}`);
  }
}

function chunkText(text, size = 500) {
  const chunks = [];
  // Clean and normalize the text
  const cleanText = text
    .replace(/\s+/g, ' ')
    .replace(/[^\x00-\x7F]/g, '') // Remove non-ASCII characters
    .trim();
  
  if (cleanText.length < 50) {
    console.warn('Text too short to chunk meaningfully');
    return [];
  }
  
  // Split into sentences first for better chunk boundaries
  const sentences = cleanText.split(/[.!?]+/).filter(s => s.trim().length > 10);
  
  let currentChunk = '';
  
  for (const sentence of sentences) {
    const trimmedSentence = sentence.trim();
    
    if ((currentChunk + trimmedSentence).length <= size) {
      currentChunk += (currentChunk ? '. ' : '') + trimmedSentence;
    } else {
      if (currentChunk.length > 20) {
        chunks.push(currentChunk + '.');
      }
      currentChunk = trimmedSentence;
    }
  }
  
  // Add the last chunk
  if (currentChunk.length > 20) {
    chunks.push(currentChunk + '.');
  }
  
  return chunks;
}

async function processPDF(filePath, type = 'guide') {
  try {
    console.log(`\n📄 Processing: ${path.basename(filePath)}`);
    
    if (!fs.existsSync(filePath)) {
      throw new Error(`File does not exist: ${filePath}`);
    }

    const stats = fs.statSync(filePath);
    console.log(`📊 Size: ${(stats.size / 1024).toFixed(2)} KB`);
    
    const text = await extractTextFromPDF(filePath);
    
    if (!text) {
      console.log(`⚠️  Could not extract text from ${path.basename(filePath)}`);
      console.log('💡 This PDF might be:');
      console.log('   - Image-based (scanned document)');
      console.log('   - Encrypted or password-protected');
      console.log('   - Corrupted');
      console.log('   - Using unsupported encoding');
      return { success: false, reason: 'No text extracted' };
    }
    
    // Show preview of extracted text
    const preview = text.substring(0, 200).replace(/\s+/g, ' ');
    console.log(`📝 Text preview: "${preview}..."`);
    
    const chunks = chunkText(text);
    console.log(`📦 Created ${chunks.length} chunks`);

    if (chunks.length === 0) {
      return { success: false, reason: 'No valid chunks created' };
    }

    // Handle database operations
    const filename = path.basename(filePath);
    let resource = await prisma.resource.findFirst({
      where: { filename }
    });

    if (resource) {
      console.log(`🔄 Updating existing resource...`);
      await prisma.embedding.deleteMany({
        where: { resourceId: resource.id }
      });
    } else {
      resource = await prisma.resource.create({
        data: {
          title: path.basename(filePath, '.pdf'),
          type,
          filename,
        },
      });
      console.log(`✅ Created resource: ${resource.title}`);
    }

    let successCount = 0;
    const totalChunks = chunks.length;

    for (const [index, chunk] of chunks.entries()) {
      try {
        process.stdout.write(`\r🔄 Embedding chunk ${index + 1}/${totalChunks}...`);
        
        const { embedding } = await generateEmbedding(chunk);

        if (!embedding || embedding.length === 0) {
          console.log(`\n⚠️  Empty embedding for chunk ${index + 1}, skipping...`);
          continue;
        }

        await prisma.embedding.create({
          data: {
            content: chunk,
            embedding: `[${embedding.join(',')}]`,
            resourceId: resource.id,
            metadata: {
              chunkIndex: index,
              totalChunks,
              sourceFile: filename,
              textLength: chunk.length,
              processingDate: new Date().toISOString()
            }
          },
        });

        successCount++;
        
        // Rate limiting
        if (index % 10 === 0) {
          await new Promise(resolve => setTimeout(resolve, 500));
        } else {
          await new Promise(resolve => setTimeout(resolve, 100));
        }
        
      } catch (error) {
        console.log(`\n❌ Chunk ${index + 1} failed: ${error.message}`);
      }
    }
    
    console.log(`\n✅ ${path.basename(filePath)}: ${successCount}/${totalChunks} chunks processed`);
    return { success: true, chunks: successCount };
    
  } catch (error) {
    console.error(`❌ Processing failed for ${path.basename(filePath)}: ${error.message}`);
    return { success: false, reason: error.message };
  }
}

async function main() {
  console.log('🚀 Enhanced PDF Ingestion Starting...');
  console.log('📅 Date:', new Date().toLocaleString());
  
  try {
    // Setup checks
    if (!fs.existsSync(PDF_DIR)) {
      fs.mkdirSync(PDF_DIR, { recursive: true });
      console.log(`📁 Created ${PDF_DIR} directory`);
      console.log('📋 Add PDF files and run again');
      return;
    }

    const files = fs.readdirSync(PDF_DIR)
      .filter(f => f.toLowerCase().endsWith('.pdf'))
      .sort();
    
    if (files.length === 0) {
      console.log('📋 No PDF files found');
      return;
    }

    console.log(`📚 Found ${files.length} PDFs:`);
    files.forEach((file, i) => console.log(`   ${i + 1}. ${file}`));

    // Test connections
    console.log('\n🔍 Testing connections...');
    
    await prisma.$connect();
    const existingResources = await prisma.resource.count();
    console.log(`✅ Database OK (${existingResources} existing resources)`);
    
    const testEmbedding = await generateEmbedding('connection test');
    console.log(`✅ Azure OpenAI OK (${testEmbedding.embedding.length}D embeddings)`);

    // Process files
    console.log('\n📖 Processing PDFs...');
    const results = {
      total: files.length,
      successful: 0,
      failed: 0,
      totalChunks: 0
    };

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      const type = (file.toLowerCase().includes('score') || file.toLowerCase().includes('seuil')) 
        ? 'score' : 'guide';
      
      console.log(`\n[${i + 1}/${files.length}] Processing: ${file} (${type})`);
      
      const result = await processPDF(path.join(PDF_DIR, file), type);
      
      if (result.success) {
        results.successful++;
        results.totalChunks += result.chunks || 0;
      } else {
        results.failed++;
        console.log(`❌ Failed: ${result.reason}`);
      }
    }

    // Final summary
    console.log('\n🎉 Processing Complete!');
    console.log('📊 Results:');
    console.log(`   ✅ Successful: ${results.successful}/${results.total}`);
    console.log(`   ❌ Failed: ${results.failed}/${results.total}`);
    console.log(`   📦 Total chunks: ${results.totalChunks}`);
    
    const finalCounts = {
      resources: await prisma.resource.count(),
      embeddings: await prisma.embedding.count()
    };
    
    console.log(`📈 Database totals: ${finalCounts.resources} resources, ${finalCounts.embeddings} embeddings`);
    
    if (results.failed > 0) {
      console.log('\n💡 For failed PDFs, try:');
      console.log('   1. Converting to text manually');
      console.log('   2. Using OCR tools for scanned documents');
      console.log('   3. Checking if PDFs are encrypted');
    }

  } catch (error) {
    console.error('💥 Fatal error:', error);
  } finally {
    await prisma.$disconnect();
    console.log('👋 Done');
  }
}

// Error handling
process.on('uncaughtException', async (error) => {
  console.error('💥 Uncaught exception:', error);
  await prisma.$disconnect();
  process.exit(1);
});

process.on('unhandledRejection', async (reason) => {
  console.error('💥 Unhandled rejection:', reason);
  await prisma.$disconnect();
  process.exit(1);
});

process.on('SIGINT', async () => {
  console.log('\n⏹️  Interrupted');
  await prisma.$disconnect();
  process.exit(0);
});

main();