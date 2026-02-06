"use client";

import { Button } from "@/components/ui/button";
import { RefreshCw } from "lucide-react";
import { useRefreshPrices } from "../_services/use-asset-queries";
import { cn } from "@/lib/utils";

export function RefreshPricesButton() {
    const refreshMutation = useRefreshPrices();
    const loading = refreshMutation.isPending;

    const handleRefresh = () => {
        refreshMutation.mutate();
    };

    return (
        <Button
            variant="outline"
            size="sm"
            onClick={handleRefresh}
            disabled={loading}
        >
            <RefreshCw className={cn("mr-2 h-4 w-4", loading && "animate-spin")} />
            Refresh Prices
        </Button>
    );
}
