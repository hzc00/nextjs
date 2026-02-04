"use client";

import { useEffect, useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Trash2, Plus, Save } from "lucide-react";
import { toast } from "sonner";
import { getAssetClasses, upsertAssetClass, deleteAssetClass } from "../_services/market-actions";

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
    const [classes, setClasses] = useState<AssetClass[]>([]);
    const [loading, setLoading] = useState(false);

    const fetchClasses = async () => {
        setLoading(true);
        const data = await getAssetClasses();
        setClasses(data);
        setLoading(false);
    };

    useEffect(() => {
        if (open) {
            fetchClasses();
        }
    }, [open]);

    const handleAdd = () => {
        setClasses([...classes, {
            name: "New Class",
            color: COLORS[classes.length % COLORS.length],
            targetPercent: 0
        }]);
    };

    const handleSave = async (idx: number) => {
        const item = classes[idx];
        if (!item.name) return toast.error("Name is required");

        const res = await upsertAssetClass(item.id, item.name, item.color, Number(item.targetPercent));
        if (res.success) {
            toast.success("Saved");
            fetchClasses();
        } else {
            toast.error(res.error);
        }
    };

    const handleDelete = async (idx: number) => {
        const item = classes[idx];
        if (item.id) {
            if (!confirm("Delete this class?")) return;
            await deleteAssetClass(item.id);
        }
        const next = [...classes];
        next.splice(idx, 1);
        setClasses(next);
        if (item.id) toast.success("Deleted");
    };

    const updateField = (idx: number, field: keyof AssetClass, value: any) => {
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
                    <Button size="sm" onClick={handleAdd}><Plus className="h-4 w-4 mr-2" /> Add Class</Button>
                </div>

                <div className="max-h-[400px] overflow-y-auto border rounded-md">
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
                                        <Button size="icon" variant="ghost" onClick={() => handleSave(idx)}>
                                            <Save className="h-4 w-4 text-blue-500" />
                                        </Button>
                                        <Button size="icon" variant="ghost" onClick={() => handleDelete(idx)}>
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
                </div>
            </DialogContent>
        </Dialog>
    );
}
