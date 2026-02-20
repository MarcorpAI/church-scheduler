"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import {
    SkipForward,
    Pause,
    Play,
    Square,
    ChevronLeft,
    Radio,
    Clock,
    ExternalLink,
    Copy,
    Check,
    Trash2,
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
    department: Department | null;
}

interface LiveState {
    id: string;
    name: string;
    is_live: boolean;
    is_paused: boolean;
    advance_mode: "AUTO" | "MANUAL";
    buffer_time: number;
    item_started_at: string | null;
    current_item: ProgramItem | null;
    next_item: ProgramItem | null;
    items: ProgramItem[];
    total_items: number;
    current_index: number;
}

function formatTime(seconds: number): string {
    const m = Math.floor(Math.abs(seconds) / 60);
    const s = Math.abs(seconds) % 60;
    const sign = seconds < 0 ? "+" : "";
    return `${sign}${m}:${s.toString().padStart(2, "0")}`;
}

function formatDuration(seconds: number): string {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = seconds % 60;
    if (h > 0) return `${h}h ${m}m`;
    if (m > 0) return `${m}m ${s > 0 ? s + "s" : ""}`;
    return `${s}s`;
}

export default function LiveControlPage() {
    const params = useParams() as { id: string };
    const router = useRouter();
    const [state, setState] = useState<LiveState | null>(null);
    const [countdown, setCountdown] = useState(0);
    const [copied, setCopied] = useState(false);
    const [showFlash, setShowFlash] = useState(false);
    const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
    const autoAdvanceRef = useRef(false);
    const flashFiredRef = useRef<string | null>(null); // track which item the flash fired for

    // Store timing source of truth as refs so the ticker doesn't fight with polls
    const itemStartRef = useRef<number>(0);
    const itemDurationRef = useRef<number>(0);
    const nextItemRef = useRef<ProgramItem | null>(null);

    const fetchState = useCallback(async () => {
        try {
            const res = await fetch(`/api/services/${params.id}/live/state`);
            if (!res.ok) throw new Error();
            const data: LiveState = await res.json();
            setState(data);

            // Update timing refs from server
            if (data.current_item && data.item_started_at) {
                itemStartRef.current = new Date(data.item_started_at).getTime();
                itemDurationRef.current = data.current_item.duration;
            }
        } catch {
            // Silently fail on polling
        }
    }, [params.id]);

    // Reset auto-advance lock and flash when current item actually changes
    useEffect(() => {
        autoAdvanceRef.current = false;
        flashFiredRef.current = null;
        setShowFlash(false);
    }, [state?.current_item?.id]);

    // Initial fetch
    useEffect(() => {
        fetchState();
    }, [fetchState]);

    // Keep nextItemRef always in sync so the ticker never has a stale closure
    useEffect(() => {
        nextItemRef.current = state?.next_item ?? null;
    }, [state?.next_item?.id]);

    // Countdown ticker — always compute from timestamps, never incremental
    useEffect(() => {
        if (intervalRef.current) clearInterval(intervalRef.current);

        if (state?.is_live && state.current_item && !state.is_paused) {
            const tick = () => {
                if (itemStartRef.current && itemDurationRef.current) {
                    const elapsed = (Date.now() - itemStartRef.current) / 1000;
                    const raw = itemDurationRef.current - elapsed;
                    // Use floor for overtime (negative) so +0:10 means exactly 10 real seconds
                    const remaining = raw >= 0 ? Math.ceil(raw) : Math.floor(raw);

                    setCountdown(remaining);

                    // Fire standby flash at 30s
                    if (remaining <= 30 && remaining > 0 && flashFiredRef.current !== state?.current_item?.id) {
                        flashFiredRef.current = state?.current_item?.id || null;
                        setShowFlash(true);
                        setTimeout(() => setShowFlash(false), 4000);
                    }

                    // Auto-advance logic
                    if (state.advance_mode === "AUTO" && !autoAdvanceRef.current) {
                        const bufferLimit = -(state.buffer_time || 0);
                        if (remaining <= bufferLimit) {
                            autoAdvanceRef.current = true;

                            const nextItem = nextItemRef.current;
                            if (nextItem) {
                                const now = Date.now();
                                itemStartRef.current = now;
                                itemDurationRef.current = nextItem.duration;
                                nextItemRef.current = null;
                                setCountdown(nextItem.duration);

                                setState((prev) => {
                                    if (!prev) return prev;
                                    return {
                                        ...prev,
                                        current_item: nextItem,
                                        next_item: null,
                                        item_started_at: new Date(now).toISOString(),
                                        current_index: prev.current_index + 1,
                                    };
                                });
                                handleNext();
                            }
                        }
                    }
                }
            };
            tick(); // immediate first tick
            intervalRef.current = setInterval(tick, 1000);
        }

        return () => {
            if (intervalRef.current) clearInterval(intervalRef.current);
        };
    }, [state?.is_live, state?.is_paused, state?.current_item?.id, state?.advance_mode, state?.buffer_time]);

    const handleNext = async () => {
        try {
            const res = await fetch(`/api/services/${params.id}/live/next`, {
                method: "POST",
            });
            if (!res.ok) throw new Error();
            // Don't reset autoAdvanceRef here — the useEffect watching current_item?.id handles it
            await fetchState();
        } catch {
            toast.error("Failed to advance");
            autoAdvanceRef.current = false;
        }
    };

    const handleSkipToItem = async (itemId: string) => {
        if (!confirm("Skip to this item?")) return;
        try {
            const res = await fetch(`/api/services/${params.id}/live/skip`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ itemId }),
            });
            if (!res.ok) throw new Error();
            fetchState();
            toast.success("Skipped to item");
        } catch {
            toast.error("Failed to skip item");
        }
    };

    const handleAdjustDuration = async (seconds: number) => {
        try {
            const res = await fetch(`/api/services/${params.id}/live/adjust`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ seconds }),
            });
            if (!res.ok) throw new Error();
            fetchState();
            toast.success(`Duration adjusted by ${seconds > 0 ? "+" : ""}${seconds}s`);
        } catch {
            toast.error("Failed to adjust duration");
        }
    };

    const handleDeleteItem = async (itemId: string) => {
        if (!confirm("Remove this item from the live run sheet?")) return;
        try {
            const res = await fetch(`/api/items/${itemId}`, { method: "DELETE" });
            if (!res.ok) throw new Error();
            fetchState();
            toast.success("Item removed");
        } catch {
            toast.error("Failed to remove item");
        }
    };

    const handlePause = async () => {
        try {
            await fetch(`/api/services/${params.id}/live/pause`, { method: "POST" });
            fetchState();
        } catch {
            toast.error("Failed to toggle pause");
        }
    };

    const handleStop = async () => {
        if (!confirm("End the live session?")) return;
        try {
            await fetch(`/api/services/${params.id}/live/stop`, { method: "POST" });
            fetchState();
            toast.success("Service ended");
        } catch {
            toast.error("Failed to stop");
        }
    };

    const handleCopyLink = () => {
        const url = `${window.location.origin}/live/${params.id}`;
        navigator.clipboard.writeText(url);
        setCopied(true);
        toast.success("Display link copied!");
        setTimeout(() => setCopied(false), 2000);
    };

    if (!state) {
        return (
            <div className="p-48 text-center text-white/10 font-black uppercase tracking-[0.5em] animate-pulse">
                Loading...
            </div>
        );
    }

    if (!state.is_live) {
        return (
            <div className="container mx-auto py-32 px-4 md:px-8 max-w-4xl text-center">
                <div className="space-y-8">
                    <div className="h-32 w-32 bg-white/[0.03] rounded-full flex items-center justify-center mx-auto border border-white/5">
                        <Check className="h-16 w-16 text-emerald-500/50" />
                    </div>
                    <h1 className="text-6xl font-black tracking-tighter serveflow-title">
                        Service <span className="serveflow-gold">Complete</span>
                    </h1>
                    <p className="text-white/40 text-xl font-medium">The live session has ended.</p>
                    <Link href={`/services/${params.id}`}>
                        <button className="liquid-glass-button h-16 px-10 text-lg mt-8">
                            <span className="relative z-10">Back to Run Sheet</span>
                        </button>
                    </Link>
                </div>
            </div>
        );
    }

    const progress = state.total_items > 0
        ? ((state.current_index + 1) / state.total_items) * 100
        : 0;

    const isOvertime = countdown < 0;

    return (
        <div className="container mx-auto py-32 px-4 md:px-8 max-w-5xl relative">
            {/* Fullscreen standby flash */}
            {showFlash && state.next_item && (
                <div className="fixed inset-0 z-50 bg-black/90 backdrop-blur-xl flex items-center justify-center animate-in fade-in zoom-in-95 duration-500">
                    <div className="text-center">
                        <p className="text-2xl font-black uppercase tracking-[0.3em] text-amber-500 mb-8 animate-pulse">
                            Standby
                        </p>
                        <p className="text-5xl md:text-7xl font-black tracking-tighter text-white/30 mb-6">Up Next</p>
                        <h2 className="text-8xl md:text-9xl font-black tracking-tighter leading-none serveflow-title mb-8">
                            {state.next_item.title}
                        </h2>
                        {state.next_item.department && (
                            <span className="inline-flex px-6 py-2.5 rounded-full bg-amber-500/10 text-amber-500 text-lg font-black uppercase tracking-[0.2em] border border-amber-500/20">
                                {state.next_item.department.name}
                            </span>
                        )}
                    </div>
                </div>
            )}

            <div className="flex items-center justify-between mb-12">
                <Link
                    href={`/services/${params.id}`}
                    className="inline-flex items-center text-xs font-bold uppercase tracking-widest text-white/50 hover:text-amber-500 transition-colors group"
                >
                    <ChevronLeft className="h-4 w-4 mr-2 group-hover:-translate-x-1 transition-transform" />
                    Run Sheet
                </Link>
                <div className="flex items-center gap-4">
                    <button
                        onClick={handleCopyLink}
                        className="liquid-glass-button h-12 px-6 text-sm"
                    >
                        <span className="relative z-10 flex items-center gap-2">
                            {copied ? <Check className="h-4 w-4 text-emerald-400" /> : <Copy className="h-4 w-4" />}
                            {copied ? "Copied!" : "Share Display Link"}
                        </span>
                    </button>
                    <a
                        href={`/live/${params.id}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="liquid-glass-button h-12 px-6 text-sm"
                    >
                        <span className="relative z-10 flex items-center gap-2">
                            <ExternalLink className="h-4 w-4" />
                            Open Display
                        </span>
                    </a>
                </div>
            </div>

            {/* Live indicator */}
            <div className="flex items-center gap-4 mb-8">
                <span className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-red-500/10 text-red-400 text-xs font-black uppercase tracking-widest border border-red-500/20 animate-pulse">
                    <Radio className="h-3 w-3" />
                    Live
                </span>
                <span className="text-white/30 font-bold text-sm">
                    {state.name} — Item {state.current_index + 1} of {state.total_items}
                </span>
            </div>

            {/* Progress bar */}
            <div className="h-2 w-full rounded-full bg-white/5 mb-16 overflow-hidden">
                <div
                    className="h-full bg-amber-500 transition-all duration-500 rounded-full"
                    style={{ width: `${progress}%` }}
                />
            </div>

            {/* Current item */}
            <div className="text-center mb-16">
                <p className="text-xs font-black uppercase tracking-[0.3em] text-white/20 mb-6">Now</p>
                <h2 className="text-7xl md:text-8xl font-black tracking-tighter leading-none serveflow-title mb-6">
                    {state.current_item?.title}
                </h2>
                {state.current_item?.department && (
                    <span className="inline-flex px-4 py-1.5 rounded-full bg-amber-500/10 text-amber-500 text-xs font-black uppercase tracking-widest border border-amber-500/20 mb-8">
                        {state.current_item.department.name}
                    </span>
                )}

                {/* Countdown */}
                <div className={`text-9xl md:text-[12rem] font-black tracking-tighter leading-none mt-8 transition-colors duration-300 ${isOvertime ? (state.advance_mode === "AUTO" ? "text-amber-500/60" : "text-red-400") : state.is_paused ? "text-white/20" : "text-white"}`}>
                    {state.is_paused ? (
                        <span className="animate-pulse">PAUSED</span>
                    ) : (
                        formatTime(countdown)
                    )}
                </div>
                {isOvertime && !state.is_paused && (
                    <p className={`${state.advance_mode === "AUTO" ? "text-amber-500/40" : "text-red-400/60"} font-bold text-sm uppercase tracking-widest mt-4`}>
                        {state.advance_mode === "AUTO" && Math.abs(countdown) <= state.buffer_time ? `Buffer (${state.buffer_time - Math.abs(countdown)}s left)` : "Overtime"}
                    </p>
                )}

                {/* Adjust Duration Buttons */}
                {!state.is_paused && (
                    <div className="mt-12 flex justify-center gap-4">
                        <button
                            onClick={() => handleAdjustDuration(-30)}
                            className="h-12 px-6 rounded-2xl bg-white/[0.03] border border-white/10 text-[10px] font-black uppercase tracking-widest text-white/40 hover:text-white hover:bg-white/[0.06] transition-all"
                        >
                            -30s
                        </button>
                        <button
                            onClick={() => handleAdjustDuration(30)}
                            className="h-12 px-6 rounded-2xl bg-white/[0.03] border border-white/10 text-[10px] font-black uppercase tracking-widest text-white/40 hover:text-white hover:bg-white/[0.06] transition-all"
                        >
                            +30s
                        </button>
                        <button
                            onClick={() => handleAdjustDuration(60)}
                            className="h-12 px-6 rounded-2xl bg-white/[0.03] border border-white/10 text-[10px] font-black uppercase tracking-widest text-white/40 hover:text-white hover:bg-white/[0.06] transition-all"
                        >
                            +1m
                        </button>
                    </div>
                )}

                <div className="mt-8 flex justify-center gap-4">
                    <span className="px-3 py-1 rounded-full bg-white/[0.03] border border-white/10 text-[10px] font-black uppercase tracking-widest text-white/40">
                        {state.advance_mode} Mode
                    </span>
                    {state.buffer_time > 0 && (
                        <span className="px-3 py-1 rounded-full bg-white/[0.03] border border-white/10 text-[10px] font-black uppercase tracking-widest text-white/40">
                            {state.buffer_time}s Buffer
                        </span>
                    )}
                </div>
            </div>

            {/* Next item preview */}
            {state.next_item && (
                <div className="text-center mb-16 py-8 border-t border-white/[0.03]">
                    <p className="text-xs font-black uppercase tracking-[0.3em] text-white/10 mb-3">Up Next</p>
                    <p className="text-3xl font-bold text-white/20 tracking-tight">{state.next_item.title}</p>
                    <div className="flex items-center justify-center gap-2 text-white/10 text-sm font-medium mt-2">
                        <Clock className="h-3 w-3" />
                        {Math.floor(state.next_item.duration / 60)}m
                    </div>
                </div>
            )}

            {/* Controls */}
            <div className="flex items-center justify-center gap-6 mb-24">
                <button
                    onClick={handlePause}
                    className="h-20 w-20 rounded-[2rem] bg-white/[0.05] border border-white/10 flex items-center justify-center text-white/60 hover:text-white hover:bg-white/[0.1] hover:border-white/20 transition-all duration-300 hover:scale-110"
                >
                    {state.is_paused ? <Play className="h-8 w-8" /> : <Pause className="h-8 w-8" />}
                </button>
                <button
                    onClick={handleNext}
                    className="h-24 w-24 rounded-[2rem] bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-500 hover:bg-amber-500/20 hover:border-amber-500/40 transition-all duration-300 hover:scale-110 shadow-[0_0_30px_rgba(245,158,11,0.1)]"
                >
                    <SkipForward className="h-10 w-10" />
                </button>
                <button
                    onClick={handleStop}
                    className="h-20 w-20 rounded-[2rem] bg-red-500/5 border border-red-500/10 flex items-center justify-center text-red-400/40 hover:text-red-400 hover:bg-red-500/10 hover:border-red-500/30 transition-all duration-300 hover:scale-110"
                >
                    <Square className="h-8 w-8" />
                </button>
            </div>

            {/* Live Run Sheet */}
            <div className="space-y-8">
                <div className="flex items-center justify-between px-4">
                    <h3 className="text-sm font-black uppercase tracking-[0.3em] text-white/20">Live Run Sheet</h3>
                    <span className="text-[10px] font-black text-amber-500/40 uppercase tracking-widest">{state.total_items} Total Items</span>
                </div>

                <div className="liquid-glass border-white/[0.05] rounded-[2.5rem] overflow-hidden">
                    <div className="divide-y divide-white/[0.05]">
                        {state.items.map((item, index) => {
                            const isCurrent = item.id === state.current_item?.id;
                            const isPast = index < state.current_index;
                            const isFuture = index > state.current_index;

                            return (
                                <div
                                    key={item.id}
                                    className={`p-8 flex items-center justify-between transition-colors ${isCurrent ? "bg-amber-500/[0.03]" : ""}`}
                                >
                                    <div className="flex items-center gap-8">
                                        <span className={`text-xs font-black w-6 ${isCurrent ? "text-amber-500" : isPast ? "text-white/10" : "text-white/30"}`}>
                                            {index + 1}
                                        </span>
                                        <div className="space-y-1">
                                            <div className={`font-bold text-lg ${isCurrent ? "text-white" : isPast ? "text-white/20" : "text-white/60"}`}>
                                                {item.title}
                                            </div>
                                            {item.department && (
                                                <div className={`text-[10px] font-black uppercase tracking-widest ${isCurrent ? "text-amber-500/60" : "text-white/10"}`}>
                                                    {item.department.name}
                                                </div>
                                            )}
                                        </div>
                                    </div>

                                    <div className="flex items-center gap-6">
                                        <span className={`text-xs font-black uppercase tracking-widest ${isCurrent ? "text-amber-500" : isPast ? "text-white/10" : "text-white/30"}`}>
                                            {formatDuration(item.duration)}
                                        </span>

                                        {isFuture && (
                                            <div className="flex items-center gap-3 opacity-0 group-hover:opacity-100 transition-opacity">
                                                <button
                                                    onClick={() => handleSkipToItem(item.id)}
                                                    className="h-10 px-4 rounded-xl bg-white/[0.03] border border-white/10 text-[10px] font-black uppercase tracking-widest text-white/40 hover:text-amber-500 hover:border-amber-500/40 transition-all"
                                                >
                                                    Skip To
                                                </button>
                                                <button
                                                    onClick={() => handleDeleteItem(item.id)}
                                                    className="h-10 w-10 flex items-center justify-center rounded-xl bg-red-500/5 border border-red-500/10 text-red-500/40 hover:text-red-500 hover:bg-red-500/10 transition-all"
                                                >
                                                    <Trash2 className="h-4 w-4" />
                                                </button>
                                            </div>
                                        )}

                                        {isCurrent && (
                                            <div className="flex items-center gap-2">
                                                <div className="h-2 w-2 rounded-full bg-amber-500 animate-pulse" />
                                                <span className="text-[10px] font-black uppercase tracking-widest text-amber-500">Active</span>
                                            </div>
                                        )}

                                        {isPast && (
                                            <Check className="h-4 w-4 text-emerald-500/30" />
                                        )}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>
            </div>
        </div>
    );
}
