"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { ChevronLeft, Sparkles, Calendar, FileText, Repeat, Activity, Target } from "lucide-react";
import Link from "next/link";
import { toast } from "sonner";

export default function NewServicePage() {
    const router = useRouter();
    const [isLoading, setIsLoading] = useState(false);
    const [templates, setTemplates] = useState<any[]>([]);
    const [selectedTemplate, setSelectedTemplate] = useState<string>("none");

    const fetchTemplates = async () => {
        try {
            const res = await fetch("/api/services?template=true");
            if (res.ok) setTemplates(await res.json());
        } catch { /* ignore */ }
    };

    useState(() => {
        fetchTemplates();
    });

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        setIsLoading(true);

        const formData = new FormData(e.currentTarget);
        const data = {
            name: formData.get("name"),
            description: formData.get("description"),
            date: formData.get("date"),
            recurrence: formData.get("recurrence"),
            template_id: selectedTemplate === "none" ? null : selectedTemplate,
        };

        try {
            const res = await fetch("/api/services", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(data),
            });

            if (!res.ok) throw new Error();
            const service = await res.json();

            toast.success("Service created", {
                description: selectedTemplate !== "none" ? "Templates items cloned successfully." : "Now add items to your run sheet.",
            });
            router.push(`/services/${service.id}`);
        } catch {
            toast.error("Failed to create service");
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="container mx-auto py-32 px-4 md:px-8 max-w-4xl">
            <Link href="/dashboard" className="inline-flex items-center text-xs font-bold uppercase tracking-widest text-white/50 hover:text-amber-500 transition-colors mb-12 group">
                <ChevronLeft className="h-4 w-4 mr-2 group-hover:-translate-x-1 transition-transform" />
                Dashboard
            </Link>

            <Card className="liquid-glass group border-white/[0.05] shadow-[0_0_100px_rgba(0,0,0,0.5)] overflow-hidden relative rounded-[3rem]">
                <div className="card-liquid-glow" />

                <CardHeader className="p-16 space-y-8 relative z-10">
                    <div className="h-20 w-20 rounded-[2rem] bg-white/[0.03] flex items-center justify-center border border-white/10 shadow-inner group transition-all duration-700 hover:scale-110">
                        <Sparkles className="h-10 w-10 text-amber-500" />
                    </div>
                    <div className="space-y-4">
                        <div className="inline-flex items-center gap-3 px-4 py-1.5 bg-white/[0.06] rounded-full text-xs font-bold text-amber-500 uppercase tracking-widest border border-white/10 backdrop-blur-md">
                            <Activity className="h-4 w-4" />
                            New Service
                        </div>
                        <CardTitle className="text-6xl font-black tracking-tighter leading-none serveflow-title">
                            Create <span className="serveflow-gold">Service</span>
                        </CardTitle>
                        <CardDescription className="text-white/60 font-medium text-lg leading-relaxed mt-2">
                            Set up a new service, then build your run sheet with program items.
                        </CardDescription>
                    </div>
                </CardHeader>

                <form onSubmit={handleSubmit} className="relative z-10">
                    <CardContent className="px-16 space-y-12 pb-16">
                        <div className="space-y-4 group">
                            <Label htmlFor="name" className="text-sm font-bold uppercase text-white/60 tracking-widest block group-focus-within:text-amber-500 transition-colors">Service Name</Label>
                            <Input
                                id="name"
                                name="name"
                                placeholder="e.g. Sunday Morning Service"
                                required
                                className="h-20 rounded-2xl border-white/[0.05] bg-white/[0.02] focus:bg-white/[0.05] focus-visible:ring-amber-500 transition-all font-bold text-2xl px-8"
                            />
                        </div>

                        <div className="grid md:grid-cols-2 gap-12">
                            <div className="space-y-4 group">
                                <Label htmlFor="date" className="text-sm font-bold uppercase text-white/60 tracking-widest block group-focus-within:text-amber-500 transition-colors">Date & Time</Label>
                                <div className="relative">
                                    <Calendar className="absolute left-6 top-1/2 -translate-y-1/2 h-6 w-6 text-white/30 group-focus-within:text-amber-500/60 transition-colors" />
                                    <Input
                                        id="date"
                                        name="date"
                                        type="datetime-local"
                                        required
                                        className="h-16 pl-16 rounded-2xl border-white/[0.05] bg-white/[0.02] focus:bg-white/[0.05] focus-visible:ring-amber-500 transition-all font-bold text-white/80"
                                    />
                                </div>
                            </div>
                            <div className="space-y-4 group">
                                <Label htmlFor="recurrence" className="text-sm font-bold uppercase text-white/60 tracking-widest block group-focus-within:text-amber-500 transition-colors">Recurrence</Label>
                                <div className="relative">
                                    <Repeat className="absolute left-6 top-1/2 -translate-y-1/2 h-6 w-6 text-white/10 pointer-events-none z-10 group-focus-within:text-amber-500/40 transition-colors" />
                                    <Select name="recurrence" defaultValue="NONE">
                                        <SelectTrigger className="h-16 pl-16 rounded-2xl border-white/[0.05] bg-white/[0.02] text-white/70 font-bold text-sm">
                                            <SelectValue placeholder="Frequency" />
                                        </SelectTrigger>
                                        <SelectContent className="rounded-[2.5rem] border-white/10 bg-black/80 backdrop-blur-3xl p-4 shadow-2xl">
                                            <SelectItem value="NONE" className="font-bold py-4 px-6 text-white/70 focus:bg-white/5 focus:text-white">One-time</SelectItem>
                                            <SelectItem value="WEEKLY" className="font-bold py-4 px-6 text-amber-500/80 focus:bg-amber-500/10 focus:text-amber-500">Weekly</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                            </div>
                        </div>

                        <div className="space-y-4 group">
                            <Label htmlFor="template" className="text-sm font-bold uppercase text-white/60 tracking-widest block group-focus-within:text-amber-500 transition-colors">Start with Template (optional)</Label>
                            <div className="relative">
                                <Sparkles className="absolute left-6 top-1/2 -translate-y-1/2 h-6 w-6 text-white/10 pointer-events-none z-10 group-focus-within:text-amber-500/40 transition-colors" />
                                <Select value={selectedTemplate} onValueChange={setSelectedTemplate}>
                                    <SelectTrigger className="h-16 pl-16 rounded-2xl border-white/[0.05] bg-white/[0.02] text-white/70 font-bold text-sm">
                                        <SelectValue placeholder="Select a template" />
                                    </SelectTrigger>
                                    <SelectContent className="rounded-[2.5rem] border-white/10 bg-black/80 backdrop-blur-3xl p-4 shadow-2xl">
                                        <SelectItem value="none" className="font-bold py-4 px-6 text-white/70 focus:bg-white/5 focus:text-white">Blank (Manual Build)</SelectItem>
                                        {templates.map((t) => (
                                            <SelectItem key={t.id} value={t.id} className="font-bold py-4 px-6 text-amber-500/80 focus:bg-amber-500/10 focus:text-amber-500">
                                                {t.name}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>

                        <div className="space-y-4 group">
                            <Label htmlFor="description" className="text-sm font-bold uppercase text-white/60 tracking-widest block group-focus-within:text-amber-500 transition-colors">Description / Goal (optional)</Label>
                            <div className="relative">
                                <FileText className="absolute left-6 top-6 h-6 w-6 text-white/30 group-focus-within:text-amber-500/60 transition-colors" />
                                <Textarea
                                    id="description"
                                    name="description"
                                    placeholder="Notes about this service..."
                                    className="min-h-[160px] pl-16 pt-6 rounded-3xl border-white/[0.05] bg-white/[0.02] focus:bg-white/[0.05] focus-visible:ring-amber-500 transition-all font-medium text-white/80 resize-none text-lg leading-relaxed"
                                />
                            </div>
                        </div>
                    </CardContent>
                    <CardFooter className="p-16 bg-white/[0.01] border-t border-white/[0.03]">
                        <button
                            type="submit"
                            className="liquid-glass-button w-full h-20 text-xl tracking-tighter"
                            disabled={isLoading}
                        >
                            <span className="flex items-center justify-center gap-3">
                                {isLoading ? "Creating..." : (
                                    <>
                                        Create Service <Target className="h-6 w-6" />
                                    </>
                                )}
                            </span>
                        </button>
                    </CardFooter>
                </form>
            </Card>
        </div>
    );
}
