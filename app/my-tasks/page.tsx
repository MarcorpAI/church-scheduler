"use client";

import { useEffect, useState } from "react";
import { format } from "date-fns";
import TaskCard from "@/components/TaskCard";
import { CheckSquare, Sparkles, CalendarCheck, Activity, Target } from "lucide-react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";

interface Task {
    id: string;
    title: string;
    description: string | null;
    status: string;
    due_time: string | null;
    service: {
        name: string;
        date: string;
    }
}

export default function VolunteerDashboard() {
    const [tasks, setTasks] = useState<Task[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        fetchTasks();
    }, []);

    const fetchTasks = async () => {
        try {
            const res = await fetch("/api/my-tasks");
            if (!res.ok) throw new Error("Failed to fetch assignments");
            const data = await res.json();
            setTasks(data);
        } catch (error) {
            toast.error("Failed to load your tasks");
        } finally {
            setIsLoading(false);
        }
    };

    const tasksByDate = tasks.reduce((acc, task) => {
        const date = format(new Date(task.service.date), "yyyy-MM-dd");
        if (!acc[date]) acc[date] = [];
        acc[date].push(task);
        return acc;
    }, {} as Record<string, Task[]>);

    const sortedDates = Object.keys(tasksByDate).sort();

    const completedCount = tasks.filter(t => t.status === "COMPLETED").length;
    const progressPercent = tasks.length > 0 ? Math.round((completedCount / tasks.length) * 100) : 0;

    return (
        <div className="container mx-auto py-32 px-4 md:px-8 max-w-7xl">
            {/* Massive Liquid Header */}
            <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-12 mb-24 p-12 liquid-glass rounded-[3rem] relative overflow-hidden group">
                <div className="absolute -top-24 -right-24 h-64 w-64 bg-amber-500/10 rounded-full blur-[100px] group-hover:bg-amber-500/20 transition-all duration-700" />

                <div className="space-y-6 relative z-10">
                    <div className="inline-flex items-center gap-3 px-4 py-1.5 bg-white/[0.03] rounded-full text-[10px] font-black text-amber-500 uppercase tracking-[0.3em] border border-white/5 backdrop-blur-md">
                        <Activity className="h-4 w-4" />
                        My Volunteer Schedule
                    </div>
                    <h1 className="text-7xl md:text-8xl font-black tracking-tighter leading-none serveflow-title transition-all duration-500">
                        My <span className="serveflow-gold">Tasks</span>
                    </h1>
                    <p className="text-white/40 font-medium text-xl max-w-lg leading-relaxed">
                        Your upcoming tasks and schedule for this month&apos;s services.
                    </p>
                </div>

                <div className="bg-white/[0.02] border border-white/5 p-8 rounded-[2.5rem] min-w-[320px] backdrop-blur-3xl relative z-10 group/stat">
                    <div className="flex items-center justify-between mb-6">
                        <div className="flex items-center gap-2">
                            <Target className="h-4 w-4 text-amber-500/60" />
                            <span className="text-[10px] font-black uppercase tracking-[0.2em] text-white/60 group-hover/stat:text-amber-500 transition-colors">My Progress</span>
                        </div>
                        <div className="h-8 w-8 rounded-xl bg-amber-500/10 flex items-center justify-center border border-amber-500/10 shadow-[0_0_20px_rgba(245,158,11,0.1)]">
                            <Sparkles className="h-4 w-4 text-amber-500" />
                        </div>
                    </div>
                    <div className="flex items-end gap-3 mb-4">
                        <span className="text-6xl font-black text-white tracking-tighter leading-none">{progressPercent}%</span>
                        <span className="text-sm font-bold text-white/60 mb-1 leading-none">Complete</span>
                    </div>
                    <div className="h-3 w-full bg-white/5 rounded-full overflow-hidden shadow-inner border border-white/5">
                        <div
                            className="h-full bg-amber-500 transition-all duration-1500 ease-out shadow-[0_0_20px_rgba(245,158,11,0.5)]"
                            style={{ width: `${progressPercent}%` }}
                        />
                    </div>
                    <p className="text-[10px] text-white/60 font-black uppercase tracking-widest mt-4 flex justify-between">
                        <span>Tasks Done</span>
                        <span className="text-amber-500/80">{completedCount} / {tasks.length}</span>
                    </p>
                </div>
            </div>

            {isLoading ? (
                <div className="py-24 text-center">
                    <div className="h-12 w-12 border-4 border-amber-500 border-t-transparent rounded-full animate-spin mx-auto mb-6 shadow-[0_0_30px_rgba(245,158,11,0.2)]" />
                    <p className="text-white/60 font-black uppercase tracking-[0.3em] text-[10px]">Loading your schedule...</p>
                </div>
            ) : tasks.length === 0 ? (
                <div className="py-40 liquid-glass rounded-[4rem] text-center max-w-3xl mx-auto border-white/5">
                    <div className="h-32 w-32 bg-white/[0.02] rounded-full flex items-center justify-center mx-auto mb-10 border border-white/5 shadow-inner group transition-all duration-700 hover:scale-110">
                        <CheckSquare className="h-16 w-16 text-white/5 group-hover:text-amber-500/20 transition-colors" />
                    </div>
                    <h2 className="text-4xl font-black text-white mb-4 tracking-tighter">All Clear</h2>
                    <p className="text-white/60 font-medium italic max-w-sm mx-auto text-lg leading-relaxed">You don&apos;t have any tasks assigned right now.</p>
                </div>
            ) : (
                <div className="space-y-32">
                    {sortedDates.map((date) => (
                        <section key={date} className="relative">
                            <div className="flex items-center gap-8 mb-12 sticky top-40 z-10 py-4">
                                <div className="h-14 w-14 bg-white/[0.05] rounded-2xl flex items-center justify-center text-white shadow-2xl border border-white/10 hover:border-amber-500/40 transition-colors cursor-default">
                                    <CalendarCheck className="h-7 w-7 text-amber-500" />
                                </div>
                                <div className="flex flex-col">
                                    <h2 className="text-4xl font-black text-white tracking-widest uppercase">
                                        {format(new Date(date), "EEEE, MMM d")}
                                    </h2>
                                    <div className="flex items-center gap-3 mt-2">
                                        <div className="h-1.5 w-1.5 rounded-full bg-amber-500" />
                                        <span className="text-[10px] font-black uppercase tracking-[0.2em] text-white/60">
                                            {tasksByDate[date].length} tasks for this day
                                        </span>
                                    </div>
                                </div>
                                <div className="flex-1 h-[1px] bg-white/[0.03] ml-8 hidden md:block" />
                            </div>

                            <div className="grid gap-12 md:grid-cols-2 lg:grid-cols-3">
                                {tasksByDate[date].map((task) => (
                                    <TaskCard key={task.id} task={task} onUpdate={fetchTasks} />
                                ))}
                            </div>
                        </section>
                    ))}
                </div>
            )}
        </div>
    );
}
