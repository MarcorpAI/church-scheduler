"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { useParams } from "next/navigation";
import { Sparkles } from "lucide-react";

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
    item_started_at: string | null;
    current_item: ProgramItem | null;
    next_item: ProgramItem | null;
    total_items: number;
    current_index: number;
}

function formatTime(seconds: number): string {
    const m = Math.floor(Math.abs(seconds) / 60);
    const s = Math.abs(seconds) % 60;
    const sign = seconds < 0 ? "+" : "";
    return `${sign}${m}:${s.toString().padStart(2, "0")}`;
}

export default function LiveDisplayPage() {
    const params = useParams() as { id: string };
    const [state, setState] = useState<LiveState | null>(null);
    const [countdown, setCountdown] = useState(0);
    const [transitioning, setTransitioning] = useState(false);
    const [showFlash, setShowFlash] = useState(false);
    const prevItemId = useRef<string | null>(null);
    const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
    const flashFiredRef = useRef<string | null>(null);

    // Store timing source of truth as refs so polling doesn't fight the ticker
    const itemStartRef = useRef<number>(0);
    const itemDurationRef = useRef<number>(0);

    const fetchState = useCallback(async () => {
        try {
            const res = await fetch(`/api/services/${params.id}/live/state`);
            if (!res.ok) throw new Error();
            const data: LiveState = await res.json();

            // Trigger transition animation on item change
            if (prevItemId.current && data.current_item?.id !== prevItemId.current) {
                setTransitioning(true);
                flashFiredRef.current = null; // reset flash for new item
                setShowFlash(false);
                setTimeout(() => setTransitioning(false), 600);
            }
            prevItemId.current = data.current_item?.id || null;

            setState(data);

            // Update timing refs from server
            if (data.current_item && data.item_started_at) {
                itemStartRef.current = new Date(data.item_started_at).getTime();
                itemDurationRef.current = data.current_item.duration;
            }
        } catch {
            // Silently fail
        }
    }, [params.id]);

    // Poll every 2 seconds
    useEffect(() => {
        fetchState();
        const poll = setInterval(fetchState, 2000);
        return () => clearInterval(poll);
    }, [fetchState]);

    // Countdown ticker — always compute from timestamps, never incremental
    useEffect(() => {
        if (intervalRef.current) clearInterval(intervalRef.current);

        if (state?.is_live && state.current_item && !state.is_paused) {
            const tick = () => {
                if (itemStartRef.current && itemDurationRef.current) {
                    const elapsed = (Date.now() - itemStartRef.current) / 1000;
                    const raw = itemDurationRef.current - elapsed;
                    const remaining = raw >= 0 ? Math.ceil(raw) : Math.floor(raw);
                    // Cap overtime display at -10 seconds (auto-advance triggers at -10)
                    setCountdown(Math.max(remaining, -10));

                    // Fire standby flash at 30s
                    if (remaining <= 30 && remaining > 0 && flashFiredRef.current !== state?.current_item?.id) {
                        flashFiredRef.current = state?.current_item?.id || null;
                        setShowFlash(true);
                        setTimeout(() => setShowFlash(false), 4000);
                    }
                }
            };
            tick(); // immediate first tick
            intervalRef.current = setInterval(tick, 1000);
        }

        return () => {
            if (intervalRef.current) clearInterval(intervalRef.current);
        };
    }, [state?.is_live, state?.is_paused, state?.current_item?.id]);

    // Loading
    if (!state) {
        return (
            <div className="fixed inset-0 bg-black flex items-center justify-center">
                <div className="text-white/5 font-black uppercase tracking-[0.5em] animate-pulse text-2xl">
                    Connecting...
                </div>
            </div>
        );
    }

    // Service complete
    if (!state.is_live) {
        return (
            <div className="fixed inset-0 bg-black flex items-center justify-center">
                <div className="text-center animate-in fade-in duration-1000">
                    <div className="h-24 w-24 bg-white/[0.03] rounded-full flex items-center justify-center mx-auto mb-12 border border-white/5">
                        <Sparkles className="h-12 w-12 text-amber-500/30" />
                    </div>
                    <h1 className="text-8xl md:text-9xl font-black tracking-tighter serveflow-title mb-6">
                        Service <span className="serveflow-gold">Complete</span>
                    </h1>
                    <p className="text-white/20 font-bold text-2xl uppercase tracking-widest">
                        {state.name}
                    </p>
                </div>
            </div>
        );
    }

    const isOvertime = countdown < 0;
    const progress = state.total_items > 0
        ? ((state.current_index + 1) / state.total_items) * 100
        : 0;
    return (
        <div className="fixed inset-0 bg-black flex flex-col overflow-hidden">
            {/* Fullscreen standby flash */}
            {showFlash && state.next_item && (
                <div className="fixed inset-0 z-50 bg-black flex items-center justify-center animate-in fade-in zoom-in-95 duration-700">
                    <div className="text-center px-8">
                        <p className="text-3xl md:text-5xl font-black uppercase tracking-[0.3em] text-amber-500 mb-12 animate-pulse">
                            Standby
                        </p>
                        <p className="text-4xl md:text-6xl font-black tracking-tighter text-white/20 mb-4">Up Next</p>
                        <h2 className="text-[8rem] md:text-[12rem] lg:text-[14rem] font-black tracking-tighter leading-none serveflow-title mb-10">
                            {state.next_item.title}
                        </h2>
                        {state.next_item.department && (
                            <span className="inline-flex px-8 py-3 rounded-full bg-amber-500/10 text-amber-500 text-2xl font-black uppercase tracking-[0.2em] border border-amber-500/20">
                                {state.next_item.department.name}
                            </span>
                        )}
                    </div>
                </div>
            )}

            {/* Progress bar at top */}
            <div className="h-1.5 w-full bg-white/5 shrink-0">
                <div
                    className="h-full bg-amber-500 transition-all duration-700"
                    style={{ width: `${progress}%` }}
                />
            </div>

            {/* Main content */}
            <div className={`flex-1 flex flex-col items-center justify-center px-8 transition-all duration-500 ${transitioning ? "opacity-0 scale-95" : "opacity-100 scale-100"}`}>
                {/* Current item */}
                <div className="text-center mb-auto mt-auto">
                    {state.current_item?.department && (
                        <span className="inline-flex px-6 py-2 rounded-full bg-amber-500/10 text-amber-500 text-sm font-black uppercase tracking-[0.2em] border border-amber-500/20 mb-8">
                            {state.current_item.department.name}
                        </span>
                    )}

                    <h1 className="text-8xl md:text-9xl lg:text-[10rem] font-black tracking-tighter leading-none serveflow-title mb-8">
                        {state.current_item?.title}
                    </h1>

                    {/* Countdown */}
                    <div className={`text-[10rem] md:text-[14rem] lg:text-[18rem] font-black tracking-tighter leading-none transition-colors duration-500 ${
                        state.is_paused
                            ? "text-white/10"
                            : isOvertime
                                ? "text-red-400"
                                : countdown <= 30
                                    ? "text-amber-500"
                                    : "text-white/80"
                    }`}>
                        {state.is_paused ? (
                            <span className="animate-pulse text-white/10">||</span>
                        ) : (
                            formatTime(countdown)
                        )}
                    </div>
                </div>
            </div>

            {/* Bottom bar: next item */}
            <div className="shrink-0 border-t border-white/[0.03] px-12 py-8 flex items-center justify-between bg-white/[0.01]">
                <div>
                    <p className="text-xs font-black uppercase tracking-[0.3em] text-white/10 mb-1">Up Next</p>
                    <p className="text-3xl font-bold text-white/20 tracking-tight">
                        {state.next_item ? state.next_item.title : "End of Service"}
                    </p>
                </div>
                <div className="text-right">
                    <p className="text-xs font-black uppercase tracking-[0.3em] text-white/10 mb-1">Progress</p>
                    <p className="text-2xl font-black text-white/20">
                        {state.current_index + 1} / {state.total_items}
                    </p>
                </div>
            </div>
        </div>
    );
}
