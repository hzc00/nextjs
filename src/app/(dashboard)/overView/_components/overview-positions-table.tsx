"use client";

import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { MOCK_POSITIONS } from "@/data/mock-overview";
import { TransactionDialog } from "@/components/dashboard/transaction-dialog";

export function OverviewPositionsTable() {
    const [transactionOpen, setTransactionOpen] = useState(false);
    const [selectedCode, setSelectedCode] = useState<string | undefined>(undefined);

    const handleTrade = (code: string) => {
        setSelectedCode(code);
        setTransactionOpen(true);
    };

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
                            {MOCK_POSITIONS.map((position) => {
                                const isProfit = position.totalProfit >= 0;
                                const isDailyUp = position.dailyChange >= 0;

                                return (
                                    <TableRow key={position.id}>
                                        <TableCell className="font-mono text-muted-foreground">
                                            {position.code}
                                        </TableCell>
                                        <TableCell className="font-medium">
                                            {position.name}
                                        </TableCell>
                                        <TableCell>
                                            <Badge variant={position.assetType === "STOCK" ? "default" : "secondary"}>
                                                {position.assetType}
                                            </Badge>
                                        </TableCell>
                                        <TableCell className="text-right font-mono">
                                            {position.currentPrice.toLocaleString()}
                                        </TableCell>
                                        <TableCell className="text-right font-mono text-muted-foreground">
                                            {position.avgCost.toLocaleString()}
                                        </TableCell>
                                        <TableCell className="text-right font-mono">
                                            {position.quantity.toLocaleString()}
                                        </TableCell>
                                        <TableCell className={`text-right font-bold ${isDailyUp ? "text-red-500" : "text-green-500"}`}>
                                            {position.dailyChange > 0 ? "+" : ""}
                                            {position.dailyChange}%
                                        </TableCell>
                                        <TableCell className={`text-right font-bold ${isProfit ? "text-red-500" : "text-green-500"}`}>
                                            {position.totalProfit > 0 ? "+" : ""}
                                            {position.totalProfit.toLocaleString(undefined, {
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
                            })}
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
