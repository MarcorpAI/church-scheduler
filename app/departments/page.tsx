"use client";

import { useEffect, useState } from "react";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Trash2, Plus, ChevronLeft, Activity, FolderOpen } from "lucide-react";
import Link from "next/link";
import { toast } from "sonner";

interface Department {
    id: string;
    name: string;
}

export default function DepartmentsPage() {
    const [departments, setDepartments] = useState<Department[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [newName, setNewName] = useState("");
    const [editingId, setEditingId] = useState<string | null>(null);
    const [editingName, setEditingName] = useState("");
    const [isAdding, setIsAdding] = useState(false);

    useEffect(() => {
        fetchDepartments();
    }, []);

    const fetchDepartments = async () => {
        try {
            const res = await fetch("/api/departments");
            if (!res.ok) throw new Error();
            setDepartments(await res.json());
        } catch {
            toast.error("Failed to load departments");
        } finally {
            setIsLoading(false);
        }
    };

    const handleAdd = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newName.trim()) return;
        setIsAdding(true);
        try {
            const res = await fetch("/api/departments", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ name: newName.trim() }),
            });
            if (!res.ok) throw new Error();
            toast.success("Department created");
            setNewName("");
            fetchDepartments();
        } catch {
            toast.error("Failed to create department");
        } finally {
            setIsAdding(false);
        }
    };

    const handleUpdate = async (id: string) => {
        if (!editingName.trim()) return;
        try {
            const res = await fetch(`/api/departments/${id}`, {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ name: editingName.trim() }),
            });
            if (!res.ok) throw new Error();
            toast.success("Department updated");
            setEditingId(null);
            fetchDepartments();
        } catch {
            toast.error("Failed to update department");
        }
    };

    const handleDelete = async (id: string) => {
        if (!confirm("This will also remove this department from any program items it's assigned to. Continue?")) return;
        try {
            const res = await fetch(`/api/departments/${id}`, { method: "DELETE" });
            if (!res.ok) throw new Error();
            toast.success("Department deleted");
            fetchDepartments();
        } catch {
            toast.error("Failed to delete department");
        }
    };

    return (
        <div className="container mx-auto py-32 px-4 md:px-8 max-w-4xl">
            <Link href="/dashboard" className="inline-flex items-center text-xs font-bold uppercase tracking-widest text-white/50 hover:text-amber-500 transition-colors mb-12 group">
                <ChevronLeft className="h-4 w-4 mr-2 group-hover:-translate-x-1 transition-transform" />
                Dashboard
            </Link>

            <div className="space-y-6 mb-16">
                <div className="inline-flex items-center gap-3 px-4 py-1.5 bg-white/[0.06] rounded-full text-xs font-black text-amber-500 uppercase tracking-[0.2em] border border-white/10 backdrop-blur-md">
                    <Activity className="h-4 w-4" />
                    Organization
                </div>
                <h1 className="text-7xl md:text-8xl font-black tracking-tighter leading-none serveflow-title">
                    Depart<span className="serveflow-gold">ments</span>
                </h1>
                <p className="text-white/70 font-medium text-xl max-w-lg leading-relaxed">
                    Organize your teams by department. Assign departments to program items so everyone knows who&apos;s responsible.
                </p>
            </div>

            <form onSubmit={handleAdd} className="flex gap-4 mb-12">
                <Input
                    placeholder="New department name..."
                    value={newName}
                    onChange={(e) => setNewName(e.target.value)}
                    className="h-16 rounded-2xl border-white/[0.05] bg-white/[0.02] focus:bg-white/[0.05] focus-visible:ring-amber-500 font-bold text-lg px-8 flex-1"
                />
                <button
                    type="submit"
                    disabled={isAdding || !newName.trim()}
                    className="liquid-glass-button h-16 px-8 text-lg disabled:opacity-30"
                >
                    <span className="relative z-10 flex items-center gap-2">
                        <Plus className="h-5 w-5" />
                        Add
                    </span>
                </button>
            </form>

            <Card className="liquid-glass border-white/10 overflow-hidden rounded-[3rem] shadow-2xl">
                <CardHeader className="p-12 border-b border-white/[0.06]">
                    <CardTitle className="text-4xl font-black text-white tracking-tighter">All Departments</CardTitle>
                    <CardDescription className="text-white/70 font-medium text-lg">Manage your church&apos;s departments below.</CardDescription>
                </CardHeader>
                <CardContent className="p-0">
                    {isLoading ? (
                        <div className="flex justify-center p-32 text-white/50 font-bold uppercase tracking-widest text-sm">Loading...</div>
                    ) : departments.length === 0 ? (
                        <div className="text-center p-32">
                            <div className="h-24 w-24 bg-white/[0.05] rounded-full flex items-center justify-center mx-auto mb-8 border border-white/10">
                                <FolderOpen className="h-12 w-12 text-white/20" />
                            </div>
                            <h3 className="text-3xl font-black text-white mb-4 tracking-tighter">No Departments</h3>
                            <p className="text-white/60 max-w-xs mx-auto font-medium text-lg leading-relaxed">
                                Add your first department above (e.g. Worship, AV, Ushers).
                            </p>
                        </div>
                    ) : (
                        <div className="divide-y divide-white/[0.03]">
                            {departments.map((dept) => (
                                <div key={dept.id} className="px-12 py-8 hover:bg-white/[0.02] transition-colors group">
                                    <div className="flex items-center justify-between">
                                        {editingId === dept.id ? (
                                            <div className="flex gap-4 flex-1 mr-8">
                                                <Input
                                                    value={editingName}
                                                    onChange={(e) => setEditingName(e.target.value)}
                                                    className="h-12 rounded-xl border-amber-500/30 bg-white/[0.05] focus:bg-white/[0.08] font-bold"
                                                    autoFocus
                                                    onKeyDown={(e) => {
                                                        if (e.key === "Enter") handleUpdate(dept.id);
                                                        if (e.key === "Escape") setEditingId(null);
                                                    }}
                                                />
                                                <button
                                                    onClick={() => handleUpdate(dept.id)}
                                                    className="px-4 bg-amber-500 text-black rounded-xl font-black text-xs uppercase"
                                                >
                                                    Save
                                                </button>
                                                <button
                                                    onClick={() => setEditingId(null)}
                                                    className="px-4 bg-white/5 text-white/40 rounded-xl font-black text-xs uppercase hover:bg-white/10"
                                                >
                                                    Cancel
                                                </button>
                                            </div>
                                        ) : (
                                            <>
                                                <span className="text-xl font-bold text-white">{dept.name}</span>
                                                <div className="flex gap-4 opacity-0 group-hover:opacity-100 transition-all">
                                                    <button
                                                        onClick={() => {
                                                            setEditingId(dept.id);
                                                            setEditingName(dept.name);
                                                        }}
                                                        className="h-12 px-6 rounded-2xl bg-white/[0.02] border border-white/5 flex items-center justify-center text-[10px] font-black uppercase tracking-widest text-white/40 hover:text-amber-500 hover:border-amber-500/40 hover:bg-amber-500/5 transition-all duration-300"
                                                    >
                                                        Edit
                                                    </button>
                                                    <button
                                                        onClick={() => handleDelete(dept.id)}
                                                        className="h-12 w-12 rounded-2xl bg-white/[0.02] border border-white/5 flex items-center justify-center text-white/10 hover:text-red-500 hover:border-red-500/40 hover:bg-red-500/5 transition-all duration-300"
                                                    >
                                                        <Trash2 className="h-5 w-5" />
                                                    </button>
                                                </div>
                                            </>
                                        )}
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
