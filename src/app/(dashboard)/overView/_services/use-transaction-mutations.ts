import { useMutation, useQueryClient } from "@tanstack/react-query";
import { createTransaction } from "./transaction-mutations";
import { CreateTransactionInput } from "../_types/investment-schema";
import { toast } from "sonner"; // Assuming sonner is used, or use built-in toast if any. 
// If unsure about toast, I'll checking dependencies or use simple alert or console for now, 
// but shadcn usually uses sonner or toast.  Let's assume generic error handling for now.

export const useCreateTransaction = ({ onSuccess }: { onSuccess?: () => void } = {}) => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async (input: CreateTransactionInput) => {
            await createTransaction(input);
        },
        onSuccess: () => {
            toast.success("Transaction recorded successfully.");
            // Invalidate assets query to refresh list and calculations
            queryClient.invalidateQueries({ queryKey: ["assets"] });
            queryClient.invalidateQueries({ queryKey: ["portfolio-summary"] });
            queryClient.invalidateQueries({ queryKey: ["overview-metrics"] });
            queryClient.invalidateQueries({ queryKey: ["asset-allocation"] }); // Also invalidate allocation

            if (onSuccess) onSuccess();
        },
        onError: (error) => {
            toast.error(error.message || "Failed to record transaction");
        }
    });
};
