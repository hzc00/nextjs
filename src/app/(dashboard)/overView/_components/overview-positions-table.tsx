
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

    const assetList = positions || [];
    const totalPortfolioValue = assetList.reduce((sum, p) => sum + (p.totalValue || 0), 0);

    return (
        <>
            <Card>
                <CardHeader>
                    <CardTitle>Positions</CardTitle>
                </CardHeader>
                <CardContent>
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Code</TableHead>
                                <TableHead>Name</TableHead>
                                <TableHead>Type</TableHead>
                                <TableHead>Asset Class</TableHead>
                                <TableHead className="text-right">Price</TableHead>
                                <TableHead className="text-right">Avg Cost</TableHead>
                                <TableHead className="text-right">Market Value</TableHead>
                                <TableHead className="text-right">Ratio</TableHead>
                                <TableHead className="text-right">Daily %</TableHead>
                                <TableHead className="text-right">P&L</TableHead>
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

                                    return (
                                        <TableRow key={position.id}>
                                            <TableCell className="font-mono text-muted-foreground">
                                                {position.code}
                                            </TableCell>
                                            <TableCell className="font-medium">
                                                {position.name}
                                            </TableCell>
                                            <TableCell>
                                                <Badge variant={position.type === "STOCK" ? "default" : "secondary"}>
                                                    {position.type}
                                                </Badge>
                                            </TableCell>
                                            <TableCell>
                                                {position.assetClassName ? (
                                                    <Badge style={{ backgroundColor: position.assetClassColor || '#333', color: '#fff' }}>
                                                        {position.assetClassName}
                                                    </Badge>
                                                ) : (
                                                    <span className="text-muted-foreground text-xs">-</span>
                                                )}
                                            </TableCell>
                                            <TableCell className="text-right font-mono">
                                                {currencySymbol}{position.currentPrice.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                            </TableCell>
                                            <TableCell className="text-right font-mono text-muted-foreground">
                                                {currencySymbol}{position.avgCost.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                            </TableCell>
                                            <TableCell className="text-right font-mono font-medium">
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
                                            <TableCell className={`text-right font-bold ${isDailyUp ? "text-red-500" : "text-green-500"}`}>
                                                {dailyChange > 0 ? "+" : ""}
                                                {dailyChange.toFixed(2)}%
                                            </TableCell>
                                            <TableCell className={`text-right font-bold ${isProfit ? "text-red-500" : "text-green-500"}`}>
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
                                                <div className="flex justify-end items-center">
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
                                                        className="ml-2 text-muted-foreground hover:text-red-500"
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
