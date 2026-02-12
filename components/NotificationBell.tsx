"use client";

import { useEffect, useState } from "react";
import { Bell, BellDot, Check, Inbox, Sparkles } from "lucide-react";
import {
    Popover,
    PopoverContent,
    PopoverTrigger
} from "@/components/ui/popover";
import { format } from "date-fns";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";

interface Notification {
    id: string;
    type: string;
    message: string;
    read: boolean;
    created_at: string;
}

export default function NotificationBell() {
    const [notifications, setNotifications] = useState<Notification[]>([]);
    const [unreadCount, setUnreadCount] = useState(0);

    useEffect(() => {
        fetchNotifications();
        const interval = setInterval(fetchNotifications, 30000); // Poll every 30s
        return () => clearInterval(interval);
    }, []);

    const fetchNotifications = async () => {
        try {
            const res = await fetch("/api/notifications");
            if (res.ok) {
                const data = await res.json();
                setNotifications(data);
                setUnreadCount(data.filter((n: Notification) => !n.read).length);
            }
        } catch (error) {
            console.error("Notification sync error", error);
        }
    };

    const markAsRead = async (id: string) => {
        try {
            const res = await fetch(`/api/notifications/${id}/read`, { method: "PATCH" });
            if (res.ok) {
                setNotifications(notifications.map(n =>
                    n.id === id ? { ...n, read: true } : n
                ));
                setUnreadCount(prev => Math.max(0, prev - 1));
            }
        } catch (error) {
            toast.error("Failed to mark as read");
        }
    };

    return (
        <Popover>
            <PopoverTrigger asChild>
                <button className="relative h-12 w-12 rounded-xl bg-white/[0.03] border border-white/5 flex items-center justify-center text-white/40 hover:text-amber-500 hover:border-amber-500/30 hover:scale-105 transition-all duration-300">
                    {unreadCount > 0 ? (
                        <>
                            <BellDot className="h-6 w-6 text-amber-500 animate-pulse" />
                            <span className="absolute -top-1 -right-1 h-5 w-5 bg-amber-500 rounded-full flex items-center justify-center text-[10px] font-black text-black border-2 border-black shadow-[0_0_15px_rgba(245,158,11,0.5)]">
                                {unreadCount}
                            </span>
                        </>
                    ) : (
                        <Bell className="h-6 w-6" />
                    )}
                </button>
            </PopoverTrigger>
            <PopoverContent className="w-[420px] p-0 mr-8 mt-4 rounded-[2.5rem] bg-black/60 backdrop-blur-3xl border-white/[0.05] shadow-2xl overflow-hidden" align="end">
                <div className="p-8 border-b border-white/[0.03] bg-white/[0.01] flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="h-10 w-10 bg-amber-500/10 rounded-xl flex items-center justify-center border border-amber-500/10">
                            <Sparkles className="h-5 w-5 text-amber-500" />
                        </div>
                        <div>
                            <p className="text-xl font-black text-white tracking-tighter">Updates</p>
                            <p className="text-[10px] font-black uppercase text-white/60 tracking-[0.2em]">{unreadCount} New Messages</p>
                        </div>
                    </div>
                </div>

                <div className="max-h-[500px] overflow-y-auto custom-scrollbar">
                    {notifications.length === 0 ? (
                        <div className="py-24 text-center">
                            <Inbox className="h-16 w-16 text-white/5 mx-auto mb-6" />
                            <p className="text-white/60 font-black uppercase tracking-[0.2em] text-[10px]">No new updates</p>
                        </div>
                    ) : (
                        <div className="divide-y divide-white/[0.02]">
                            {notifications.map((n) => (
                                <div
                                    key={n.id}
                                    className={`p-8 hover:bg-white/[0.02] transition-colors relative group ${!n.read ? "bg-amber-500/[0.02]" : ""}`}
                                >
                                    <div className="flex justify-between items-start gap-6">
                                        <div className="space-y-3 flex-1">
                                            <div className="flex items-center gap-2">
                                                <span className={`h-1.5 w-1.5 rounded-full ${!n.read ? "bg-amber-500 shadow-[0_0_10px_rgba(245,158,11,0.5)]" : "bg-white/10"}`} />
                                                <span className="text-[9px] font-black uppercase tracking-[0.2em] text-white/20">{n.type.replace("_", " ")}</span>
                                            </div>
                                            <p className={`text-[15px] font-medium leading-relaxed ${!n.read ? "text-white" : "text-white/60"}`}>
                                                {n.message}
                                            </p>
                                            <p className="text-[10px] text-white/40">{format(new Date(n.created_at), "p · MMM d")}</p>
                                        </div>
                                        {!n.read && (
                                            <button
                                                onClick={() => markAsRead(n.id)}
                                                className="h-10 w-10 rounded-xl bg-white/[0.03] border border-white/10 flex items-center justify-center text-white/20 hover:text-emerald-400 hover:border-emerald-500/40 hover:bg-emerald-500/5 transition-all"
                                            >
                                                <Check className="h-5 w-5" />
                                            </button>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                <div className="p-6 bg-white/[0.01] border-t border-white/[0.03] text-center">
                    <button className="text-[9px] font-black uppercase tracking-[0.4em] text-white/10 hover:text-amber-500 transition-colors">
                        View all notifications
                    </button>
                </div>
            </PopoverContent>
        </Popover>
    );
}
