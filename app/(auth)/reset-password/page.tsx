"use client";

import { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { CardHeader, CardTitle, CardContent, CardFooter } from "@/components/ui/card";
import Link from "next/link";
import { toast } from "sonner";
import { Sparkles, Lock, ShieldCheck, ArrowRight, Eye, EyeOff } from "lucide-react";

function ResetPasswordForm() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const token = searchParams.get("token");

    const [isLoading, setIsLoading] = useState(false);
    const [showPassword, setShowPassword] = useState(false);
    const [password, setPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");

    useEffect(() => {
        if (!token) {
            toast.error("Invalid Request", {
                description: "Recovery token is missing. Please re-initiate the flow."
            });
            router.push("/forgot-password");
        }
    }, [token, router]);

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();

        if (password !== confirmPassword) {
            toast.error("Parity Error", {
                description: "Verification keys do not match."
            });
            return;
        }

        if (password.length < 8) {
            toast.error("Complexity Error", {
                description: "Credential key must be at least 8 units in length."
            });
            return;
        }

        setIsLoading(true);

        try {
            const response = await fetch("/api/auth/reset-password", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ token, password }),
            });

            if (response.ok) {
                toast.success("Identity Restored", {
                    description: "Credential key updated successfully. Re-initiating login flow."
                });
                router.push("/login");
            } else {
                const data = await response.json();
                toast.error("Restoration Failed", {
                    description: data.message || "Failed to reset password."
                });
            }
        } catch (error) {
            toast.error("Auth Core Critical Error");
        } finally {
            setIsLoading(false);
        }
    };

    if (!token) return null;

    return (
        <form onSubmit={handleSubmit} className="relative z-10">
            <CardContent className="space-y-10 px-12">
                <div className="space-y-4 group">
                    <Label htmlFor="password" className="text-[10px] font-black uppercase text-white/20 tracking-[0.3em] group-focus-within:text-amber-500 transition-colors">New Credential Key</Label>
                    <div className="relative">
                        <Lock className="absolute left-6 top-1/2 -translate-y-1/2 h-5 w-5 text-white/10 group-focus-within:text-amber-500/40 transition-colors" />
                        <Input
                            id="password"
                            type={showPassword ? "text" : "password"}
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            required
                            className="h-16 pl-16 pr-16 rounded-2xl border-white/[0.05] bg-white/[0.02] focus:bg-white/[0.05] focus-visible:ring-amber-500 transition-all font-black text-xs"
                        />
                        <button
                            type="button"
                            onClick={() => setShowPassword(!showPassword)}
                            className="absolute right-6 top-1/2 -translate-y-1/2 text-white/20 hover:text-white transition-colors"
                        >
                            {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                        </button>
                    </div>
                </div>

                <div className="space-y-4 group">
                    <Label htmlFor="confirmPassword" className="text-[10px] font-black uppercase text-white/20 tracking-[0.3em] group-focus-within:text-amber-500 transition-colors">Confirm Key Parity</Label>
                    <div className="relative">
                        <ShieldCheck className="absolute left-6 top-1/2 -translate-y-1/2 h-5 w-5 text-white/10 group-focus-within:text-amber-500/40 transition-colors" />
                        <Input
                            id="confirmPassword"
                            type={showPassword ? "text" : "password"}
                            value={confirmPassword}
                            onChange={(e) => setConfirmPassword(e.target.value)}
                            required
                            className="h-16 pl-16 rounded-2xl border-white/[0.05] bg-white/[0.02] focus:bg-white/[0.05] focus-visible:ring-amber-500 transition-all font-black text-xs"
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
                        {isLoading ? "Restoring..." : (
                            <>
                                Finalize Restoration <ArrowRight className="h-6 w-6" />
                            </>
                        )}
                    </span>
                </button>
            </CardFooter>
        </form>
    );
}

export default function ResetPasswordPage() {
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
                            Restore<span className="serveflow-gold">Flow</span>
                        </CardTitle>
                        <p className="text-white/30 font-black uppercase text-[10px] tracking-[0.4em]">
                            Credential Re-Initialization // Secure Layer
                        </p>
                    </div>
                </CardHeader>

                <Suspense fallback={<div className="px-12 py-16 text-center text-white/40">Initializing Recovery Protocol...</div>}>
                    <ResetPasswordForm />
                </Suspense>
            </div>
        </div>
    );
}
