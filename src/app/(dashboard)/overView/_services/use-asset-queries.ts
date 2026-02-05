import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { getAssets, getPortfolioSummary, getAssetAllocation, getPortfolioSnapshots, getAllocationGap } from "./asset-queries";
import { updateAssetPosition, getAssetClasses, upsertAssetClass, deleteAssetClass, deleteAsset } from "./market-actions";
import { toast } from "sonner";

// --- Queries ---

export const useAssets = () => {
    return useQuery({
        queryKey: ["assets"],
        queryFn: () => getAssets(),
    });
};

export const usePortfolioSummary = () => {
    return useQuery({
        queryKey: ["portfolio-summary"],
        queryFn: getPortfolioSummary,
    });
};

export const useAssetAllocation = () => {
    return useQuery({
        queryKey: ["asset-allocation"],
        queryFn: getAssetAllocation,
    });
};

export const usePortfolioSnapshots = () => {
    return useQuery({
        queryKey: ["portfolio-snapshots"],
        queryFn: getPortfolioSnapshots,
    });
};

export function useAllocationGap() {
    return useQuery({
        queryKey: ["allocationGap"],
        queryFn: getAllocationGap
    });
}

export function useAssetClasses() {
    return useQuery({
        queryKey: ["assetClasses"],
        queryFn: getAssetClasses
    });
}

// --- Mutations ---

export function useUpdateAssetPosition() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async (data: { code: string, name: string, quantity: number, avgCost: number, assetClassId?: number }) => {
            const res = await updateAssetPosition(data.code, data.name, data.quantity, data.avgCost, data.assetClassId);
            if (!res.success) throw new Error(res.error);
            return res;
        },
        onSuccess: () => {
            toast.success("Position updated successfully");
            // Refresh all data
            queryClient.invalidateQueries({ queryKey: ["assets"] });
            queryClient.invalidateQueries({ queryKey: ["portfolio-summary"] });
            queryClient.invalidateQueries({ queryKey: ["asset-allocation"] });
            queryClient.invalidateQueries({ queryKey: ["allocationGap"] });
            queryClient.invalidateQueries({ queryKey: ["portfolio-snapshots"] });
        },
        onError: (error: any) => {
            toast.error(error.message || "Failed to update position");
        }
    });
}

export function useDeleteAsset() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async (id: number) => {
            const res = await deleteAsset(id);
            if (!res.success) throw new Error((res as any).error || "Failed to delete");
            return res;
        },
        onSuccess: () => {
            toast.success("Asset deleted successfully");
            queryClient.invalidateQueries({ queryKey: ["assets"] });
            queryClient.invalidateQueries({ queryKey: ["portfolio-summary"] });
            queryClient.invalidateQueries({ queryKey: ["asset-allocation"] });
            queryClient.invalidateQueries({ queryKey: ["allocationGap"] });
        },
        onError: (error: any) => {
            toast.error(error.message || "Failed to delete asset");
        }
    });
}

export function useUpsertAssetClass() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async (data: { id?: number, name: string, color: string, targetPercent: number }) => {
            const res = await upsertAssetClass(data.id, data.name, data.color, data.targetPercent);
            if (!res.success) throw new Error(res.error);
            return res;
        },
        onSuccess: () => {
            toast.success("Strategy saved");
            queryClient.invalidateQueries({ queryKey: ["assetClasses"] });
            queryClient.invalidateQueries({ queryKey: ["allocationGap"] });
        },
        onError: (error: any) => {
            toast.error(error.message || "Failed to save strategy");
        }
    });
}

export function useDeleteAssetClass() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async (id: number) => {
            await deleteAssetClass(id);
        },
        onSuccess: () => {
            toast.success("Strategy class deleted");
            queryClient.invalidateQueries({ queryKey: ["assetClasses"] });
            queryClient.invalidateQueries({ queryKey: ["allocationGap"] });
        },
        onError: (error: any) => {
            toast.error(error.message || "Failed to delete class");
        }
    });
}
