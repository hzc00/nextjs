
"use client";

import React, { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Loader2, Search, Calculator } from "lucide-react";
import { cn } from "@/lib/utils";
import { updateAssetPosition, searchAsset, getAssetQuote, getAssetClasses } from "../_services/market-actions"; // Import updateAssetPosition
import { toast } from "sonner";
import { useAssets, useAssetClasses, useUpdateAssetPosition } from "../_services/use-asset-queries";
import { Button } from "@/components/ui/button";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import {
    Form,
    FormControl,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
    FormDescription,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";

const formSchema = z.object({
    code: z.string().min(1, "Please select or enter a code"),
    name: z.string().min(1, "Please enter a name"),
    currentPrice: z.coerce.number().min(0.000001, "Current Price is required for calculation"),
    marketValue: z.coerce.number().min(0, "Market Value must be positive"),
    // Optional fields depending on mode
    yieldRate: z.coerce.number().optional(),
    costPrice: z.coerce.number().optional(),
    assetClassId: z.string().optional(),
});

type FormValues = z.infer<typeof formSchema>;

interface TransactionDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    defaultCode?: string;
    defaultType?: string; // Kept for compatibility but unused or mapped
}

export function TransactionDialog({
    open,
    onOpenChange,
    defaultCode,
}: TransactionDialogProps) {
    const [isManual, setIsManual] = React.useState(false);
    const [searching, setSearching] = React.useState(false);
    const [searchResults, setSearchResults] = React.useState<any[]>([]);

    // Mode: "YIELD" (Input Yield -> Calc Cost) | "COST" (Input Cost -> Calc Yield)
    const [mode, setMode] = useState<"YIELD" | "COST">("YIELD");

    const { data: assets } = useAssets();
    const assetOptions = assets || [];

    const form = useForm<FormValues>({
        resolver: zodResolver(formSchema) as any,
        defaultValues: {
            code: defaultCode || "",
            name: "",
            currentPrice: 0,
            marketValue: 0,
            yieldRate: 0,
            costPrice: 0,
        },
    });

    const { watch, setValue, reset, control } = form;
    const currentCode = watch("code");
    const marketValue = watch("marketValue");
    const yieldRate = watch("yieldRate");
    const costPrice = watch("costPrice");
    const currentPrice = watch("currentPrice");

    const { data: assetClassesData } = useAssetClasses();
    const assetClasses = assetClassesData || [];

    // Initialize when opening
    useEffect(() => {
        if (open) {
            setSearchResults([]); // Clear search results
            const known = assetOptions.find((p) => p.code === defaultCode);
            if (known) {
                reset({
                    code: known.code,
                    name: known.name,
                    currentPrice: known.currentPrice,
                    marketValue: known.totalValue ? parseFloat(known.totalValue.toFixed(2)) : 0,
                    // Default to YIELD mode inputs
                    // If we have totalValue and cost, we can reverse calc yield
                    yieldRate: known.totalCost && known.totalValue
                        ? parseFloat((((known.totalValue - known.totalCost) / known.totalCost) * 100).toFixed(2))
                        : 0,
                    costPrice: known.avgCost || 0,
                    assetClassId: known.assetClassId ? String(known.assetClassId) : undefined
                });
                setIsManual(false);
            } else {
                reset({
                    code: defaultCode || "",
                    name: "",
                    currentPrice: 0,
                    marketValue: 0,
                    yieldRate: 0,
                    costPrice: 0,
                    assetClassId: undefined
                });
                if (!defaultCode) setIsManual(false);
            }
        }
    }, [open, defaultCode, assetOptions, reset]);

    const handleAssetSelect = async (value: string) => {
        if (value === "_MANUAL_") {
            setIsManual(true);
            setValue("code", "");
            setValue("name", "");
            setValue("currentPrice", 0);
            setSearchResults([]);
        } else {
            setIsManual(false);
            const selected = assetOptions.find((p) => p.code === value);
            if (selected) {
                setValue("code", value);
                setValue("name", selected.name);
                setValue("currentPrice", selected.currentPrice);
                setValue("marketValue", selected.totalValue ? parseFloat(selected.totalValue.toFixed(2)) : 0);

                // Pre-fill calc fields
                const y = selected.totalCost && selected.totalValue
                    ? ((selected.totalValue - selected.totalCost) / selected.totalCost) * 100
                    : 0;
                setValue("yieldRate", parseFloat(y.toFixed(2)));
                setValue("costPrice", selected.avgCost);
            }
        }
    };

    // Derived Values for Display
    const calculateResults = () => {
        if (!currentPrice || currentPrice <= 0) return { qty: 0, cost: 0, derivedYield: 0 };

        const qty = marketValue / currentPrice;
        let derivedCost = 0;
        let derivedYield = 0;

        if (mode === "YIELD") {
            // Given Yield, Calc Cost
            // MV = Cost * (1 + Yield%)
            // Cost = MV / (1 + Yield%)
            const y = (yieldRate || 0) / 100;
            const totalCost = marketValue / (1 + y);
            derivedCost = totalCost / qty;
            derivedYield = yieldRate || 0;
        } else {
            // Given Cost, Calc Yield
            derivedCost = costPrice || 0;
            const totalCost = derivedCost * qty;
            if (totalCost !== 0) {
                derivedYield = ((marketValue - totalCost) / totalCost) * 100;
            }
        }

        return {
            qty: isFinite(qty) ? qty : 0,
            cost: isFinite(derivedCost) ? derivedCost : 0,
            derivedYield: isFinite(derivedYield) ? derivedYield : 0
        };
    };

    const results = calculateResults();

    const updatePositionMutation = useUpdateAssetPosition();

    const onSubmit = (values: FormValues) => {
        if (!values.code) return;

        // Final Calculation before submit
        const finalQty = results.qty;
        const finalCost = results.cost; // AvgCost

        updatePositionMutation.mutate({
            code: values.code,
            name: values.name,
            quantity: finalQty,
            avgCost: finalCost,
            assetClassId: values.assetClassId ? Number(values.assetClassId) : undefined
        }, {
            onSuccess: () => {
                onOpenChange(false);
            }
        });
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[500px]">
                <DialogHeader>
                    <DialogTitle>{defaultCode ? "Edit Position" : "Add New Position"}</DialogTitle>
                    <DialogDescription>
                        Update your asset position by specifying Market Value and Layout.
                    </DialogDescription>
                </DialogHeader>

                <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">

                        {/* 1. Asset & Price Section */}
                        <div className="p-3 bg-muted/40 rounded-lg space-y-3">
                            {!isManual ? (
                                <FormItem>
                                    <FormLabel>Asset</FormLabel>
                                    <Select
                                        onValueChange={handleAssetSelect}
                                        value={assetOptions.some(p => p.code === currentCode) ? currentCode : undefined}
                                    >
                                        <FormControl>
                                            <SelectTrigger>
                                                <SelectValue placeholder="Select existing asset" />
                                            </SelectTrigger>
                                        </FormControl>
                                        <SelectContent>
                                            {assetOptions.map((p) => (
                                                <SelectItem key={p.id} value={p.code}>
                                                    {p.name} ({p.code})
                                                </SelectItem>
                                            ))}
                                            <SelectItem value="_MANUAL_">+ Add New Asset</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </FormItem>
                            ) : (
                                <div className="space-y-3">
                                    <FormField
                                        control={control}
                                        name="code"
                                        render={({ field }) => (
                                            <FormItem className="flex flex-col relative">
                                                <FormLabel>Code (Search)</FormLabel>
                                                <Popover open={searching || searchResults.length > 0} onOpenChange={() => { }}>
                                                    <PopoverTrigger asChild>
                                                        <div className="flex space-x-2">
                                                            <FormControl>
                                                                <Input placeholder="e.g. AAPL, 00700" {...field} />
                                                            </FormControl>
                                                            <Button type="button" size="icon" variant="outline" onClick={async () => {
                                                                const q = field.value;
                                                                if (!q) return;
                                                                setSearching(true);
                                                                try {
                                                                    const res = await searchAsset(q);
                                                                    if (res?.data?.length) {
                                                                        setSearchResults(res.data);
                                                                    } else {
                                                                        toast.error("No results");
                                                                        setSearchResults([]);
                                                                    }
                                                                } finally {
                                                                    setSearching(false);
                                                                }
                                                            }}>
                                                                {searching ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}
                                                            </Button>
                                                        </div>
                                                    </PopoverTrigger>
                                                    <PopoverContent className="p-0 w-[400px]" align="start" onOpenAutoFocus={(e) => e.preventDefault()}>
                                                        <div className="max-h-[200px] overflow-y-auto">
                                                            {searchResults.length > 0 ? (
                                                                searchResults.map((item) => (
                                                                    <div
                                                                        key={item.symbol}
                                                                        className="p-2 hover:bg-accent cursor-pointer border-b last:border-0 flex justify-between"
                                                                        onClick={async () => {
                                                                            setValue("code", item.symbol);
                                                                            if (item.name) setValue("name", item.name);
                                                                            setSearchResults([]); // Close list

                                                                            const quote = await getAssetQuote(item.symbol);
                                                                            if (quote?.data?.price) setValue("currentPrice", quote.data.price);
                                                                        }}
                                                                    >
                                                                        <div className="flex flex-col">
                                                                            <span className="font-bold text-sm">{item.symbol}</span>
                                                                            <span className="text-xs text-muted-foreground">{item.name}</span>
                                                                        </div>
                                                                        <div className="text-xs text-muted-foreground self-center">
                                                                            {item.exchange}
                                                                        </div>
                                                                    </div>
                                                                ))
                                                            ) : (
                                                                <div className="p-4 text-sm text-center text-muted-foreground">
                                                                    {searching ? "Searching..." : "No results"}
                                                                </div>
                                                            )}
                                                        </div>
                                                    </PopoverContent>
                                                </Popover>
                                            </FormItem>
                                        )}
                                    />
                                    <FormField
                                        control={control}
                                        name="name"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>Name</FormLabel>
                                                <FormControl><Input {...field} /></FormControl>
                                            </FormItem>
                                        )}
                                    />
                                </div>
                            )}

                            <FormField
                                control={control}
                                name="currentPrice"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel className="flex justify-between">
                                            Current Price
                                            <span className="text-xs text-muted-foreground font-normal">Required for Qty calc</span>
                                        </FormLabel>
                                        <FormControl>
                                            <Input type="number" step="0.01" {...field} />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />

                            <FormField
                                control={control}
                                name="assetClassId"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Strategy Tag</FormLabel>
                                        <Select onValueChange={field.onChange} value={field.value}>
                                            <FormControl>
                                                <SelectTrigger>
                                                    <SelectValue placeholder="None" />
                                                </SelectTrigger>
                                            </FormControl>
                                            <SelectContent>
                                                <SelectItem value="0">None</SelectItem>
                                                {assetClasses.map((c) => (
                                                    <SelectItem key={c.id} value={String(c.id)}>
                                                        <span className="flex items-center">
                                                            <div className="w-2 h-2 rounded-full mr-2" style={{ backgroundColor: c.color }}></div>
                                                            {c.name}
                                                        </span>
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                    </FormItem>
                                )}
                            />
                        </div>

                        {/* 2. Core Inputs: Market Value & Mode */}
                        <div className="grid grid-cols-2 gap-4">
                            <FormField
                                control={control}
                                name="marketValue"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Total Market Value ($)</FormLabel>
                                        <FormControl>
                                            <Input className="text-lg font-bold" type="number" step="0.01" {...field} />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />

                            <div className="space-y-2">
                                <label className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                                    Calculation Mode
                                </label>
                                <Tabs value={mode} onValueChange={(v) => setMode(v as any)} className="w-full">
                                    <TabsList className="grid w-full grid-cols-2">
                                        <TabsTrigger value="YIELD">By Yield</TabsTrigger>
                                        <TabsTrigger value="COST">By Cost</TabsTrigger>
                                    </TabsList>
                                </Tabs>
                            </div>
                        </div>

                        {/* 3. Mode Specific Inputs */}
                        <div className="p-4 border rounded-md bg-accent/20">
                            {mode === "YIELD" ? (
                                <FormField
                                    control={control}
                                    name="yieldRate"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Current Yield Rate (%)</FormLabel>
                                            <FormControl>
                                                <Input type="number" step="0.01" placeholder="e.g. 20.5" {...field} />
                                            </FormControl>
                                            <FormDescription>
                                                Positive for Profit, Negative for Loss.
                                            </FormDescription>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                            ) : (
                                <FormField
                                    control={control}
                                    name="costPrice"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Average Cost Price</FormLabel>
                                            <FormControl>
                                                <Input type="number" step="0.01" {...field} />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                            )}

                            {/* Live Results Preview */}
                            <div className="mt-4 grid grid-cols-3 gap-2 text-sm">
                                <div className="flex flex-col">
                                    <span className="text-muted-foreground">Est. Quantity</span>
                                    <span className="font-mono font-bold">{results.qty.toLocaleString(undefined, { maximumFractionDigits: 4 })}</span>
                                </div>
                                <div className="flex flex-col">
                                    <span className="text-muted-foreground">Avg Cost</span>
                                    <span className={cn("font-mono font-bold", mode === "YIELD" && "text-blue-600")}>
                                        {results.cost.toLocaleString(undefined, { maximumFractionDigits: 2 })}
                                    </span>
                                </div>
                                <div className="flex flex-col">
                                    <span className="text-muted-foreground">Yield</span>
                                    <span className={cn("font-mono font-bold", results.derivedYield >= 0 ? "text-red-500" : "text-green-500")}>
                                        {results.derivedYield > 0 ? "+" : ""}{(Number(results.derivedYield) || 0).toFixed(2)}%
                                    </span>
                                </div>
                            </div>
                        </div>

                        <Button type="submit" className="w-full">
                            Update Position
                        </Button>
                    </form>
                </Form>
            </DialogContent>
        </Dialog>
    );
}

