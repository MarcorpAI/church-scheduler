"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { CardHeader, CardTitle, CardContent, CardFooter } from "@/components/ui/card";
import Link from "next/link";
import { toast } from "sonner";
import { Sparkles, Mail, ArrowLeft, KeyRound } from "lucide-react";

export default function ForgotPasswordPage() {
    const [isLoading, setIsLoading] = useState(false);
    const [isSubmitted, setIsSubmitted] = useState(false);

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        setIsLoading(true);

        const formData = new FormData(e.currentTarget);
        const email = formData.get("email") as string;

        try {
            const response = await fetch("/api/auth/forgot-password", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ email }),
            });

            if (response.ok) {
                setIsSubmitted(true);
                toast.success("Protocol Initiated", {
                    description: "Recovery instructions dispatched to your coordinate."
                });
            } else {
                const data = await response.json();
                toast.error("Transmission Error", {
                    description: data.message || "Failed to initiate recovery."
                });
            }
        } catch (error) {
            toast.error("Auth Core Critical Error");
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center px-4 py-12 relative overflow-hidden">
            <div className="w-full max-w-lg card-liquid group border-white/[0.05] shadow-[0_0_100px_rgba(0,0,0,0.5)] relative z-10">
                <div className="card-liquid-glow" />

                <CardHeader className="space-y-10 pt-12 pb-12 text-center relative z-10">
                    <div className="flex justify-center">
                        <Link href="/" className="flex items-center gap-3 group">
                            <div className="h-16 w-16 bg-white/[0.05] rounded-2xl flex items-center justify-center border border-white/10 group-hover:border-amber-500/50 group-hover:scale-110 transition-all duration-700">
                                <Sparkles className="h-8 w-8 text-amber-500" />
                            </div>
                        </Link>
                    </div>

                    <div className="space-y-4">
                        <CardTitle className="text-5xl font-black tracking-tighter leading-none serveflow-title">
                            Recovery<span className="serveflow-gold">Flow</span>
                        </CardTitle>
                        <p className="text-white/30 font-black uppercase text-[10px] tracking-[0.4em]">
                            Identity Restoration // Secure Layer
                        </p>
                    </div>
                </CardHeader>

                {!isSubmitted ? (
                    <form onSubmit={handleSubmit} className="relative z-10">
                        <CardContent className="space-y-10 px-12">
                            <div className="space-y-4 group">
                                <Label htmlFor="email" className="text-[10px] font-black uppercase text-white/20 tracking-[0.3em] group-focus-within:text-amber-500 transition-colors">Identity Primary (Email)</Label>
                                <div className="relative">
                                    <Mail className="absolute left-6 top-1/2 -translate-y-1/2 h-5 w-5 text-white/10 group-focus-within:text-amber-500/40 transition-colors" />
                                    <Input
                                        id="email"
                                        name="email"
                                        type="email"
                                        placeholder="IDENTITY@COORDINATE.COM"
                                        required
                                        className="h-16 pl-16 rounded-2xl border-white/[0.05] bg-white/[0.02] focus:bg-white/[0.05] focus-visible:ring-amber-500 transition-all font-black uppercase tracking-widest text-xs"
                                    />
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
                                    {isLoading ? "Transmitting..." : (
                                        <>
                                            Request Reset Token <KeyRound className="h-6 w-6" />
                                        </>
                                    )}
                                </span>
                            </button>
                            <Link href="/login" className="flex items-center gap-2 text-sm font-bold text-white/20 hover:text-amber-500 transition-colors">
                                <ArrowLeft className="h-4 w-4" /> Return to Login
                            </Link>
                        </CardFooter>
                    </form>
                ) : (
                    <CardContent className="px-12 py-16 text-center space-y-8 relative z-10">
                        <div className="flex justify-center">
                            <div className="h-20 w-20 bg-amber-500/10 rounded-full flex items-center justify-center border border-amber-500/20">
                                <Mail className="h-10 w-10 text-amber-500" />
                            </div>
                        </div>
                        <div className="space-y-4">
                            <h3 className="text-2xl font-black tracking-tight text-white">Transmission Successful</h3>
                            <p className="text-white/40 text-sm leading-relaxed">
                                If an account exists with this email, a reset link has been dispatched to your coordinate. Please check your inbox and follow the instructions to restore identity access.
                            </p>
                        </div>
                        <Button asChild variant="ghost" className="text-amber-500 hover:text-white hover:bg-white/5 font-black uppercase tracking-widest text-xs h-14 px-8 rounded-xl border border-white/5 hover:border-amber-500/20">
                            <Link href="/login">Return to Login</Link>
                        </Button>
                    </CardContent>
                )}
            </div>
        </div>
    );
}
