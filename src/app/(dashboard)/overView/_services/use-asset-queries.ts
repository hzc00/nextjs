import { useQuery } from "@tanstack/react-query";
import { getAssets, getPortfolioSummary, getAssetAllocation, getPortfolioSnapshots } from "./asset-queries";

export const useAssets = () => {
    return useQuery({
        queryKey: ["assets"],
        queryFn: () => getAssets(),
    });
};

export const usePortfolioSummary = () => {
    return useQuery({
        queryKey: ["portfolio-summary"],
        queryFn: () => getPortfolioSummary(),
    });
};

export const useAssetAllocation = () => {
    return useQuery({
        queryKey: ["asset-allocation"],
        queryFn: () => getAssetAllocation(),
    });
};

export const usePortfolioSnapshots = () => {
    return useQuery({
        queryKey: ["portfolio-snapshots"],
        queryFn: () => getPortfolioSnapshots(),
    });
};
