import { streamText, tool, embed, stepCountIs, convertToModelMessages } from 'ai';
import { google } from '@ai-sdk/google';
import { z } from 'zod';
import { PrismaClient } from '@prisma/client';
import { auth } from "@/lib/auth"; // 引入 Auth.js 鉴权

const prisma = new PrismaClient();

// 同步数据库枚举类型
const AssetTypeEnum = z.enum(['STOCK', 'FUND', 'BOND', 'CRYPTO', 'OTHER']);
const TransactionTypeEnum = z.enum(['BUY', 'SELL', 'DIVIDEND', 'TRANSFER', 'DEPOSIT', 'WITHDRAW']);

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return new Response('Unauthorized', { status: 401 });
  }
  const userId = Number(session.user.id);

  const { messages } = await req.json();
  const modelMessages = await convertToModelMessages(messages);

  const result = streamText({
    model: google('gemini-2.5-flash'),
    stopWhen: stepCountIs(5),
    messages: modelMessages,
    tools: {
      queryAssets: tool({
        description: 'Query detailed asset holdings with filters for name, code, type, price, and daily change.',
        inputSchema: z.object({
          name: z.string().optional().describe('Search by asset name (fuzzy match)'),
          code: z.string().optional().describe('Search by specific asset code'),
          type: AssetTypeEnum.optional(),
          minPrice: z.number().optional().describe('Min current price'),
          maxPrice: z.number().optional().describe('Max current price'),
          minChange: z.number().optional().describe('Min daily change % (e.g. 0 for red/up)'),
          maxChange: z.number().optional().describe('Max daily change % (e.g. 0 for green/down)'),
          minQuantity: z.number().optional(),
        }),
        execute: async ({ name, code, type, minPrice, maxPrice, minChange, maxChange, minQuantity }) => {
          return await prisma.asset.findMany({
            where: {
              userId,
              name: name ? { contains: name, mode: 'insensitive' } : undefined,
              code: code ? { contains: code, mode: 'insensitive' } : undefined,
              type,
              currentPrice: { gte: minPrice, lte: maxPrice },
              dailyChange: { gte: minChange, lte: maxChange },
              quantity: { gte: minQuantity }
            },
            orderBy: { updatedAt: 'desc' }
          });
        },
      }),
      queryTransactions: tool({
        description: 'Query transaction history (buy, sell, dividends) with filters for asset name, type, and date range.',
        inputSchema: z.object({
          assetName: z.string().optional().describe('Filter by asset name'),
          type: TransactionTypeEnum.optional(),
          minAmount: z.number().optional(),
          maxAmount: z.number().optional(),
          startDate: z.string().optional().describe('Filter from date (ISO format)'),
          endDate: z.string().optional().describe('Filter to date (ISO format)'),
        }),
        execute: async ({ assetName, type, minAmount, maxAmount, startDate, endDate }) => {
          return await prisma.transaction.findMany({
            where: {
              userId,
              type,
              asset: assetName ? { name: { contains: assetName, mode: 'insensitive' } } : undefined,
              totalAmount: { gte: minAmount, lte: maxAmount },
              date: {
                gte: startDate ? new Date(startDate) : undefined,
                lte: endDate ? new Date(endDate) : undefined,
              }
            },
            orderBy: { date: 'desc' },
            include: { asset: { select: { name: true, code: true } } }
          });
        },
      }),
      queryPortfolioPerformance: tool({
        description: 'Get the overall portfolio net worth, total cost, and total profit history.',
        inputSchema: z.object({
          limit: z.number().optional().default(7).describe('Number of daily snapshots to return'),
        }),
        execute: async ({ limit }) => {
          return await prisma.portfolioSnapshot.findMany({
            where: { userId },
            orderBy: { date: 'desc' },
            take: limit
          });
        },
      }),
      searchDocuments: tool({
        description: 'Search unstructured knowledge base documents for regulations, policies, or research reports to answer qualitative questions.',
        inputSchema: z.object({
          query: z.string().describe('The search query to find relevant information in documents.'),
        }),
        execute: async ({ query }): Promise<any> => {
          try {
            // Embed query
            const { embedding } = await embed({
              model: google.textEmbeddingModel("gemini-embedding-001"),
              value: query,
            });
            
            // pgvector search using `<=>` (cosine distance)
            const chunks = await prisma.$queryRaw<any[]>`
              SELECT content, 1 - (embedding <=> ${embedding}::vector) as similarity
              FROM "DocumentChunk"
              ORDER BY embedding <=> ${embedding}::vector
              LIMIT 5
            `;
            
            return { results: chunks };
          } catch (e: any) {
            console.error("Vector search failed:", e);
            return { error: e.message };
          }
        },
      }),
    },
    system: `You are an intelligent investment and enterprise knowledge assistant.
    
    Structured Tools (Investment):
    1. queryAssets: Query current holdings (price, quantity, daily change). Use this for "What do I own?" or "Which stocks are up?".
    2. queryTransactions: Query history of buys, sells, and dividends. Use this for "When did I buy X?" or "How much did I spend on fees?".
    3. queryPortfolioPerformance: Query total net worth and profit snapshots. Use this for "How am I doing overall?" or "What is my total profit?".
    
    Unstructured Tool:
    4. searchDocuments: Use this for qualitative questions (policies, research reports).
    
    Guidelines:
    - ALWAYS filter by the current context.
    - If a user asks "Which assets are up?", use queryAssets with minChange: 0.
    - If a user asks "Show my recent buys", use queryTransactions with type: 'BUY'.
    - Base all answers strictly on tool results.`,
  });

  return result.toUIMessageStreamResponse();
}
