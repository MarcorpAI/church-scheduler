"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { PlusCircle, Calendar, TrendingUp, Activity, Layers, ArrowRight, Radio, FolderOpen } from "lucide-react";
import { format } from "date-fns";
import { toast } from "sonner";
import { useRouter } from "next/navigation";

interface Service {
    id: string;
    name: string;
    date: string;
    is_live: boolean;
    _count: { items: number };
}

export default function AdminDashboard() {
    const [services, setServices] = useState<Service[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const router = useRouter();

    useEffect(() => {
        fetchServices();
    }, []);

    const fetchServices = async () => {
        try {
            const res = await fetch("/api/services");
            if (!res.ok) throw new Error("Failed to fetch services");
            const data = await res.json();
            setServices(data);
        } catch {
            toast.error("Failed to load services");
        } finally {
            setIsLoading(false);
        }
    };

    const handleGoLive = async (serviceId: string) => {
        try {
            const res = await fetch(`/api/services/${serviceId}/live/start`, { method: "POST" });
            if (!res.ok) {
                const data = await res.json();
                toast.error(data.message || "Cannot go live");
                return;
            }
            router.push(`/services/${serviceId}/control`);
        } catch {
            toast.error("Failed to start live session");
        }
    };

    return (
        <div className="container mx-auto py-32 px-4 md:px-8 max-w-7xl">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-12 mb-20">
                <div className="space-y-6">
                    <div className="inline-flex items-center gap-3 px-4 py-1.5 bg-white/[0.06] rounded-full text-xs font-black text-amber-500 uppercase tracking-[0.2em] border border-white/10 backdrop-blur-md">
                        <Activity className="h-4 w-4" />
                        Admin Control
                    </div>
                    <h1 className="text-7xl md:text-8xl font-black tracking-tighter leading-none serveflow-title">
                        Dash<span className="serveflow-gold">board</span>
                    </h1>
                    <p className="text-white/70 font-medium text-xl max-w-lg leading-relaxed">
                        Build run sheets, manage departments, and go live during services.
                    </p>
                </div>
                <div className="flex gap-4">
                    <Link href="/departments">
                        <button className="liquid-glass-button group h-16 px-8 text-lg">
                            <span className="relative z-10 flex items-center gap-3">
                                <FolderOpen className="h-5 w-5" />
                                Departments
                            </span>
                        </button>
                    </Link>
                    <Link href="/services/new">
                        <button className="liquid-glass-button group h-16 px-10 text-lg shadow-[0_0_30px_rgba(255,255,255,0.05)]">
                            <span className="relative z-10 flex items-center gap-3">
                                <PlusCircle className="h-5 w-5" />
                                New Service
                            </span>
                        </button>
                    </Link>
                </div>
            </div>

            <div className="grid gap-12 md:grid-cols-2 lg:grid-cols-3 mb-24">
                <StatCard
                    title="Services"
                    value={services.length}
                    icon={<Calendar className="h-6 w-6 text-amber-500/70" />}
                    description="Total services scheduled"
                />
                <StatCard
                    title="Program Items"
                    value={services.reduce((acc, s) => acc + s._count.items, 0)}
                    icon={<Layers className="h-6 w-6 text-amber-500/70" />}
                    description="Total run sheet items"
                />
                <StatCard
                    title="Live Now"
                    value={services.filter(s => s.is_live).length}
                    icon={<Radio className="h-6 w-6 text-red-400/70" />}
                    description="Currently live services"
                />
            </div>

            <Card className="liquid-glass border-white/10 overflow-hidden rounded-[3rem] shadow-2xl">
                <CardHeader className="p-12 border-b border-white/[0.06] flex flex-row items-center justify-between space-y-0">
                    <div className="space-y-2">
                        <CardTitle className="text-4xl font-black text-white tracking-tighter">Upcoming Services</CardTitle>
                        <CardDescription className="text-white/70 font-medium text-lg">Build your run sheets and go live when it&apos;s time.</CardDescription>
                    </div>
                    <div className="h-16 w-16 bg-white/[0.06] rounded-2xl flex items-center justify-center border border-white/10 shadow-inner">
                        <TrendingUp className="h-8 w-8 text-amber-500/70" />
                    </div>
                </CardHeader>
                <CardContent className="p-0">
                    {isLoading ? (
                        <div className="flex justify-center p-32 text-white/50 font-bold uppercase tracking-widest text-sm">Loading services...</div>
                    ) : services.length === 0 ? (
                        <div className="text-center p-32">
                            <div className="h-24 w-24 bg-white/[0.05] rounded-full flex items-center justify-center mx-auto mb-8 border border-white/10">
                                <Calendar className="h-12 w-12 text-white/20" />
                            </div>
                            <h3 className="text-3xl font-black text-white mb-4 tracking-tighter">No Services Yet</h3>
                            <p className="text-white/60 max-w-xs mx-auto mb-10 font-medium text-lg leading-relaxed">Create your first service to start building run sheets.</p>
                            <Link href="/services/new">
                                <button className="liquid-glass-button px-8 py-3 font-bold">Create First Service</button>
                            </Link>
                        </div>
                    ) : (
                        <div className="overflow-x-auto">
                            <Table>
                                <TableHeader className="bg-white/[0.03]">
                                    <TableRow className="hover:bg-transparent border-white/[0.06]">
                                        <TableHead className="px-12 h-16 font-bold text-white/60 uppercase text-xs tracking-widest">Service</TableHead>
                                        <TableHead className="h-16 font-bold text-white/60 uppercase text-xs tracking-widest">Date</TableHead>
                                        <TableHead className="h-16 font-bold text-white/60 uppercase text-xs tracking-widest">Items</TableHead>
                                        <TableHead className="h-16 font-bold text-white/60 uppercase text-xs tracking-widest">Status</TableHead>
                                        <TableHead className="px-12 text-right h-16 font-bold text-white/60 uppercase text-xs tracking-widest">Actions</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {services.map((service) => (
                                        <TableRow key={service.id} className="group hover:bg-white/[0.04] transition-colors border-white/[0.06]">
                                            <TableCell className="px-12 py-8 font-bold text-lg text-white">{service.name}</TableCell>
                                            <TableCell className="text-white/70 font-medium text-base">
                                                {format(new Date(service.date), "MMM d, yyyy")}
                                            </TableCell>
                                            <TableCell>
                                                <div className="flex items-center gap-3">
                                                    <div className="h-2 w-2 rounded-full bg-amber-500/60" />
                                                    <span className="text-sm font-bold text-white/80">{service._count.items} Items</span>
                                                </div>
                                            </TableCell>
                                            <TableCell>
                                                {service.is_live ? (
                                                    <Link href={`/services/${service.id}/control`}>
                                                        <span className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-red-500/10 text-red-400 text-xs font-black uppercase tracking-widest border border-red-500/20 animate-pulse cursor-pointer">
                                                            <Radio className="h-3 w-3" />
                                                            Live
                                                        </span>
                                                    </Link>
                                                ) : (
                                                    <span className="text-sm font-bold text-white/30">Offline</span>
                                                )}
                                            </TableCell>
                                            <TableCell className="px-12 text-right">
                                                <div className="flex items-center justify-end gap-3">
                                                    {!service.is_live && service._count.items > 0 && (
                                                        <button
                                                            onClick={() => handleGoLive(service.id)}
                                                            className="h-12 px-5 rounded-2xl bg-amber-500/5 border border-amber-500/20 flex items-center gap-2 text-amber-500/70 hover:text-amber-500 hover:border-amber-500/40 transition-all text-xs font-black uppercase tracking-widest"
                                                        >
                                                            <Radio className="h-3 w-3" />
                                                            Go Live
                                                        </button>
                                                    )}
                                                    <Link href={`/services/${service.id}`}>
                                                        <button className="h-12 w-12 rounded-2xl bg-white/[0.05] border border-white/10 flex items-center justify-center text-white/40 hover:text-amber-500 hover:border-amber-500/40 transition-all duration-300 group-hover:scale-110">
                                                            <ArrowRight className="h-5 w-5" />
                                                        </button>
                                                    </Link>
                                                </div>
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}

function StatCard({ title, value, icon, description }: { title: string; value: number; icon: React.ReactNode; description: string }) {
    return (
        <Card className="liquid-glass border-white/5 rounded-[2.5rem] p-1 shadow-2xl group overflow-hidden">
            <div className="card-liquid-glow" />
            <CardHeader className="pb-4 relative z-10 p-10">
                <div className="flex items-center justify-between mb-8">
                    <CardTitle className="text-xs font-bold text-white/60 uppercase tracking-widest group-hover:text-amber-500 transition-colors">{title}</CardTitle>
                    <div className="h-12 w-12 rounded-2xl bg-white/[0.06] flex items-center justify-center border border-white/10 shadow-inner group-hover:scale-110 transition-transform duration-500">
                        {icon}
                    </div>
                </div>
                <div className="text-7xl font-black text-white tracking-tighter leading-none mb-4">{value}</div>
                <p className="text-base text-white/60 font-medium tracking-tight">{description}</p>
            </CardHeader>
        </Card>
    );
}
