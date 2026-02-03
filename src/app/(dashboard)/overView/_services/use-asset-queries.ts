import { useQuery } from "@tanstack/react-query";
import { getAssets, getPortfolioSummary } from "./asset-queries";

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
