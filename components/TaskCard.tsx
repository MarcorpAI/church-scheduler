"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue
} from "@/components/ui/select";
import { Calendar, Clock, Info, CheckCircle2 } from "lucide-react";
import { format } from "date-fns";
import { toast } from "sonner";

interface TaskCardProps {
    task: {
        id: string;
        title: string;
        description: string | null;
        status: string;
        due_time: string | null;
        service: {
            name: string;
            date: string;
        }
    };
    onUpdate?: () => void;
}

export default function TaskCard({ task, onUpdate }: TaskCardProps) {
    const [status, setStatus] = useState(task.status);
    const [isUpdating, setIsUpdating] = useState(false);

    const handleStatusChange = async (newStatus: string) => {
        setIsUpdating(true);
        try {
            const res = await fetch(`/api/tasks/${task.id}/status`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ status: newStatus }),
            });

            if (!res.ok) throw new Error("Failed to update status");

            setStatus(newStatus);
            toast.success(`Protocol ${newStatus.replace("_", " ")} synced`);
            if (onUpdate) onUpdate();
        } catch (error) {
            toast.error("Protocol sync failure");
            setStatus(task.status); // Rollback
        } finally {
            setIsUpdating(false);
        }
    };

    const getStatusInfo = (s: string) => {
        switch (s) {
            case "COMPLETED": return { label: "Completed", color: "bg-emerald-500", glow: "shadow-[0_0_15px_rgba(16,185,129,0.4)]" };
            case "IN_PROGRESS": return { label: "In Progress", color: "bg-amber-500", glow: "shadow-[0_0_15px_rgba(245,158,11,0.4)]" };
            default: return { label: "Pending", color: "bg-white/20", glow: "" };
        }
    };

    const statusInfo = getStatusInfo(status);

    return (
        <Card className={`card-liquid group border-white/5 ${status === "COMPLETED" ? "opacity-70 grayscale-[0.3]" : ""}`}>
            <div className="card-liquid-glow" />

            <div className="absolute top-0 inset-x-0 h-1 bg-white/[0.02]">
                <div
                    className={`h-full transition-all duration-1000 ease-out ${statusInfo.color} ${statusInfo.glow}`}
                    style={{ width: status === "COMPLETED" ? "100%" : status === "IN_PROGRESS" ? "50%" : "5%" }}
                />
            </div>

            <CardHeader className="pb-4 pt-4 px-0">
                <div className="flex justify-between items-start mb-6">
                    <div className={`px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-[0.2em] border transition-all duration-500 ${status === "COMPLETED" ? "border-emerald-500/20 text-emerald-400 bg-emerald-500/5 shadow-[0_0_20px_rgba(16,185,129,0.1)]" :
                        status === "IN_PROGRESS" ? "border-amber-500/20 text-amber-500 bg-amber-500/5 shadow-[0_0_20px_rgba(245,158,11,0.1)]" :
                            "border-white/10 text-white/30"
                        }`}>
                        {statusInfo.label}
                    </div>
                    <div className="flex items-center px-4 py-1.5 bg-white/[0.02] border border-white/[0.05] rounded-full text-[10px] font-black text-white/40 uppercase tracking-widest">
                        <Calendar className="h-3 w-3 mr-2 text-white/20" />
                        {format(new Date(task.service.date), "MMM d")}
                    </div>
                </div>
                <CardTitle className="text-3xl font-black text-white tracking-tighter mb-2 leading-none group-hover:text-amber-500 transition-colors">
                    {task.title}
                </CardTitle>
                <div className="flex items-center gap-2 text-xs font-bold text-white/40 group-hover:text-white/60 transition-colors">
                    <CheckCircle2 className="h-4 w-4 text-amber-500/40" />
                    {task.service.name}
                </div>
            </CardHeader>

            <CardContent className="px-0 pb-0 space-y-8 mt-6">
                {task.description && (
                    <div className="p-5 bg-white/[0.02] rounded-3xl border border-white/[0.05] text-white/50 text-sm leading-relaxed italic font-medium">
                        <p>{task.description}</p>
                    </div>
                )}

                <div className="flex items-center justify-between pt-2">
                    {task.due_time ? (
                        <div className="flex items-center text-[10px] font-black text-white/20 uppercase tracking-[0.1em]">
                            <Clock className="h-4 w-4 mr-2 text-white/10" />
                            Due {format(new Date(task.due_time), "p")}
                        </div>
                    ) : <div />}

                    <div className="w-[160px]">
                        <Select value={status} onValueChange={handleStatusChange} disabled={isUpdating}>
                            <SelectTrigger className="h-12 text-sm font-black rounded-2xl border-white/10 bg-white/[0.03] text-white hover:bg-white/5 transition-all shadow-2xl backdrop-blur-xl">
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent className="rounded-[2rem] border-white/10 bg-black/80 backdrop-blur-3xl shadow-2xl p-2">
                                <SelectItem value="PENDING" className="font-black py-4 px-6 focus:bg-white/5 text-white/40 focus:text-white">Pending</SelectItem>
                                <SelectItem value="IN_PROGRESS" className="font-black py-4 px-6 focus:bg-amber-500/10 text-amber-500">In Progress</SelectItem>
                                <SelectItem value="COMPLETED" className="font-black py-4 px-6 focus:bg-emerald-500/10 text-emerald-400">Completed</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                </div>
            </CardContent>
        </Card>
    );
}
