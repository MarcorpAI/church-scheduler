"use client";

import { useEffect, useState, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
    DialogFooter,
} from "@/components/ui/dialog";
import { format } from "date-fns";
import {
    Plus,
    Trash2,
    ChevronLeft,
    Clock,
    Activity,
    GripVertical,
    ArrowUp,
    ArrowDown,
    Pencil,
    Radio,
    Sparkles,
} from "lucide-react";
import Link from "next/link";
import { toast } from "sonner";

interface Department {
    id: string;
    name: string;
}

interface ProgramItem {
    id: string;
    title: string;
    duration: number;
    order: number;
    department_id: string | null;
    department: Department | null;
}

interface Service {
    id: string;
    name: string;
    description: string | null;
    date: string;
    is_live: boolean;
    items: ProgramItem[];
}

function formatDuration(seconds: number): string {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return s > 0 ? `${m}m ${s}s` : `${m}m`;
}

export default function ServiceBuilderPage() {
    const params = useParams() as { id: string };
    const router = useRouter();
    const [service, setService] = useState<Service | null>(null);
    const [departments, setDepartments] = useState<Department[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    // Add/Edit dialog state
    const [dialogOpen, setDialogOpen] = useState(false);
    const [editingItem, setEditingItem] = useState<ProgramItem | null>(null);
    const [itemTitle, setItemTitle] = useState("");
    const [itemDuration, setItemDuration] = useState("5");
    const [itemDeptId, setItemDeptId] = useState<string>("none");

    const fetchService = useCallback(async () => {
        try {
            const res = await fetch(`/api/services/${params.id}`);
            if (!res.ok) throw new Error();
            setService(await res.json());
        } catch {
            toast.error("Failed to load service");
            router.push("/dashboard");
        } finally {
            setIsLoading(false);
        }
    }, [params.id, router]);

    const fetchDepartments = useCallback(async () => {
        try {
            const res = await fetch("/api/departments");
            if (res.ok) setDepartments(await res.json());
        } catch { /* ignore */ }
    }, []);

    useEffect(() => {
        fetchService();
        fetchDepartments();
    }, [fetchService, fetchDepartments]);

    const openAddDialog = () => {
        setEditingItem(null);
        setItemTitle("");
        setItemDuration("5");
        setItemDeptId("none");
        setDialogOpen(true);
    };

    const openEditDialog = (item: ProgramItem) => {
        setEditingItem(item);
        setItemTitle(item.title);
        setItemDuration(String(item.duration / 60));
        setItemDeptId(item.department_id || "none");
        setDialogOpen(true);
    };

    const handleSaveItem = async (e: React.FormEvent) => {
        e.preventDefault();
        const durationSeconds = Math.round(parseFloat(itemDuration) * 60);

        if (editingItem) {
            // Update existing
            try {
                const res = await fetch(`/api/items/${editingItem.id}`, {
                    method: "PUT",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                        title: itemTitle,
                        duration: durationSeconds,
                        department_id: itemDeptId === "none" ? null : itemDeptId,
                    }),
                });
                if (!res.ok) throw new Error();
                toast.success("Item updated");
            } catch {
                toast.error("Failed to update item");
                return;
            }
        } else {
            // Create new
            try {
                const res = await fetch(`/api/services/${params.id}/items`, {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                        title: itemTitle,
                        duration: durationSeconds,
                        department_id: itemDeptId === "none" ? null : itemDeptId,
                    }),
                });
                if (!res.ok) throw new Error();
                toast.success("Item added");
            } catch {
                toast.error("Failed to add item");
                return;
            }
        }

        setDialogOpen(false);
        fetchService();
    };

    const handleDeleteItem = async (itemId: string) => {
        if (!confirm("Remove this item from the run sheet?")) return;
        try {
            await fetch(`/api/items/${itemId}`, { method: "DELETE" });
            toast.success("Item removed");
            fetchService();
        } catch {
            toast.error("Failed to delete item");
        }
    };

    const handleMoveItem = async (index: number, direction: "up" | "down") => {
        if (!service) return;
        const items = [...service.items];
        const swapIdx = direction === "up" ? index - 1 : index + 1;
        if (swapIdx < 0 || swapIdx >= items.length) return;

        // Swap orders
        const reordered = items.map((item, i) => {
            if (i === index) return { id: item.id, order: items[swapIdx].order };
            if (i === swapIdx) return { id: item.id, order: items[index].order };
            return { id: item.id, order: item.order };
        });

        try {
            await fetch(`/api/services/${params.id}/items/reorder`, {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(reordered),
            });
            fetchService();
        } catch {
            toast.error("Failed to reorder");
        }
    };

    const handleGoLive = async () => {
        try {
            const res = await fetch(`/api/services/${params.id}/live/start`, {
                method: "POST",
            });
            if (!res.ok) {
                const data = await res.json();
                toast.error(data.message || "Cannot go live");
                return;
            }
            router.push(`/services/${params.id}/control`);
        } catch {
            toast.error("Failed to start live session");
        }
    };

    if (isLoading) {
        return (
            <div className="p-48 text-center text-white/10 font-black uppercase tracking-[0.5em] animate-pulse">
                Loading...
            </div>
        );
    }
    if (!service) return null;

    const totalDuration = service.items.reduce((sum, i) => sum + i.duration, 0);

    return (
        <div className="container mx-auto py-32 px-4 md:px-8 max-w-6xl">
            <Link
                href="/dashboard"
                className="inline-flex items-center text-xs font-bold uppercase tracking-widest text-white/50 hover:text-amber-500 transition-colors mb-12 group"
            >
                <ChevronLeft className="h-4 w-4 mr-2 group-hover:-translate-x-1 transition-transform" />
                Dashboard
            </Link>

            <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-12 mb-16">
                <div className="space-y-6">
                    <div className="inline-flex items-center gap-3 px-4 py-1.5 bg-white/[0.03] rounded-full text-[10px] font-black text-amber-500 uppercase tracking-[0.3em] border border-white/5 backdrop-blur-md">
                        <Activity className="h-4 w-4" />
                        Run Sheet Builder
                    </div>
                    <h1 className="text-6xl md:text-7xl font-black tracking-tighter leading-none serveflow-title">
                        {service.name}
                    </h1>
                    <div className="flex flex-wrap items-center gap-8 text-white/40 font-bold text-lg">
                        <div className="flex items-center">
                            <Clock className="h-5 w-5 mr-3 text-amber-500/40" />
                            {format(new Date(service.date), "PPP p")}
                        </div>
                        <div className="flex items-center">
                            <span className="text-amber-500/60 mr-2">{service.items.length}</span> items
                            <span className="mx-4 text-white/10">|</span>
                            <span className="text-amber-500/60 mr-2">{formatDuration(totalDuration)}</span> total
                        </div>
                    </div>
                </div>

                <div className="flex gap-4">
                    <button onClick={openAddDialog} className="liquid-glass-button h-16 px-8 text-lg shadow-[0_0_30px_rgba(255,255,255,0.05)]">
                        <span className="relative z-10 flex items-center gap-3">
                            <Plus className="h-5 w-5" />
                            Add Item
                        </span>
                    </button>
                    {service.items.length > 0 && !service.is_live && (
                        <button
                            onClick={handleGoLive}
                            className="liquid-glass-button h-16 px-8 text-lg border-amber-500/30 hover:border-amber-500/60 shadow-[0_0_30px_rgba(245,158,11,0.1)]"
                        >
                            <span className="relative z-10 flex items-center gap-3 text-amber-500">
                                <Radio className="h-5 w-5" />
                                Go Live
                            </span>
                        </button>
                    )}
                    {service.is_live && (
                        <Link href={`/services/${params.id}/control`}>
                            <button className="liquid-glass-button h-16 px-8 text-lg border-red-500/30 animate-pulse">
                                <span className="relative z-10 flex items-center gap-3 text-red-400">
                                    <Radio className="h-5 w-5" />
                                    Live — Open Control
                                </span>
                            </button>
                        </Link>
                    )}
                </div>
            </div>

            {/* Add/Edit Dialog */}
            <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
                <DialogContent className="max-w-md bg-black/80 backdrop-blur-3xl border-white/[0.05] rounded-[2.5rem] p-10 shadow-2xl">
                    <DialogHeader className="space-y-6">
                        <div className="h-14 w-14 rounded-2xl bg-white/[0.03] flex items-center justify-center border border-white/10 shadow-inner">
                            <Sparkles className="h-7 w-7 text-amber-500" />
                        </div>
                        <div className="space-y-2">
                            <DialogTitle className="text-4xl font-black text-white tracking-tighter">
                                {editingItem ? "Edit Item" : "Add Item"}
                            </DialogTitle>
                            <DialogDescription className="font-medium text-white/30 text-lg leading-relaxed">
                                {editingItem ? "Update this program item." : "Add a new item to the run sheet."}
                            </DialogDescription>
                        </div>
                    </DialogHeader>
                    <form onSubmit={handleSaveItem} className="space-y-8 py-6">
                        <div className="space-y-3">
                            <Label className="text-[10px] font-black uppercase text-white/20 tracking-[0.3em]">Title</Label>
                            <Input
                                required
                                placeholder="e.g. Opening Prayer"
                                value={itemTitle}
                                onChange={(e) => setItemTitle(e.target.value)}
                                className="h-14 rounded-xl border-white/[0.05] bg-white/[0.02] focus:bg-white/[0.05] focus-visible:ring-amber-500 font-bold text-lg"
                            />
                        </div>
                        <div className="space-y-3">
                            <Label className="text-[10px] font-black uppercase text-white/20 tracking-[0.3em]">Duration (minutes)</Label>
                            <Input
                                required
                                type="number"
                                min="0.5"
                                step="0.5"
                                placeholder="5"
                                value={itemDuration}
                                onChange={(e) => setItemDuration(e.target.value)}
                                className="h-14 rounded-xl border-white/[0.05] bg-white/[0.02] focus:bg-white/[0.05] focus-visible:ring-amber-500 font-bold text-lg"
                            />
                        </div>
                        <div className="space-y-3">
                            <Label className="text-[10px] font-black uppercase text-white/20 tracking-[0.3em]">Department (optional)</Label>
                            <Select value={itemDeptId} onValueChange={setItemDeptId}>
                                <SelectTrigger className="h-14 rounded-xl border-white/[0.05] bg-white/[0.02] text-white/60 font-bold">
                                    <SelectValue placeholder="None" />
                                </SelectTrigger>
                                <SelectContent className="rounded-[2rem] border-white/10 bg-black/80 backdrop-blur-3xl p-2 shadow-2xl">
                                    <SelectItem value="none" className="font-bold py-4 px-6 text-white/40">None</SelectItem>
                                    {departments.map((d) => (
                                        <SelectItem key={d.id} value={d.id} className="font-bold py-4 px-6 text-white/60 focus:bg-amber-500/10 focus:text-amber-500">
                                            {d.name}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                        <DialogFooter>
                            <button type="submit" className="liquid-glass-button w-full h-16 text-lg tracking-tighter">
                                {editingItem ? "Save Changes" : "Add to Run Sheet"}
                            </button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>

            {/* Run Sheet */}
            <Card className="liquid-glass border-white/5 overflow-hidden rounded-[3rem] shadow-2xl">
                <CardHeader className="p-12 border-b border-white/[0.03] bg-white/[0.01]">
                    <CardTitle className="text-4xl font-black text-white tracking-tighter">Run Sheet</CardTitle>
                    <CardDescription className="text-white/30 font-medium text-lg leading-relaxed">
                        Drag to reorder. Each item runs sequentially during live service.
                    </CardDescription>
                </CardHeader>
                <CardContent className="p-0">
                    {service.items.length === 0 ? (
                        <div className="py-32 text-center">
                            <div className="h-20 w-20 bg-white/[0.02] rounded-[2rem] flex items-center justify-center mx-auto mb-8 border border-white/5 shadow-inner">
                                <Plus className="h-10 w-10 text-white/5" />
                            </div>
                            <p className="text-white/20 font-black uppercase tracking-[0.3em] text-xs mb-6">No items yet</p>
                            <button onClick={openAddDialog} className="liquid-glass-button px-8 py-3">
                                <span className="relative z-10">Add First Item</span>
                            </button>
                        </div>
                    ) : (
                        <div className="divide-y divide-white/[0.03]">
                            {service.items.map((item, index) => (
                                <div
                                    key={item.id}
                                    className="flex items-center gap-6 px-12 py-8 hover:bg-white/[0.02] transition-colors group"
                                >
                                    {/* Order controls */}
                                    <div className="flex flex-col gap-1">
                                        <button
                                            onClick={() => handleMoveItem(index, "up")}
                                            disabled={index === 0}
                                            className="h-8 w-8 rounded-lg bg-white/[0.02] border border-white/5 flex items-center justify-center text-white/20 hover:text-amber-500 hover:border-amber-500/30 transition-all disabled:opacity-10 disabled:cursor-not-allowed"
                                        >
                                            <ArrowUp className="h-3 w-3" />
                                        </button>
                                        <button
                                            onClick={() => handleMoveItem(index, "down")}
                                            disabled={index === service.items.length - 1}
                                            className="h-8 w-8 rounded-lg bg-white/[0.02] border border-white/5 flex items-center justify-center text-white/20 hover:text-amber-500 hover:border-amber-500/30 transition-all disabled:opacity-10 disabled:cursor-not-allowed"
                                        >
                                            <ArrowDown className="h-3 w-3" />
                                        </button>
                                    </div>

                                    {/* Order number */}
                                    <div className="h-12 w-12 rounded-2xl bg-white/[0.03] border border-white/5 flex items-center justify-center text-white/20 font-black text-lg shrink-0">
                                        {index + 1}
                                    </div>

                                    {/* Content */}
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center gap-4 mb-1">
                                            <span className="text-xl font-bold text-white truncate">{item.title}</span>
                                            {item.department && (
                                                <span className="px-3 py-1 rounded-full bg-amber-500/10 text-amber-500 text-[10px] font-black uppercase tracking-widest border border-amber-500/20 shrink-0">
                                                    {item.department.name}
                                                </span>
                                            )}
                                        </div>
                                        <div className="flex items-center gap-2 text-white/30 text-sm font-medium">
                                            <Clock className="h-3 w-3" />
                                            {formatDuration(item.duration)}
                                        </div>
                                    </div>

                                    {/* Actions */}
                                    <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                        <button
                                            onClick={() => openEditDialog(item)}
                                            className="h-10 w-10 rounded-xl bg-white/[0.02] border border-white/5 flex items-center justify-center text-white/20 hover:text-amber-500 hover:border-amber-500/30 transition-all"
                                        >
                                            <Pencil className="h-4 w-4" />
                                        </button>
                                        <button
                                            onClick={() => handleDeleteItem(item.id)}
                                            className="h-10 w-10 rounded-xl bg-white/[0.02] border border-white/5 flex items-center justify-center text-white/20 hover:text-red-500 hover:border-red-500/30 transition-all"
                                        >
                                            <Trash2 className="h-4 w-4" />
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}
