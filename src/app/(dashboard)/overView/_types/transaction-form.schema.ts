import { z } from "zod";

// --- Update Position Form Schema (from TransactionDialog) ---
export const UpdatePositionSchema = z.object({
  // Stock/Fund Fields (Required if not FLOW)
  code: z.string().optional(),
  name: z.string().optional(),
  currentPrice: z.coerce.number().optional(), 
  
  // Shared / Flow Fields
  marketValue: z.coerce.number().min(0, "Amount must be positive"), // Used as "Amount" for Flow
  date: z.date().optional(), // For backdating

  // Asset Specific
  yieldRate: z.coerce.number().optional().default(0),
  costPrice: z.coerce.number().optional().default(0),
  assetClassId: z.string().optional(),
  
  currency: z.string().optional().default("CNY"),
  
  // Enums
  mode: z.enum(["YIELD", "COST", "FLOW"]).default("YIELD"),
  type: z.enum(["STOCK", "FUND", "BOND", "CRYPTO", "OTHER", "DEPOSIT", "WITHDRAW"]).optional(),
}).superRefine((val, ctx) => {
    // 1. If FLOW, we just need Amount (marketValue) and Date. Code/Name/Price optional.
    if (val.mode === "FLOW") {
        if (!val.type || !["DEPOSIT", "WITHDRAW"].includes(val.type)) {
             ctx.addIssue({
                code: z.ZodIssueCode.custom,
                message: "Flow type must be Deposit or Withdraw",
                path: ["type"],
            });
        }
        return; // Skip other validations
    }

    // 2. If NOT Flow (Stock/Fund/Etc), we need Code, Name, Price
    if (!val.code) {
        ctx.addIssue({ code: z.ZodIssueCode.custom, message: "Code is required", path: ["code"] });
    }
    if (!val.name) {
         ctx.addIssue({ code: z.ZodIssueCode.custom, message: "Name is required", path: ["name"] });
    }
    if (!val.currentPrice || val.currentPrice <= 0) {
         ctx.addIssue({ code: z.ZodIssueCode.custom, message: "Price > 0 required", path: ["currentPrice"] });
    }

    if (val.mode === "COST") {
        if (!val.costPrice || val.costPrice <= 0) {
            ctx.addIssue({
                code: z.ZodIssueCode.custom,
                message: "Avg Cost must be > 0 when calculating by Cost",
                path: ["costPrice"],
            });
        }
    }
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
    currency: "CNY",
    mode: "YIELD",
    type: undefined,
};
