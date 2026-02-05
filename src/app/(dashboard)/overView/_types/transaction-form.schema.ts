import { z } from "zod";

// --- Update Position Form Schema (from TransactionDialog) ---
export const UpdatePositionSchema = z.object({
    code: z.string().min(1, "Please select or enter a code"),
    name: z.string().min(1, "Please enter a name"),
    currentPrice: z.coerce.number().min(0.000001, "Current Price is required for calculation"),
    marketValue: z.coerce.number().min(0, "Market Value must be positive"),
    // Optional fields depending on mode
    yieldRate: z.coerce.number().optional().default(0),
    costPrice: z.coerce.number().optional().default(0),
    assetClassId: z.string().optional(),
});

export type UpdatePositionFormValues = z.infer<typeof UpdatePositionSchema>;

export const updatePositionDefaultValues: UpdatePositionFormValues = {
    code: "",
    name: "",
    currentPrice: 0,
    marketValue: 0,
    yieldRate: 0,
    costPrice: 0,
    assetClassId: undefined,
};
