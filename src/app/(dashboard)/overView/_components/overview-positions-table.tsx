
import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { TransactionDialog } from "./transaction-dialog";
import { useAssets } from "../_services/use-asset-queries";
import { Loader2 } from "lucide-react";

export function OverviewPositionsTable() {
    const [transactionOpen, setTransactionOpen] = useState(false);
    const [selectedCode, setSelectedCode] = useState<string | undefined>(undefined);

    // Use React Query Hook
    const { data: positions, isLoading, error } = useAssets();

    const handleTrade = (code: string) => {
        setSelectedCode(code);
        setTransactionOpen(true);
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
                                <TableHead className="text-right">Price</TableHead>
                                <TableHead className="text-right">Cost</TableHead>
                                <TableHead className="text-right">Qty</TableHead>
                                <TableHead className="text-right">Daily %</TableHead>
                                <TableHead className="text-right">P&L</TableHead>
                                <TableHead className="text-right">Action</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {assetList.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={9} className="text-center h-24 text-muted-foreground">
                                        No assets found. Record your first transaction!
                                    </TableCell>
                                </TableRow>
                            ) : (
                                assetList.map((position) => {
                                    const isProfit = (position.totalProfit || 0) >= 0;
                                    const dailyChange = position.dailyChange || 0;
                                    const isDailyUp = dailyChange >= 0;

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
                                            <TableCell className="text-right font-mono">
                                                {position.currentPrice.toLocaleString()}
                                            </TableCell>
                                            <TableCell className="text-right font-mono text-muted-foreground">
                                                {position.avgCost.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                            </TableCell>
                                            <TableCell className="text-right font-mono">
                                                {position.quantity.toLocaleString()}
                                            </TableCell>
                                            <TableCell className={`text-right font-bold ${isDailyUp ? "text-red-500" : "text-green-500"}`}>
                                                {dailyChange > 0 ? "+" : ""}
                                                {dailyChange}%
                                            </TableCell>
                                            <TableCell className={`text-right font-bold ${isProfit ? "text-red-500" : "text-green-500"}`}>
                                                {(position.totalProfit || 0) > 0 ? "+" : ""}
                                                {(position.totalProfit || 0).toLocaleString(undefined, {
                                                    minimumFractionDigits: 2,
                                                    maximumFractionDigits: 2,
                                                })}
                                            </TableCell>
                                            <TableCell className="text-right">
                                                <Button
                                                    variant="outline"
                                                    size="sm"
                                                    onClick={() => handleTrade(position.code)}
                                                >
                                                    Trade
                                                </Button>
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
                defaultType="BUY"
            />
        </>
    );
}
