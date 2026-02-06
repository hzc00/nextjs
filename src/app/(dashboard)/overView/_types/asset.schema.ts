import { z } from "zod";

export const AssetTypeSchema = z.enum(["STOCK", "FUND", "BOND", "CRYPTO", "OTHER"]);

export const AssetSchema = z.object({
    id: z.number(),
    code: z.string(),
    name: z.string(),
    type: AssetTypeSchema,
    quantity: z.number(),
    avgCost: z.number(),
    currentPrice: z.number(),
    currency: z.string().optional().default("CNY"),
    // Derived fields for UI
    valueInCNY: z.number().optional(),
    totalValue: z.number().optional(),
    totalCost: z.number().optional(),
    totalProfit: z.number().optional(),
    dailyChange: z.number().optional().default(0),
    assetClassId: z.number().optional().nullable(),
    assetClassName: z.string().optional(),
    assetClassColor: z.string().optional(),
});

export type AssetModel = z.infer<typeof AssetSchema>;

export const assetDefaultValues: Partial<AssetModel> = {
    dailyChange: 0,
    quantity: 0,
    avgCost: 0,
    currentPrice: 0,
};
