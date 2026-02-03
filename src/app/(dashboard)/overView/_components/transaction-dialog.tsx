"use client";

import React, { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { format } from "date-fns";
import { CalendarIcon, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { useCreateTransaction } from "../_services/use-transaction-mutations";
import { useAssets } from "../_services/use-asset-queries";
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
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Calendar } from "@/components/ui/calendar";
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";

const formSchema = z.object({
    type: z.enum(["BUY", "SELL", "DIVIDEND", "TRANSFER"]),
    code: z.string().min(1, "Please select or enter a code"),
    name: z.string().min(1, "Please enter a name"), // Added name field
    price: z.coerce.number().min(0, "Price must be positive"),
    quantity: z.coerce.number().min(0, "Quantity must be positive"),
    fee: z.coerce.number().min(0).optional(),
    date: z.date(),
});

type FormValues = z.infer<typeof formSchema>;

interface TransactionDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    defaultCode?: string;
    defaultType?: "BUY" | "SELL";
}

export function TransactionDialog({
    open,
    onOpenChange,
    defaultCode,
    defaultType = "BUY",
}: TransactionDialogProps) {
    const [isManual, setIsManual] = React.useState(false);

    const { data: assets } = useAssets();
    const assetOptions = assets || [];

    const form = useForm<FormValues>({
        resolver: zodResolver(formSchema) as any,
        defaultValues: {
            type: defaultType,
            code: defaultCode || "",
            name: "",
            price: 0,
            quantity: 0,
            fee: 0,
            date: new Date(),
        },
    });

    const { watch, setValue, reset } = form;
    const price = watch("price");
    const quantity = watch("quantity");
    const currentType = watch("type");
    const currentCode = watch("code");

    const totalAmount = (price || 0) * (quantity || 0);

    // Sync defaultCode to form and handle known names
    useEffect(() => {
        if (open) {
            // Try to find name from real assets first
            const known = assetOptions.find((p) => p.code === defaultCode);
            // Fallback to MOCK if strictly needed or just empty

            reset({
                type: defaultType,
                code: defaultCode || "",
                name: known?.name || "",
                price: 0,
                quantity: 0,
                fee: 0,
                date: new Date(),
            });

            if (!defaultCode) setIsManual(false);
        }
    }, [open, defaultCode, defaultType, reset, assetOptions]); // Added assetOptions dep

    const { mutate: createTx, isPending } = useCreateTransaction({
        onSuccess: () => {
            onOpenChange(false);
            reset(); // Clear form
        }
    });

    function onSubmit(values: FormValues) {
        if (isPending) return;

        createTx({
            type: values.type,
            assetCode: values.code,
            assetName: values.name,
            quantity: values.quantity,
            price: values.price,
            fee: values.fee || 0,
            date: values.date,
            notes: "",
        });
    }

    const handleAssetSelect = (value: string) => {
        if (value === "_MANUAL_") {
            setIsManual(true);
            setValue("code", "");
            setValue("name", "");
        } else {
            setIsManual(false);
            const selected = assetOptions.find((p) => p.code === value);
            setValue("code", value);
            setValue("name", selected?.name || "");
        }
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle>Record Transaction</DialogTitle>
                    <DialogDescription>
                        Enter the details of your transaction.
                    </DialogDescription>
                </DialogHeader>

                <Tabs
                    defaultValue={defaultType}
                    onValueChange={(val) => setValue("type", val as any)}
                    className="w-full"
                >
                    <TabsList className="grid w-full grid-cols-2">
                        <TabsTrigger
                            value="BUY"
                            className="data-[state=active]:bg-red-100 data-[state=active]:text-red-700 dark:data-[state=active]:bg-red-900/30 dark:data-[state=active]:text-red-400"
                        >
                            Buy
                        </TabsTrigger>
                        <TabsTrigger
                            value="SELL"
                            className="data-[state=active]:bg-green-100 data-[state=active]:text-green-700 dark:data-[state=active]:bg-green-900/30 dark:data-[state=active]:text-green-400"
                        >
                            Sell
                        </TabsTrigger>
                    </TabsList>
                </Tabs>

                <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 mt-4">
                        {/* Asset Selection / Input */}
                        {!isManual ? (
                            <FormItem>
                                <FormLabel>Asset</FormLabel>
                                <Select
                                    onValueChange={handleAssetSelect}
                                    value={assetOptions.some(p => p.code === currentCode) ? currentCode : undefined}
                                >
                                    <FormControl>
                                        <SelectTrigger>
                                            <SelectValue placeholder="Select asset" />
                                        </SelectTrigger>
                                    </FormControl>
                                    <SelectContent>
                                        {assetOptions.map((p) => (
                                            <SelectItem key={p.id} value={p.code}>
                                                {p.name} ({p.code})
                                            </SelectItem>
                                        ))}
                                        <SelectItem value="_MANUAL_">+ Input Manually</SelectItem>
                                    </SelectContent>
                                </Select>
                                <FormMessage />
                            </FormItem>
                        ) : (
                            <div className="grid grid-cols-2 gap-4">
                                <FormField
                                    control={form.control}
                                    name="code"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Code</FormLabel>
                                            <FormControl>
                                                <Input placeholder="e.g. 00700" {...field} />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                                <FormField
                                    control={form.control}
                                    name="name"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Name</FormLabel>
                                            <FormControl>
                                                <Input placeholder="e.g. Tencent" {...field} />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                            </div>
                        )}

                        {isManual && (
                            <div className="flex justify-end">
                                <Button variant="ghost" size="sm" onClick={() => setIsManual(false)} type="button">
                                    Back to Selection
                                </Button>
                            </div>
                        )}

                        <div className="grid grid-cols-2 gap-4">
                            {/* Price */}
                            <FormField
                                control={form.control}
                                name="price"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Price</FormLabel>
                                        <FormControl>
                                            <Input type="number" step="0.01" {...field} />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />

                            {/* Quantity */}
                            <FormField
                                control={form.control}
                                name="quantity"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Quantity</FormLabel>
                                        <FormControl>
                                            <Input type="number" step="1" {...field} />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                        </div>

                        {/* Calculated Total */}
                        <div className="p-3 bg-muted rounded-md flex justify-between items-center">
                            <span className="text-sm font-medium">Est. Total:</span>
                            <span className="text-lg font-bold font-mono">
                                {totalAmount.toLocaleString(undefined, {
                                    minimumFractionDigits: 2,
                                    maximumFractionDigits: 2,
                                })}
                            </span>
                        </div>

                        {/* Date Picker */}
                        <FormField
                            control={form.control}
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
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        <Button type="submit" className="w-full">
                            Submit Transaction
                        </Button>
                    </form>
                </Form>
            </DialogContent>
        </Dialog>
    );
}
