"use client";

import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Trash2, Plus, Save, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { useAssetClasses, useUpsertAssetClass, useDeleteAssetClass } from "../_services/use-asset-queries";
import { useState, useEffect } from "react";

interface AssetClass {
    id?: number;
    name: string;
    color: string;
    targetPercent: number;
}

interface Props {
    open: boolean;
    onOpenChange: (open: boolean) => void;
}

const COLORS = [
    "#EF4444", "#F97316", "#F59E0B", "#84CC16", "#10B981",
    "#06B6D4", "#3B82F6", "#6366F1", "#8B5CF6", "#EC4899"
];

export function StrategyManageDialog({ open, onOpenChange }: Props) {
    const { data: serverClasses, isLoading } = useAssetClasses();
    const upsertMutation = useUpsertAssetClass();
    const deleteMutation = useDeleteAssetClass();

    const [classes, setClasses] = useState<AssetClass[]>([]);

    // Sync local state with server state when not loading
    useEffect(() => {
        if (serverClasses) {
            setClasses(serverClasses);
        }
    }, [serverClasses]);

    const handleAdd = () => {
        setClasses([...classes, {
            name: "New Class",
            color: COLORS[classes.length % COLORS.length],
            targetPercent: 0
        }]);
    };

    const handleSave = (idx: number) => {
        const item = classes[idx];
        if (!item.name) return toast.error("Name is required");

        // Calculate total if we save this change (already in state)
        // But we need to check if the CURRENT state (which includes this edit) is valid?
        // Actually, since we update state on change, 'totalTarget' variable (derived from state) 
        // already reflects the proposed distribution.
        if (totalTarget > 100) {
            return toast.error(`Total target (${totalTarget}%) exceeds 100%`);
        }

        upsertMutation.mutate({
            id: item.id,
            name: item.name,
            color: item.color,
            targetPercent: Number(item.targetPercent)
        });
    };

    const handleDelete = (idx: number) => {
        const item = classes[idx];
        if (item.id) {
            if (!confirm("Delete this class?")) return;
            deleteMutation.mutate(item.id);
        } else {
            // Just remove from local state if not saved yet
            const next = [...classes];
            next.splice(idx, 1);
            setClasses(next);
        }
    };

    const updateField = (idx: number, field: keyof AssetClass, value: string | number) => {
        const next = [...classes];
        next[idx] = { ...next[idx], [field]: value };
        setClasses(next);
    };

    const totalTarget = classes.reduce((sum, c) => sum + Number(c.targetPercent || 0), 0);

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[700px]">
                <DialogHeader>
                    <DialogTitle>Strategy Configuration</DialogTitle>
                    <DialogDescription>
                        Define your asset classes and target allocations.
                    </DialogDescription>
                </DialogHeader>

                <div className="flex justify-between items-center mb-2">
                    <div className="text-sm font-medium">
                        Total Target: <span className={totalTarget === 100 ? "text-green-500" : "text-red-500"}>{totalTarget}%</span>
                    </div>
                    <Button size="sm" onClick={handleAdd} disabled={totalTarget >= 100}><Plus className="h-4 w-4 mr-2" /> Add Class</Button>
                </div>

                <div className="max-h-[400px] overflow-y-auto border rounded-md">
                    {isLoading ? (
                        <div className="flex justify-center p-8"><Loader2 className="animate-spin" /></div>
                    ) : (
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Color</TableHead>
                                    <TableHead>Name</TableHead>
                                    <TableHead>Target %</TableHead>
                                    <TableHead className="text-right">Actions</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {classes.map((c, idx) => (
                                    <TableRow key={idx}>
                                        <TableCell>
                                            <div className="flex items-center space-x-2">
                                                <input
                                                    type="color"
                                                    value={c.color}
                                                    onChange={(e) => updateField(idx, 'color', e.target.value)}
                                                    className="w-8 h-8 rounded cursor-pointer border-0 p-0"
                                                />
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            <Input
                                                value={c.name}
                                                onChange={(e) => updateField(idx, 'name', e.target.value)}
                                                className="h-8"
                                            />
                                        </TableCell>
                                        <TableCell>
                                            <Input
                                                type="number"
                                                value={c.targetPercent}
                                                onChange={(e) => updateField(idx, 'targetPercent', e.target.value)}
                                                className="h-8 w-20"
                                            />
                                        </TableCell>
                                        <TableCell className="text-right space-x-2">
                                            <Button size="icon" variant="ghost" onClick={() => handleSave(idx)} disabled={upsertMutation.isPending}>
                                                <Save className="h-4 w-4 text-blue-500" />
                                            </Button>
                                            <Button size="icon" variant="ghost" onClick={() => handleDelete(idx)} disabled={deleteMutation.isPending}>
                                                <Trash2 className="h-4 w-4 text-red-500" />
                                            </Button>
                                        </TableCell>
                                    </TableRow>
                                ))}
                                {classes.length === 0 && (
                                    <TableRow>
                                        <TableCell colSpan={4} className="text-center text-muted-foreground">
                                            No asset classes defined. Add one to start.
                                        </TableCell>
                                    </TableRow>
                                )}
                            </TableBody>
                        </Table>
                    )}
                </div>
            </DialogContent>
        </Dialog>
    );
}
