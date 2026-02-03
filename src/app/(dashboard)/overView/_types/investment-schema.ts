import { z } from "zod";

// --- Enums Matching Prisma ---
export const AssetTypeSchema = z.enum(["STOCK", "FUND", "BOND", "CRYPTO", "OTHER"]);
export const TransactionTypeSchema = z.enum(["BUY", "SELL", "DIVIDEND", "TRANSFER"]);

// --- Asset Types ---
export const AssetSchema = z.object({
    id: z.number(),
    code: z.string(),
    name: z.string(),
    type: AssetTypeSchema,
    quantity: z.number(),
    avgCost: z.number(),
    currentPrice: z.number(),
    // Derived fields for UI
    totalValue: z.number().optional(),
    totalCost: z.number().optional(),
    totalProfit: z.number().optional(),
    dailyChange: z.number().optional().default(0), // Mock data had this, keeping for UI
});

export type AssetModel = z.infer<typeof AssetSchema>;

// --- Transaction Types ---
export const CreateTransactionSchema = z.object({
    type: TransactionTypeSchema,
    assetCode: z.string().min(1, "Asset code is required"),
    assetName: z.string().optional(), // For creating new asset
    quantity: z.number().positive("Quantity must be positive"),
    price: z.number().min(0, "Price cannot be negative"),
    fee: z.number().min(0).optional().default(0),
    date: z.date(),
    notes: z.string().optional(),
});

export type CreateTransactionInput = z.infer<typeof CreateTransactionSchema>;
