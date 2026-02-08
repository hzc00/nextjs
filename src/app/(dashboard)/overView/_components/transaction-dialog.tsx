
"use client";

import React, { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2, Search, ArrowRightLeft, DollarSign } from "lucide-react";
import { cn } from "@/lib/utils";
import { searchAsset, getAssetQuote } from "../_services/market-actions";
import { toast } from "sonner";
import { useAssets, useAssetClasses, useUpdateAssetPosition, useRecordCapitalFlow } from "../_services/use-asset-queries";
import { UpdatePositionSchema, UpdatePositionFormValues, updatePositionDefaultValues } from "../_types/transaction-form.schema";
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
import { Calendar } from "@/components/ui/calendar";
import { CalendarIcon } from "lucide-react";
import { format } from "date-fns";

interface TransactionDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    defaultCode?: string;
}

type SearchResult = {
    symbol: string;
    name: string;
    exchange?: string;
    type?: string;
};

export function TransactionDialog({
    open,
    onOpenChange,
    defaultCode,
}: TransactionDialogProps) {
    const [isManual, setIsManual] = React.useState(false);
    const [searching, setSearching] = React.useState(false);
    const [searchResults, setSearchResults] = React.useState<SearchResult[]>([]);
    
    // Main Tab: "ASSET" or "FLOW"
    const [mainTab, setMainTab] = React.useState<"ASSET" | "FLOW">("ASSET");

    const { data: assets } = useAssets();
    const assetOptions = React.useMemo(() => assets || [], [assets]);

    const form = useForm<UpdatePositionFormValues>({
        resolver: zodResolver(UpdatePositionSchema) as unknown as import("react-hook-form").Resolver<UpdatePositionFormValues>,
        defaultValues: {
            ...updatePositionDefaultValues,
            code: defaultCode || "",
        },
    });

    const { watch, setValue, reset, control } = form;
    const mode = watch("mode");
    const currentCode = watch("code");
    const marketValue = watch("marketValue");
    const yieldRate = watch("yieldRate");
    const costPrice = watch("costPrice");
    const currentPrice = watch("currentPrice");

    const { data: assetClassesData } = useAssetClasses();
    const assetClasses = assetClassesData || [];

    const updatePositionMutation = useUpdateAssetPosition();
    const recordFlowMutation = useRecordCapitalFlow();

    // Helper to determine decimals
    const getDecimalPlaces = (code: string, name: string, type?: string) => {
        if (type === 'FUND') return 4;
        if (name && name.toUpperCase().includes('ETF')) return 3;
        return 2;
    };

    // Initialize when opening
    useEffect(() => {
        if (open) {
            setSearchResults([]); // Clear search results
            if (defaultCode) {
                // If opening with a code, usually means editing an Asset
                setMainTab("ASSET");
                const known = assetOptions.find((p) => p.code === defaultCode);
                if (known) {
                    const decimals = getDecimalPlaces(known.code, known.name, known.type);
                    reset({
                        code: known.code,
                        name: known.name,
                        currentPrice: known.currentPrice,
                        marketValue: known.totalValue ? parseFloat(known.totalValue.toFixed(2)) : 0,
                        yieldRate: known.totalCost && known.totalValue
                            ? parseFloat((((known.totalValue - known.totalCost) / known.totalCost) * 100).toFixed(2))
                            : 0,
                        costPrice: known.avgCost ? parseFloat(known.avgCost.toFixed(decimals)) : 0,
                        assetClassId: known.assetClassId ? String(known.assetClassId) : undefined,
                        currency: known.currency || "CNY",
                        mode: "YIELD",
                        type: known.type as any,
                    });
                    setIsManual(false);
                } else {
                    // New Asset Default
                     reset({ ...updatePositionDefaultValues, code: defaultCode });
                }
            } else {
                // Default Clean State
                reset(updatePositionDefaultValues);
                setIsManual(false);
            }
        }
    }, [open, defaultCode, assetOptions, reset]);

    // Handle Tab Change
    useEffect(() => {
        if (mainTab === "FLOW") {
            setValue("mode", "FLOW");
            // Default to Deposit
            setValue("type", "DEPOSIT");
            setValue("date", new Date());
        } else {
            setValue("mode", "YIELD");
             // Reset type if it was DEPOSIT/WITHDRAW
             const currentType = form.getValues("type");
             if (currentType === "DEPOSIT" || currentType === "WITHDRAW") {
                 setValue("type", "STOCK");
             }
        }
    }, [mainTab, setValue, form]);


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
                const decimals = getDecimalPlaces(selected.code, selected.name, selected.type);
                setValue("code", value);
                setValue("name", selected.name);
                setValue("currentPrice", selected.currentPrice);
                setValue("marketValue", selected.totalValue ? parseFloat(selected.totalValue.toFixed(2)) : 0);
                const y = selected.totalCost && selected.totalValue
                    ? ((selected.totalValue - selected.totalCost) / selected.totalCost) * 100
                    : 0;
                setValue("yieldRate", parseFloat(y.toFixed(2)));
                setValue("costPrice", selected.avgCost ? parseFloat(selected.avgCost.toFixed(decimals)) : 0);
                setValue("type", selected.type as any);
            }
        }
    };

    const calculateResults = () => {
        const cp = Number(currentPrice);
        const mv = Number(marketValue);
        const yr = Number(yieldRate);
        const costP = Number(costPrice);

        if (!cp || cp <= 0) return { qty: 0, cost: 0, derivedYield: 0 };

        const qty = mv / cp;
        let derivedCost = 0;
        let derivedYield = 0;

        if (mode === "YIELD") {
            const y = (yr || 0) / 100;
            const totalCost = mv / (1 + y);
            derivedCost = totalCost / qty;
            derivedYield = yr || 0;
        } else {
            derivedCost = costP || 0;
            const totalCost = derivedCost * qty;
            if (totalCost !== 0) {
                derivedYield = ((mv - totalCost) / totalCost) * 100;
            }
        }

        return {
            qty: isFinite(qty) ? qty : 0,
            cost: isFinite(derivedCost) ? derivedCost : 0,
            derivedYield: isFinite(derivedYield) ? derivedYield : 0
        };
    };

    const results = calculateResults();
    const isPending = updatePositionMutation.isPending || recordFlowMutation.isPending;

    const onSubmit = (values: UpdatePositionFormValues) => {
        if (mainTab === "FLOW") {
             // Handle Capital Flow
             if (!values.type || (values.type !== "DEPOSIT" && values.type !== "WITHDRAW")) return;
             
             recordFlowMutation.mutate({
                 type: values.type,
                 amount: Number(values.marketValue), // Amount
                 date: values.date || new Date(),
             }, {
                 onSuccess: () => onOpenChange(false)
             });
             return;
        }

        // Handle Asset Update
        if (!values.code) return;

        const finalQty = Number(results.qty);
        const finalCost = Number(results.cost);

        updatePositionMutation.mutate({
            code: values.code,
            name: values.name || values.code,
            quantity: finalQty,
            avgCost: finalCost,
            assetClassId: values.assetClassId ? Number(values.assetClassId) : undefined,
            currentPrice: Number(values.currentPrice),
            currency: values.currency,
            type: values.type as any,
        }, {
            onSuccess: () => {
                onOpenChange(false);
            }
        });
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[500px] max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle>Manage Portfolio</DialogTitle>
                    <DialogDescription>
                        Record a transaction or update an asset position.
                    </DialogDescription>
                </DialogHeader>

                <Tabs value={mainTab} onValueChange={(v) => setMainTab(v as any)} className="w-full">
                    <TabsList className="grid w-full grid-cols-2 mb-4">
                        <TabsTrigger value="ASSET">Asset Position</TabsTrigger>
                        <TabsTrigger value="FLOW">Capital Flow (Deposit/Withdraw)</TabsTrigger>
                    </TabsList>
                </Tabs>

                <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                        
                        {mainTab === "ASSET" && (
                            <>
                                {/* Asset Selection & Price */}
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
                                                                <div className="max-h-[300px] overflow-y-auto" onWheel={(e) => e.stopPropagation()}>
                                                                    {searchResults.length > 0 && searchResults.map((item) => (
                                                                        <div
                                                                            key={item.symbol}
                                                                            className="p-2 hover:bg-accent cursor-pointer border-b last:border-0 flex justify-between"
                                                                            onClick={async () => {
                                                                                setValue("code", item.symbol);
                                                                                if (item.name) setValue("name", item.name);
                                                                                let t = "STOCK";
                                                                                if (item.type === "FUND") t = "FUND";
                                                                                setValue("type", t as any);
                                                                                setSearchResults([]); 
                                                                                const quote = await getAssetQuote(item.symbol);
                                                                                if (quote?.data?.price) setValue("currentPrice", quote.data.price);
                                                                            }}
                                                                        >
                                                                            <div className="flex flex-col">
                                                                                <span className="font-bold text-sm">{item.symbol}</span>
                                                                                <span className="text-xs text-muted-foreground">{item.name}</span>
                                                                            </div>
                                                                            <div className="text-xs text-muted-foreground self-center">{item.exchange}</div>
                                                                        </div>
                                                                    ))}
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
                                                    <span className="text-xs text-muted-foreground font-normal">Required for Qty</span>
                                                </FormLabel>
                                                <FormControl>
                                                    <Input type="number" step="0.0001" {...field} value={field.value ?? ''} />
                                                </FormControl>
                                            </FormItem>
                                        )}
                                    />
                                    
                                     <div className="grid grid-cols-2 gap-4">
                                         <FormField
                                            control={control}
                                            name="assetClassId"
                                            render={({ field }) => (
                                                <FormItem>
                                                    <FormLabel>Strategy Tag</FormLabel>
                                                    <Select onValueChange={field.onChange} value={field.value}>
                                                        <FormControl>
                                                            <SelectTrigger><SelectValue placeholder="None" /></SelectTrigger>
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
                                        <FormField
                                            control={control}
                                            name="currency"
                                            render={({ field }) => (
                                                <FormItem>
                                                    <FormLabel>Currency</FormLabel>
                                                    <Select onValueChange={field.onChange} value={field.value || "CNY"}>
                                                        <FormControl><SelectTrigger><SelectValue placeholder="CNY" /></SelectTrigger></FormControl>
                                                        <SelectContent>
                                                            <SelectItem value="CNY">CNY (人民币)</SelectItem>
                                                            <SelectItem value="HKD">HKD (港币)</SelectItem>
                                                            <SelectItem value="USD">USD (美元)</SelectItem>
                                                        </SelectContent>
                                                    </Select>
                                                </FormItem>
                                            )}
                                        />
                                     </div>
                                </div>

                                {/* Core Inputs */}
                                <div className="grid grid-cols-2 gap-4">
                                    <FormField
                                        control={control}
                                        name="marketValue"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>Total Market Value ($)</FormLabel>
                                                <FormControl>
                                                    <Input className="text-lg font-bold" type="number" step="0.01" {...field} value={field.value ?? ''} />
                                                </FormControl>
                                            </FormItem>
                                        )}
                                    />
                                     <div className="space-y-2">
                                        <label className="text-sm font-medium">Calculation Mode</label>
                                        <Tabs value={mode} onValueChange={(v) => setValue("mode", v as "YIELD" | "COST")} className="w-full">
                                            <TabsList className="grid w-full grid-cols-2">
                                                <TabsTrigger value="YIELD">By Yield</TabsTrigger>
                                                <TabsTrigger value="COST">By Cost</TabsTrigger>
                                            </TabsList>
                                        </Tabs>
                                    </div>
                                </div>

                                 {/* Mode Specific Inputs */}
                                <div className="p-4 border rounded-md bg-accent/20">
                                    {mode === "YIELD" ? (
                                        <FormField
                                            control={control}
                                            name="yieldRate"
                                            render={({ field }) => (
                                                <FormItem>
                                                    <FormLabel>Current Yield Rate (%)</FormLabel>
                                                    <FormControl>
                                                        <Input type="number" step="0.01" placeholder="e.g. 20.5" {...field} value={field.value ?? ''} />
                                                    </FormControl>
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
                                                        <Input type="number" step="0.0001" {...field} value={field.value ?? ''} />
                                                    </FormControl>
                                                </FormItem>
                                            )}
                                        />
                                    )}
                                    
                                    {/* Preview */}
                                    <div className="mt-4 grid grid-cols-3 gap-2 text-sm">
                                        <div className="flex flex-col">
                                            <span className="text-muted-foreground">Est. Quantity</span>
                                            <span className="font-mono font-bold">{results.qty.toLocaleString(undefined, { maximumFractionDigits: 4 })}</span>
                                        </div>
                                         <div className="flex flex-col">
                                            <span className="text-muted-foreground">Avg Cost</span>
                                            <span className="font-mono font-bold">{results.cost.toLocaleString(undefined, { maximumFractionDigits: 2 })}</span>
                                        </div>
                                        <div className="flex flex-col">
                                            <span className="text-muted-foreground">Yield</span>
                                            <span className={cn("font-mono font-bold", results.derivedYield >= 0 ? "text-red-500" : "text-green-500")}>
                                                {results.derivedYield > 0 ? "+" : ""}{(Number(results.derivedYield) || 0).toFixed(2)}%
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            </>
                        )}

                        {mainTab === "FLOW" && (
                            <div className="space-y-4">
                                <div className="p-4 bg-muted/30 rounded-lg border flex flex-col items-center">
                                    <FormLabel className="mb-4 text-center text-lg">Transaction Type</FormLabel>
                                    <FormField
                                        control={control}
                                        name="type"
                                        render={({ field }) => (
                                            <FormItem>
                                                <Tabs 
                                                    value={field.value as string} 
                                                    onValueChange={(v) => field.onChange(v)} 
                                                    className="w-full max-w-sm"
                                                >
                                                    <TabsList className="grid w-full grid-cols-2">
                                                        <TabsTrigger value="DEPOSIT" className="data-[state=active]:bg-green-100 data-[state=active]:text-green-900">
                                                            DEPOSIT (Inflow)
                                                        </TabsTrigger>
                                                        <TabsTrigger value="WITHDRAW" className="data-[state=active]:bg-red-100 data-[state=active]:text-red-900">
                                                            WITHDRAW (Outflow)
                                                        </TabsTrigger>
                                                    </TabsList>
                                                </Tabs>
                                            </FormItem>
                                        )}
                                    />
                                </div>

                                <FormField
                                    control={control}
                                    name="marketValue"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Amount</FormLabel>
                                            <FormControl>
                                                <div className="relative">
                                                    <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                                    <Input className="pl-9 text-lg" type="number" step="0.01" placeholder="0.00" {...field} />
                                                </div>
                                            </FormControl>
                                            <FormDescription>
                                                 Enter the total cash amount added or removed.
                                            </FormDescription>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />

                                <FormField
                                    control={control}
                                    name="date"
                                    render={({ field }) => (
                                        <FormItem className="flex flex-col">
                                            <FormLabel>Date</FormLabel>
                                            <Popover>
                                                <PopoverTrigger asChild>
                                                    <FormControl>
                                                        <Button
                                                            variant={"outline"}
                                                            className={cn(
                                                                "w-full pl-3 text-left font-normal",
                                                                !field.value && "text-muted-foreground"
                                                            )}
                                                        >
                                                            {field.value ? (
                                                                format(field.value, "PPP")
                                                            ) : (
                                                                <span>Pick a date</span>
                                                            )}
                                                            <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                                                        </Button>
                                                    </FormControl>
                                                </PopoverTrigger>
                                                <PopoverContent className="w-auto p-0" align="start">
                                                    <Calendar
                                                        mode="single"
                                                        selected={field.value}
                                                        onSelect={field.onChange}
                                                        disabled={(date) =>
                                                            date > new Date() || date < new Date("1900-01-01")
                                                        }
                                                        initialFocus
                                                    />
                                                </PopoverContent>
                                            </Popover>
                                        </FormItem>
                                    )}
                                />
                                
                                <div className="text-xs text-muted-foreground bg-blue-50 p-3 rounded-md text-blue-800 break-words whitespace-normal">
                                    <p>
                                        <strong>Note:</strong> Capital flows affect your <strong>Total Principal</strong>. 
                                        Deposits increase principal, withdrawals decrease it. This ensures your Return Rate accurately reflects investment performance, not just money added.
                                    </p>
                                </div>
                            </div>
                        )}

                        <Button type="submit" className="w-full" disabled={isPending}>
                            {isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                            {mainTab === "FLOW" ? "Record Transaction" : "Update Position"}
                        </Button>
                    </form>
                </Form>
            </DialogContent>
        </Dialog>
    );
}

