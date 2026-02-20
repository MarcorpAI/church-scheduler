"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import Link from "next/link";
import { toast } from "sonner";
import { Sparkles, ArrowRight, Lock, Mail, Fingerprint } from "lucide-react";

export default function LoginPage() {
    const router = useRouter();
    const [isLoading, setIsLoading] = useState(false);

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        setIsLoading(true);

        const formData = new FormData(e.currentTarget);
        const email = formData.get("email") as string;
        const password = formData.get("password") as string;

        try {
            const result = await signIn("credentials", {
                email,
                password,
                redirect: false,
            });

            if (result?.error) {
                toast.error("Identity Recognition Failed", {
                    description: "Verify your protocol coordinates and re-initiate."
                });
            } else {
                toast.success("Identity Verified", {
                    description: "Synergetic connection established."
                });
                router.push("/");
                router.refresh();
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
                        <CardTitle className="text-6xl font-black tracking-tighter leading-none serveflow-title">
                            Login<span className="serveflow-gold">Flow</span>
                        </CardTitle>
                        <p className="text-white/30 font-black uppercase text-[10px] tracking-[0.4em]">
                            Protocol Verification // Secure Layer
                        </p>
                    </div>
                </CardHeader>

                <form onSubmit={handleSubmit} className="relative z-10">
                    <CardContent className="space-y-10 px-12">
                        <div className="space-y-4 group">
                            <Label htmlFor="email" className="text-[10px] font-black uppercase text-white/20 tracking-[0.3em] group-focus-within:text-amber-500 transition-colors">Identity Primary</Label>
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
                            <div className="flex justify-end pt-2">
                                <Link
                                    href="/forgot-password"
                                    className="text-[10px] font-black uppercase text-white/20 hover:text-amber-500 tracking-[0.2em] transition-colors"
                                >
                                    Lost Credential?
                                </Link>
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
                                {isLoading ? "Verifying..." : (
                                    <>
                                        Initiate Connection <Fingerprint className="h-6 w-6" />
                                    </>
                                )}
                            </span>
                        </button>
                        <p className="text-sm font-bold text-white/20">
                            New to the ecosystem?{" "}
                            <Link href="/signup" className="text-amber-500 font-black hover:underline underline-offset-8 decoration-2 hover:text-white transition-all">
                                Create Identity
                            </Link>
                        </p>
                    </CardFooter>
                </form>
            </div>
        </div>
    );
}
