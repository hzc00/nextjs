
import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { TransactionDialog } from "./transaction-dialog";
import { useAssets, useDeleteAsset } from "../_services/use-asset-queries";
import { Loader2, Trash2 } from "lucide-react";
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from "@/components/ui/alert-dialog";
// deleteAsset removed

export function OverviewPositionsTable() {
    const [transactionOpen, setTransactionOpen] = useState(false);
    const [selectedCode, setSelectedCode] = useState<string | undefined>(undefined);
    const [deletingId, setDeletingId] = useState<number | null>(null);
    const deleteMutation = useDeleteAsset();
    // const queryClient = useQueryClient(); // Not needed locally if mutation handles it

    // Use React Query Hook
    const { data: positions, isLoading, error } = useAssets();

    const handleTrade = (code: string) => {
        setSelectedCode(code);
        setTransactionOpen(true);
    };

    const handleDeleteClick = (id: number) => {
        setDeletingId(id);
    };

    const confirmDelete = () => {
        if (!deletingId) return;

        deleteMutation.mutate(deletingId, {
            onSettled: () => {
                setDeletingId(null);
            }
        });
    };

    if (isLoading) {
        return (
            <Card>
                <CardHeader><CardTitle>Positions</CardTitle></CardHeader>
                <CardContent className="flex justify-center py-6">
                    <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                </CardContent>
            </Card>
        );
    }

    if (error) {
        return (
            <Card>
                <CardHeader><CardTitle>Positions</CardTitle></CardHeader>
                <CardContent>
                    <div className="text-red-500">Failed to load positions</div>
                </CardContent>
            </Card>
        );
    }

    // Helper to determine decimals
    const getDecimalPlaces = (position: any) => {
        if (position.type === 'FUND') return 4;
        if (position.name.toUpperCase().includes('ETF')) return 3;
        // Check for small values? Or just default to 2.
        return 2;
    };

    const assetList = positions || [];
    const totalPortfolioValue = assetList.reduce((sum, p) => sum + (p.totalValue || 0), 0);

    return (
        <>
            <Card>
                <CardHeader>
                    <CardTitle>Positions</CardTitle>
                </CardHeader>
                <CardContent>
                    {/* Desktop View: Table */}
                    <div className="hidden md:block overflow-x-auto">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead className="min-w-[100px]">Code</TableHead>
                                    <TableHead className="min-w-[120px]">Name</TableHead>
                                    <TableHead>Type</TableHead>
                                    <TableHead>Asset Class</TableHead>
                                    <TableHead className="text-right whitespace-nowrap">Price</TableHead>
                                    <TableHead className="text-right whitespace-nowrap">Avg Cost</TableHead>
                                    <TableHead className="text-right whitespace-nowrap">Market Value</TableHead>
                                    <TableHead className="text-right">Ratio</TableHead>
                                    <TableHead className="text-right min-w-[120px]">Daily Change</TableHead>
                                    <TableHead className="text-right min-w-[120px]">P&L</TableHead>
                                    <TableHead className="text-right">Action</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {assetList.length === 0 ? (
                                    <TableRow>
                                        <TableCell colSpan={11} className="text-center h-24 text-muted-foreground">
                                            No assets found. Add your first position!
                                        </TableCell>
                                    </TableRow>
                                ) : (
                                    assetList.map((position) => {
                                        const isProfit = (position.totalProfit || 0) >= 0;
                                        const dailyChange = position.dailyChange || 0;
                                        const isDailyUp = dailyChange >= 0;
                                        const marketValue = position.totalValue || 0;
                                        const ratio = totalPortfolioValue > 0 ? (marketValue / totalPortfolioValue) * 100 : 0;

                                        const currencySymbol = position.currency === "USD" ? "$" : position.currency === "HKD" ? "HK$" : "¥";
                                        const showConverted = position.currency !== "CNY" && position.valueInCNY;
                                        const decimals = getDecimalPlaces(position);

                                        return (
                                            <TableRow key={position.id}>
                                                <TableCell className="font-mono text-muted-foreground whitespace-nowrap">
                                                    {position.code}
                                                </TableCell>
                                                <TableCell className="font-medium whitespace-nowrap">
                                                    {position.name}
                                                </TableCell>
                                                <TableCell>
                                                    <Badge variant={position.type === "STOCK" ? "default" : "secondary"}>
                                                        {position.type}
                                                    </Badge>
                                                </TableCell>
                                                <TableCell>
                                                    {position.assetClassName ? (
                                                        <Badge style={{ backgroundColor: position.assetClassColor || '#333', color: '#fff' }} className="whitespace-nowrap">
                                                            {position.assetClassName}
                                                        </Badge>
                                                    ) : (
                                                        <span className="text-muted-foreground text-xs">-</span>
                                                    )}
                                                </TableCell>
                                                <TableCell className="text-right font-mono whitespace-nowrap">
                                                    {currencySymbol}{position.currentPrice.toLocaleString(undefined, { minimumFractionDigits: decimals, maximumFractionDigits: decimals })}
                                                </TableCell>
                                                <TableCell className="text-right font-mono text-muted-foreground whitespace-nowrap">
                                                    {currencySymbol}{position.avgCost.toLocaleString(undefined, { minimumFractionDigits: decimals, maximumFractionDigits: decimals })}
                                                </TableCell>
                                                <TableCell className="text-right font-mono font-medium whitespace-nowrap">
                                                    <div>
                                                        {currencySymbol}{marketValue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                                    </div>
                                                    {showConverted && (
                                                        <div className="text-xs text-muted-foreground mt-0.5">
                                                            ≈ ¥{position.valueInCNY?.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
                                                        </div>
                                                    )}
                                                </TableCell>
                                                <TableCell className="text-right font-mono text-muted-foreground">
                                                    {ratio.toFixed(2)}%
                                                </TableCell>
                                                <TableCell className={`text-right font-bold ${isDailyUp ? "text-red-500" : "text-green-500"} whitespace-nowrap float-right`}>
                                                    <div className="flex flex-col items-end">
                                                        <span>
                                                            {dailyChange > 0 ? "+" : ""}
                                                            {((marketValue * dailyChange / 100) / (1 + dailyChange / 100)).toLocaleString(undefined, {
                                                                minimumFractionDigits: 2,
                                                                maximumFractionDigits: 2,
                                                            })}
                                                        </span>
                                                        <span className="text-xs opacity-80 font-normal">
                                                            {dailyChange > 0 ? "+" : ""}
                                                            {dailyChange.toFixed(2)}%
                                                        </span>
                                                    </div>
                                                </TableCell>
                                                <TableCell className={`text-right font-bold ${isProfit ? "text-red-500" : "text-green-500"} whitespace-nowrap`}>
                                                    <div className="flex flex-col items-end">
                                                        <span>
                                                            {(position.totalProfit || 0) > 0 ? "+" : ""}
                                                            {(position.totalProfit || 0).toLocaleString(undefined, {
                                                                minimumFractionDigits: 2,
                                                                maximumFractionDigits: 2,
                                                            })}
                                                        </span>
                                                        <span className="text-xs opacity-80">
                                                            {(position.totalProfit && position.totalCost)
                                                                ? `${(position.totalProfit / position.totalCost * 100).toFixed(2)}%`
                                                                : "0.00%"}
                                                        </span>
                                                    </div>
                                                </TableCell>
                                                <TableCell className="text-right">
                                                    <div className="flex justify-end items-center space-x-2">
                                                        <Button
                                                            variant="outline"
                                                            size="sm"
                                                            onClick={() => handleTrade(position.code)}
                                                        >
                                                            Edit
                                                        </Button>
                                                        <Button
                                                            variant="ghost"
                                                            size="icon"
                                                            className="text-muted-foreground hover:text-red-500"
                                                            onClick={() => handleDeleteClick(position.id)}
                                                        >
                                                            <Trash2 className="h-4 w-4" />
                                                        </Button>
                                                    </div>
                                                </TableCell>
                                            </TableRow>
                                        );
                                    })
                                )}
                            </TableBody>
                        </Table>
                    </div>

                    {/* Mobile View: Cards */}
                    <div className="block md:hidden space-y-4">
                        {assetList.length === 0 ? (
                            <div className="text-center h-24 text-muted-foreground flex items-center justify-center border rounded-lg">
                                No assets found. Add your first position!
                            </div>
                        ) : (
                            assetList.map((position) => {
                                const isProfit = (position.totalProfit || 0) >= 0;
                                const dailyChange = position.dailyChange || 0;
                                const isDailyUp = dailyChange >= 0;
                                const marketValue = position.totalValue || 0;
                                const ratio = totalPortfolioValue > 0 ? (marketValue / totalPortfolioValue) * 100 : 0;

                                const currencySymbol = position.currency === "USD" ? "$" : position.currency === "HKD" ? "HK$" : "¥";
                                const decimals = getDecimalPlaces(position);

                                return (
                                    <div key={position.id} className="border rounded-lg p-4 space-y-3 bg-card text-card-foreground shadow-sm">
                                        <div className="flex justify-between items-start">
                                            <div>
                                                <div className="flex items-center space-x-2">
                                                    <span className="font-bold">{position.name}</span>
                                                    <span className="text-xs text-muted-foreground font-mono">{position.code}</span>
                                                </div>
                                                <div className="flex gap-1 mt-1">
                                                    <Badge variant="secondary" className="text-[10px] px-1 py-0 h-5">
                                                        {position.type}
                                                    </Badge>
                                                    {position.assetClassName && (
                                                        <Badge
                                                            className="text-[10px] px-1 py-0 h-5"
                                                            style={{ backgroundColor: position.assetClassColor || '#333', color: '#fff' }}
                                                        >
                                                            {position.assetClassName}
                                                        </Badge>
                                                    )}
                                                </div>
                                            </div>
                                            <div className="text-right">
                                                <div className="font-mono font-medium">
                                                    {currencySymbol}{marketValue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                                </div>
                                                <div className="text-xs text-muted-foreground">
                                                    {ratio.toFixed(2)}%
                                                </div>
                                            </div>
                                        </div>

                                        <div className="grid grid-cols-2 gap-4 py-2 border-t border-b">
                                            <div>
                                                <div className="text-xs text-muted-foreground">Price</div>
                                                <div className="font-mono text-sm">
                                                    {currencySymbol}{position.currentPrice.toLocaleString(undefined, { minimumFractionDigits: decimals, maximumFractionDigits: decimals })}
                                                </div>
                                            </div>
                                            <div className="text-right">
                                                <div className="text-xs text-muted-foreground">Daily Change</div>
                                                <div className={`font-bold text-sm ${isDailyUp ? "text-red-500" : "text-green-500"}`}>
                                                    <span>
                                                        {dailyChange > 0 ? "+" : ""}
                                                        {((marketValue * dailyChange / 100) / (1 + dailyChange / 100)).toLocaleString(undefined, {
                                                            minimumFractionDigits: 2,
                                                            maximumFractionDigits: 2,
                                                        })}
                                                    </span>
                                                    <span className="ml-1 text-xs opacity-80 font-normal">
                                                        ({dailyChange > 0 ? "+" : ""}
                                                        {dailyChange.toFixed(2)}%)
                                                    </span>
                                                </div>
                                            </div>
                                            <div>
                                                <div className="text-xs text-muted-foreground">Avg Cost</div>
                                                <div className="font-mono text-sm">
                                                    {currencySymbol}{position.avgCost.toLocaleString(undefined, { minimumFractionDigits: decimals, maximumFractionDigits: decimals })}
                                                </div>
                                            </div>
                                            <div className="text-right">
                                                <div className="text-xs text-muted-foreground">Total P&L</div>
                                                <div className={`font-bold text-sm ${isProfit ? "text-red-500" : "text-green-500"}`}>
                                                    <span>
                                                        {(position.totalProfit || 0) > 0 ? "+" : ""}
                                                        {(position.totalProfit || 0).toLocaleString(undefined, {
                                                            minimumFractionDigits: 2,
                                                            maximumFractionDigits: 2,
                                                        })}
                                                    </span>
                                                    <span className="ml-1 text-xs opacity-80 font-normal">
                                                        ({(position.totalProfit && position.totalCost)
                                                            ? `${(position.totalProfit / position.totalCost * 100).toFixed(2)}%`
                                                            : "0.00%"})
                                                    </span>
                                                </div>
                                            </div>
                                        </div>

                                        <div className="flex justify-end gap-2">
                                            <Button
                                                variant="outline"
                                                size="sm"
                                                className="h-8 text-xs"
                                                onClick={() => handleTrade(position.code)}
                                            >
                                                Edit
                                            </Button>
                                            <Button
                                                variant="outline"
                                                size="sm"
                                                className="h-8 text-xs text-red-500 hover:text-red-600 border-red-200 hover:bg-red-50"
                                                onClick={() => handleDeleteClick(position.id)}
                                            >
                                                Delete
                                            </Button>
                                        </div>
                                    </div>
                                );
                            })
                        )}
                    </div>
                </CardContent>
            </Card>

            <TransactionDialog
                open={transactionOpen}
                onOpenChange={setTransactionOpen}
                defaultCode={selectedCode}
                defaultType="RESET" // Default to RESET/EDIT mode now
            />

            <AlertDialog open={!!deletingId} onOpenChange={(open) => !open && setDeletingId(null)}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                        <AlertDialogDescription>
                            This will permanently delete this asset and all its associated transaction history.
                            This action cannot be undone.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel disabled={deleteMutation.isPending}>Cancel</AlertDialogCancel>
                        <AlertDialogAction
                            onClick={(e) => {
                                e.preventDefault();
                                confirmDelete();
                            }}
                            disabled={deleteMutation.isPending}
                            className="bg-red-500 hover:bg-red-600"
                        >
                            {deleteMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : "Delete"}
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </>
    );
}
