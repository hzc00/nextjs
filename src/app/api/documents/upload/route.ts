import { NextRequest, NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import { embedMany } from "ai";
import { google } from "@ai-sdk/google";
import { RecursiveCharacterTextSplitter } from "@langchain/textsplitters";
import PDFParser from "pdf2json";

const prisma = new PrismaClient();

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const file = formData.get("file") as File | null;

    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }

    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    
    let text = "";
    if (file.type === "application/pdf" || file.name.endsWith(".pdf")) {
      const pdfParser = new PDFParser(null, 1);
      
      text = await new Promise<string>((resolve, reject) => {
        pdfParser.on("pdfParser_dataError", (errData: any) => reject(errData.parserError));
        pdfParser.on("pdfParser_dataReady", () => {
          resolve(pdfParser.getRawTextContent());
        });
        pdfParser.parseBuffer(buffer);
      });
    } else if (file.type === "text/plain" || file.name.endsWith(".txt")) {
      text = buffer.toString("utf-8");
    } else {
      return NextResponse.json({ error: "Unsupported file type" }, { status: 400 });
    }

    if (!text.trim()) {
      return NextResponse.json({ error: "File is empty or cannot be parsed" }, { status: 400 });
    }

    // 1. Save Document
    const document = await prisma.document.create({
      data: {
        title: file.name,
        type: file.type.includes("pdf") ? "PDF" : "TXT",
        content: text,
      },
    });

    // 2. Split text
    const splitter = new RecursiveCharacterTextSplitter({
      chunkSize: 1000,
      chunkOverlap: 200,
    });
    const chunks = await splitter.splitText(text);

    // 3. Create embeddings
    const { embeddings } = await embedMany({
      model: google.embeddingModel("gemini-embedding-001"),
      values: chunks,
    });

    // 4. Save chunks with embeddings
    for (let i = 0; i < chunks.length; i++) {
      const content = chunks[i];
      const embedding = embeddings[i]; // Array of numbers

      // Store in DB using raw SQL since Unsupported('vector') cannot be written via Prisma client directly
      await prisma.$executeRaw`
        INSERT INTO "DocumentChunk" ("content", "embedding", "documentId") 
        VALUES (${content}, ${embedding}::vector, ${document.id})
      `;
    }

    return NextResponse.json({ 
      success: true, 
      documentId: document.id,
      chunksProcessed: chunks.length 
    });
  } catch (error: any) {
    console.error("Upload error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
