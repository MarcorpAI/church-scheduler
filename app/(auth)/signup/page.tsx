"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import Link from "next/link";
import { toast } from "sonner";
import { Sparkles, ArrowRight, User, Mail, Lock, Shield, Target } from "lucide-react";

export default function SignupPage() {
    const router = useRouter();
    const [isLoading, setIsLoading] = useState(false);

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        setIsLoading(true);

        const formData = new FormData(e.currentTarget);
        const name = formData.get("name") as string;
        const email = formData.get("email") as string;
        const password = formData.get("password") as string;
        const role = formData.get("role") as string;

        try {
            const res = await fetch("/api/auth/signup", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ name, email, password, role }),
            });

            const data = await res.json();

            if (!res.ok) {
                throw new Error(data.message || "Registration conflict");
            }

            toast.success("Identity Registered", {
                description: "Your protocol presence is now active."
            });
            router.push("/login");
        } catch (error: any) {
            toast.error(error.message || "Ecosystem registration failed");
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center px-4 py-12 relative overflow-hidden">

            <div className="w-full max-w-xl card-liquid group border-white/[0.05] shadow-[0_0_100px_rgba(0,0,0,0.5)] relative z-10">
                <div className="card-liquid-glow" />

                <CardHeader className="space-y-10 pt-12 pb-10 text-center relative z-10">
                    <div className="flex justify-center">
                        <Link href="/" className="flex items-center gap-3 group">
                            <div className="h-16 w-16 bg-white/[0.05] rounded-2xl flex items-center justify-center border border-white/10 group-hover:border-amber-500/50 group-hover:scale-110 transition-all duration-700">
                                <Sparkles className="h-8 w-8 text-amber-500" />
                            </div>
                        </Link>
                    </div>

                    <div className="space-y-4">
                        <CardTitle className="text-6xl font-black tracking-tighter leading-none serveflow-title">
                            Sign<span className="serveflow-gold">Flow</span>
                        </CardTitle>
                        <p className="text-white/30 font-black uppercase text-[10px] tracking-[0.4em]">
                            Initialize Identity // Ecosystem Entry
                        </p>
                    </div>
                </CardHeader>

                <form onSubmit={handleSubmit} className="relative z-10">
                    <CardContent className="space-y-10 px-12">
                        <div className="space-y-4 group">
                            <Label htmlFor="name" className="text-[10px] font-black uppercase text-white/20 tracking-[0.3em] group-focus-within:text-amber-500 transition-colors">Public Identifier</Label>
                            <div className="relative">
                                <User className="absolute left-6 top-1/2 -translate-y-1/2 h-5 w-5 text-white/10 group-focus-within:text-amber-500/40 transition-colors" />
                                <Input
                                    id="name"
                                    name="name"
                                    placeholder="ALEX JOHNSON"
                                    required
                                    className="h-16 pl-16 rounded-2xl border-white/[0.05] bg-white/[0.02] focus:bg-white/[0.05] focus-visible:ring-amber-500 transition-all font-black uppercase tracking-widest text-xs"
                                />
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                            <div className="space-y-4 group">
                                <Label htmlFor="email" className="text-[10px] font-black uppercase text-white/20 tracking-[0.3em] group-focus-within:text-amber-500 transition-colors">Communication Link</Label>
                                <div className="relative">
                                    <Mail className="absolute left-6 top-1/2 -translate-y-1/2 h-5 w-5 text-white/10 group-focus-within:text-amber-500/40 transition-colors" />
                                    <Input
                                        id="email"
                                        name="email"
                                        type="email"
                                        placeholder="EMAIL@DOMAIN.COM"
                                        required
                                        className="h-16 pl-16 rounded-2xl border-white/[0.05] bg-white/[0.02] focus:bg-white/[0.05] focus-visible:ring-amber-500 transition-all font-black uppercase tracking-widest text-xs"
                                    />
                                </div>
                            </div>
                            <div className="space-y-4 group">
                                <Label htmlFor="password" className="text-[10px] font-black uppercase text-white/20 tracking-[0.3em] group-focus-within:text-amber-500 transition-colors">Credential Key</Label>
                                <div className="relative">
                                    <Lock className="absolute left-6 top-1/2 -translate-y-1/2 h-5 w-5 text-white/10 group-focus-within:text-amber-500/40 transition-colors" />
                                    <Input
                                        id="password"
                                        name="password"
                                        type="password"
                                        required
                                        className="h-16 pl-16 rounded-2xl border-white/[0.05] bg-white/[0.02] focus:bg-white/[0.05] focus-visible:ring-amber-500 transition-all font-black text-xs"
                                    />
                                </div>
                            </div>
                        </div>

                        <div className="space-y-6 pt-4">
                            <Label className="text-[10px] font-black uppercase text-white/20 tracking-[0.3em] block mb-4">Functional Role Protocol</Label>
                            <div className="grid grid-cols-2 gap-6">
                                <label className="relative cursor-pointer group/role">
                                    <input type="radio" name="role" value="VOLUNTEER" defaultChecked className="peer sr-only" />
                                    <div className="h-28 flex flex-col items-center justify-center rounded-[2rem] border-2 border-white/[0.05] bg-white/[0.02] p-4 text-white/20 transition-all hover:bg-white/[0.05] peer-checked:border-amber-500/50 peer-checked:bg-amber-500/10 peer-checked:text-amber-500 shadow-2xl">
                                        <User className="h-8 w-8 mb-2" />
                                        <span className="text-[10px] font-black uppercase tracking-[0.2em]">Volunteer</span>
                                    </div>
                                </label>
                                <label className="relative cursor-pointer group/role">
                                    <input type="radio" name="role" value="ADMIN" className="peer sr-only" />
                                    <div className="h-28 flex flex-col items-center justify-center rounded-[2rem] border-2 border-white/[0.05] bg-white/[0.02] p-4 text-white/20 transition-all hover:bg-white/10 peer-checked:border-white peer-checked:bg-white peer-checked:text-black shadow-2xl">
                                        <Shield className="h-8 w-8 mb-2" />
                                        <span className="text-[10px] font-black uppercase tracking-[0.2em]">Admin</span>
                                    </div>
                                </label>
                            </div>
                        </div>
                    </CardContent>

                    <CardFooter className="flex flex-col gap-8 pt-12 pb-16 px-12">
                        <button
                            type="submit"
                            className="liquid-glass-button w-full h-20 text-xl tracking-tighter shadow-2xl"
                            disabled={isLoading}
                        >
                            <span className="flex items-center justify-center gap-3">
                                {isLoading ? "Synchronizing..." : (
                                    <>
                                        Initialize Account <Target className="h-6 w-6" />
                                    </>
                                )}
                            </span>
                        </button>
                        <p className="text-sm font-bold text-white/20">
                            Already registered?{" "}
                            <Link href="/login" className="text-amber-500 font-black hover:underline underline-offset-8 decoration-2 hover:text-white transition-all">
                                Access Connection
                            </Link>
                        </p>
                    </CardFooter>
                </form>
            </div>
        </div>
    );
}
