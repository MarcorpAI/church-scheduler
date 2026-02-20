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
    ArrowRight,
} from "lucide-react";
import {
    DragDropContext,
    Droppable,
    Draggable,
    DropResult,
} from "@hello-pangea/dnd";
import Link from "next/link";
import { toast } from "sonner";

interface Department {
    id: string;
    name: string;
}

interface ProgramItem {
    id: string;
    title: string;
    description: string | null;
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
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = seconds % 60;

    let parts = [];
    if (h > 0) parts.push(`${h}h`);
    if (m > 0) parts.push(`${m}m`);
    if (s > 0) parts.push(`${s}s`);

    return parts.length > 0 ? parts.join(" ") : "0s";
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
    const [itemDescription, setItemDescription] = useState("");
    const [durationHours, setDurationHours] = useState("0");
    const [durationMinutes, setDurationMinutes] = useState("5");
    const [itemDeptId, setItemDeptId] = useState<string>("none");

    // Inline Dept creation
    const [isCreatingDept, setIsCreatingDept] = useState(false);
    const [newDeptName, setNewDeptName] = useState("");

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
        setItemDescription("");
        setDurationHours("0");
        setDurationMinutes("5");
        setItemDeptId("none");
        setIsCreatingDept(false);
        setNewDeptName("");
        setDialogOpen(true);
    };

    const openEditDialog = (item: ProgramItem) => {
        setEditingItem(item);
        setItemTitle(item.title);
        setItemDescription(item.description || "");
        setDurationHours(String(Math.floor(item.duration / 3600)));
        setDurationMinutes(String(Math.floor((item.duration % 3600) / 60)));
        setItemDeptId(item.department_id || "none");
        setIsCreatingDept(false);
        setNewDeptName("");
        setDialogOpen(true);
    };

    const handleCreateDept = async () => {
        if (!newDeptName.trim()) return;
        try {
            const res = await fetch("/api/departments", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ name: newDeptName.trim() }),
            });
            if (!res.ok) throw new Error();
            const dept = await res.json();
            setDepartments(prev => [...prev, dept]);
            setItemDeptId(dept.id);
            setIsCreatingDept(false);
            setNewDeptName("");
            toast.success("Department created");
        } catch {
            toast.error("Failed to create department");
        }
    };

    const handleSaveItem = async (e: React.FormEvent) => {
        e.preventDefault();
        const durationSeconds = (parseInt(durationHours) * 3600) + (parseFloat(durationMinutes) * 60);

        const payload = {
            title: itemTitle,
            description: itemDescription || null,
            duration: Math.round(durationSeconds),
            department_id: itemDeptId === "none" ? null : itemDeptId,
        };

        if (editingItem) {
            // Update existing
            try {
                const res = await fetch(`/api/items/${editingItem.id}`, {
                    method: "PUT",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify(payload),
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
                    body: JSON.stringify(payload),
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

    const onDragEnd = async (result: DropResult) => {
        if (!result.destination || !service) return;

        const items = Array.from(service.items);
        const [reorderedItem] = items.splice(result.source.index, 1);
        items.splice(result.destination.index, 0, reorderedItem);

        // Optimistic update
        setService({ ...service, items });

        // Prepare payload for API
        const payload = items.map((item, index) => ({
            id: item.id,
            order: index,
        }));

        try {
            const res = await fetch(`/api/services/${params.id}/items/reorder`, {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(payload),
            });
            if (!res.ok) throw new Error();
        } catch {
            toast.error("Failed to sync reorder with server");
            fetchService(); // Revert to server state
        }
    };

    const handleMoveItem = async (index: number, direction: "up" | "down") => {
        if (!service) return;
        const items = [...service.items];
        const swapIdx = direction === "up" ? index - 1 : index + 1;
        if (swapIdx < 0 || swapIdx >= items.length) return;

        const newItems = [...items];
        [newItems[index], newItems[swapIdx]] = [newItems[swapIdx], newItems[index]];

        setService({ ...service, items: newItems });

        const payload = newItems.map((item, i) => ({
            id: item.id,
            order: i,
        }));

        try {
            await fetch(`/api/services/${params.id}/items/reorder`, {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(payload),
            });
        } catch {
            toast.error("Failed to reorder");
            fetchService();
        }
    };

    const [reviewDialogOpen, setReviewDialogOpen] = useState(false);
    const [advanceMode, setAdvanceMode] = useState<"AUTO" | "MANUAL">("AUTO");
    const [bufferTime, setBufferTime] = useState("0");

    const handleGoLive = async () => {
        try {
            // Update service settings first
            const updateRes = await fetch(`/api/services/${params.id}`, {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    advance_mode: advanceMode,
                    buffer_time: parseInt(bufferTime),
                }),
            });
            if (!updateRes.ok) throw new Error("Failed to update settings");

            const res = await fetch(`/api/services/${params.id}/live/start`, {
                method: "POST",
            });
            if (!res.ok) {
                const data = await res.json();
                toast.error(data.message || "Cannot go live");
                return;
            }
            router.push(`/services/${params.id}/control`);
        } catch (error: any) {
            toast.error(error.message || "Failed to start live session");
        }
    };

    const handleSaveAsTemplate = async () => {
        const templateName = prompt("Enter a name for this template:", `${service?.name} Template`);
        if (!templateName) return;

        try {
            const res = await fetch(`/api/services/${params.id}/to-template`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ templateName }),
            });
            if (!res.ok) throw new Error();
            toast.success("Run sheet saved as template");
        } catch {
            toast.error("Failed to save as template");
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

                <div className="flex flex-wrap gap-4">
                    <button
                        onClick={handleSaveAsTemplate}
                        className="liquid-glass-button h-16 px-6 text-sm border-white/5 opacity-60 hover:opacity-100"
                        title="Save run sheet as a reusable template"
                    >
                        <span className="relative z-10 flex items-center gap-2">
                            <Sparkles className="h-4 w-4" />
                            Save as Template
                        </span>
                    </button>
                    <button onClick={openAddDialog} className="liquid-glass-button h-16 px-8 text-lg shadow-[0_0_30px_rgba(255,255,255,0.05)]">
                        <span className="relative z-10 flex items-center gap-3">
                            <Plus className="h-5 w-5" />
                            Add Item
                        </span>
                    </button>
                    {service.items.length > 0 && !service.is_live && (
                        <button
                            onClick={() => setReviewDialogOpen(true)}
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
                <DialogContent className="max-w-xl bg-black/80 backdrop-blur-3xl border-white/[0.05] rounded-[2.5rem] p-10 shadow-2xl">
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
                    <form onSubmit={handleSaveItem} className="space-y-6 py-6 overflow-y-auto max-h-[60vh] px-2">
                        <div className="space-y-3">
                            <Label className="text-[10px] font-black uppercase text-white/20 tracking-[0.3em]">Item Title</Label>
                            <Input
                                required
                                placeholder="e.g. Opening Prayer"
                                value={itemTitle}
                                onChange={(e) => setItemTitle(e.target.value)}
                                className="h-14 rounded-xl border-white/[0.05] bg-white/[0.02] focus:bg-white/[0.05] focus-visible:ring-amber-500 font-bold text-lg"
                            />
                        </div>

                        <div className="space-y-3">
                            <Label className="text-[10px] font-black uppercase text-white/20 tracking-[0.3em]">Description / Details (Optional)</Label>
                            <Input
                                placeholder="e.g. Lead by Pastor John"
                                value={itemDescription}
                                onChange={(e) => setItemDescription(e.target.value)}
                                className="h-14 rounded-xl border-white/[0.05] bg-white/[0.02] focus:bg-white/[0.05] focus-visible:ring-amber-500 font-bold text-lg"
                            />
                        </div>

                        <div className="grid grid-cols-2 gap-6">
                            <div className="space-y-3">
                                <Label className="text-[10px] font-black uppercase text-white/20 tracking-[0.3em]">Hours</Label>
                                <Input
                                    type="number"
                                    min="0"
                                    value={durationHours}
                                    onChange={(e) => setDurationHours(e.target.value)}
                                    className="h-14 rounded-xl border-white/[0.05] bg-white/[0.02] focus:bg-white/[0.05] focus-visible:ring-amber-500 font-bold text-lg"
                                />
                            </div>
                            <div className="space-y-3">
                                <Label className="text-[10px] font-black uppercase text-white/20 tracking-[0.3em]">Minutes</Label>
                                <Input
                                    type="number"
                                    min="0"
                                    step="0.5"
                                    value={durationMinutes}
                                    onChange={(e) => setDurationMinutes(e.target.value)}
                                    className="h-14 rounded-xl border-white/[0.05] bg-white/[0.02] focus:bg-white/[0.05] focus-visible:ring-amber-500 font-bold text-lg"
                                />
                            </div>
                        </div>

                        <div className="space-y-3">
                            <Label className="text-[10px] font-black uppercase text-white/20 tracking-[0.3em]">Department</Label>
                            {!isCreatingDept ? (
                                <div className="space-y-4">
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
                                    <button
                                        type="button"
                                        onClick={() => setIsCreatingDept(true)}
                                        className="text-[10px] font-black uppercase text-amber-500/50 hover:text-amber-500 tracking-[0.2em] transition-colors"
                                    >
                                        + Create New Department
                                    </button>
                                </div>
                            ) : (
                                <div className="space-y-4 animate-in fade-in slide-in-from-top-2">
                                    <div className="flex gap-2">
                                        <Input
                                            placeholder="Enter department name"
                                            value={newDeptName}
                                            onChange={(e) => setNewDeptName(e.target.value)}
                                            className="h-14 rounded-xl border-amber-500/20 bg-white/[0.05] font-bold"
                                            autoFocus
                                        />
                                        <button
                                            type="button"
                                            onClick={handleCreateDept}
                                            className="h-14 px-6 bg-amber-500 text-black rounded-xl font-black text-xs uppercase"
                                        >
                                            Add
                                        </button>
                                    </div>
                                    <button
                                        type="button"
                                        onClick={() => setIsCreatingDept(false)}
                                        className="text-[10px] font-black uppercase text-white/20 hover:text-white tracking-[0.2em] transition-colors"
                                    >
                                        Cancel
                                    </button>
                                </div>
                            )}
                        </div>
                        <DialogFooter className="pt-6">
                            <button type="submit" className="liquid-glass-button w-full h-18 text-xl tracking-tighter shadow-2xl">
                                <span className="relative z-10 flex items-center justify-center gap-3">
                                    {editingItem ? "Update Item" : "Add to Run Sheet"}
                                    <ArrowRight className="h-5 w-5" />
                                </span>
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
                        <DragDropContext onDragEnd={onDragEnd}>
                            <Droppable droppableId="run-sheet">
                                {(provided) => (
                                    <div
                                        {...provided.droppableProps}
                                        ref={provided.innerRef}
                                        className="divide-y divide-white/[0.03]"
                                    >
                                        {service.items.map((item, index) => (
                                            <Draggable key={item.id} draggableId={item.id} index={index}>
                                                {(provided, snapshot) => (
                                                    <div
                                                        ref={provided.innerRef}
                                                        {...provided.draggableProps}
                                                        className={`flex items-center gap-6 px-12 py-8 transition-colors group ${snapshot.isDragging ? "bg-white/[0.1] backdrop-blur-xl z-50" : "hover:bg-white/[0.02]"
                                                            }`}
                                                    >
                                                        {/* Drag Handle */}
                                                        <div
                                                            {...provided.dragHandleProps}
                                                            className="text-white/10 hover:text-amber-500 transition-colors cursor-grab active:cursor-grabbing"
                                                        >
                                                            <GripVertical className="h-6 w-6" />
                                                        </div>

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
                                                            <div className="flex items-center gap-4 mb-2">
                                                                <span className="text-xl font-black text-white tracking-tight truncate">{item.title}</span>
                                                                {item.department && (
                                                                    <span className="px-3 py-1 rounded-full bg-amber-500/10 text-amber-500 text-[10px] font-black uppercase tracking-widest border border-amber-500/20 shrink-0">
                                                                        {item.department.name}
                                                                    </span>
                                                                )}
                                                            </div>
                                                            {item.description && (
                                                                <p className="text-white/40 text-sm font-medium mb-3 leading-relaxed">
                                                                    {item.description}
                                                                </p>
                                                            )}
                                                            <div className="flex items-center gap-2 text-white/20 text-xs font-black uppercase tracking-widest">
                                                                <Clock className="h-3.5 w-3.5 mr-1" />
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
                                                )}
                                            </Draggable>
                                        ))}
                                        {provided.placeholder}
                                    </div>
                                )}
                            </Droppable>
                        </DragDropContext>
                    )}
                </CardContent>
            </Card>

            {/* Review Dialog */}
            <Dialog open={reviewDialogOpen} onOpenChange={setReviewDialogOpen}>
                <DialogContent className="max-w-2xl bg-black/80 backdrop-blur-3xl border-white/[0.05] rounded-[2.5rem] p-10 shadow-2xl">
                    <DialogHeader className="space-y-6">
                        <div className="h-14 w-14 rounded-2xl bg-amber-500/10 flex items-center justify-center border border-amber-500/20 shadow-inner">
                            <Radio className="h-7 w-7 text-amber-500" />
                        </div>
                        <div className="space-y-2">
                            <DialogTitle className="text-4xl font-black text-white tracking-tighter">
                                Review Run Sheet
                            </DialogTitle>
                            <DialogDescription className="font-medium text-white/30 text-lg leading-relaxed">
                                Configure your live settings before broadcasting.
                            </DialogDescription>
                        </div>
                    </DialogHeader>

                    <div className="space-y-10 py-8">
                        <div className="grid grid-cols-2 gap-8">
                            <div className="space-y-4">
                                <Label className="text-[10px] font-black uppercase text-white/20 tracking-[0.3em]">Advance Mode</Label>
                                <Select value={advanceMode} onValueChange={(v: any) => setAdvanceMode(v)}>
                                    <SelectTrigger className="h-16 rounded-2xl border-white/[0.05] bg-white/[0.02] text-white/80 font-black uppercase text-xs tracking-widest">
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent className="rounded-[2rem] border-white/10 bg-black/80 backdrop-blur-3xl p-2 shadow-2xl">
                                        <SelectItem value="AUTO" className="font-black py-4 px-6 text-xs uppercase tracking-widest focus:bg-amber-500/10 focus:text-amber-500">Auto-Advance</SelectItem>
                                        <SelectItem value="MANUAL" className="font-black py-4 px-6 text-xs uppercase tracking-widest focus:bg-amber-500/10 focus:text-amber-500">Manual</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>

                            <div className="space-y-4">
                                <Label className="text-[10px] font-black uppercase text-white/20 tracking-[0.3em]">Buffer (Seconds)</Label>
                                <Input
                                    type="number"
                                    min="0"
                                    max="60"
                                    value={bufferTime}
                                    onChange={(e) => setBufferTime(e.target.value)}
                                    className="h-16 rounded-2xl border-white/[0.05] bg-white/[0.02] focus:bg-white/[0.05] focus-visible:ring-amber-500 font-black text-lg"
                                />
                            </div>
                        </div>

                        <div className="space-y-4">
                            <Label className="text-[10px] font-black uppercase text-white/20 tracking-[0.3em]">Service Overview</Label>
                            <div className="max-h-[200px] overflow-y-auto rounded-3xl border border-white/5 bg-white/[0.01] divide-y divide-white/[0.03]">
                                {service.items.map((item, i) => (
                                    <div key={item.id} className="p-4 flex justify-between items-center">
                                        <div className="flex items-center gap-4">
                                            <span className="text-[10px] font-black text-white/10 w-4">{i + 1}</span>
                                            <span className="text-sm font-bold text-white/60">{item.title}</span>
                                        </div>
                                        <span className="text-[10px] font-black text-white/20 uppercase tracking-widest">{formatDuration(item.duration)}</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>

                    <DialogFooter>
                        <button
                            onClick={handleGoLive}
                            className="liquid-glass-button w-full h-20 text-xl tracking-tighter shadow-2xl border-amber-500/20"
                        >
                            <span className="relative z-10 flex items-center justify-center gap-3 text-amber-500">
                                Start Live Service
                                <Radio className="h-6 w-6 animate-pulse" />
                            </span>
                        </button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}
