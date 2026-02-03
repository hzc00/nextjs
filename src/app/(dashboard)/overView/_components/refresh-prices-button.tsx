"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { RefreshCw } from "lucide-react";
import { refreshAllAssetPrices } from "../_services/market-actions";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

export function RefreshPricesButton() {
    const [loading, setLoading] = useState(false);

    const handleRefresh = async () => {
        setLoading(true);
        try {
            await refreshAllAssetPrices();
            toast.success("Prices updated successfully");
        } catch (error) {
            console.error(error);
            toast.error("Failed to update prices");
        } finally {
            setLoading(false);
        }
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
