"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import { Church, Users, Sparkles, ArrowRight, Key } from "lucide-react";

export default function OnboardingPage() {
    const router = useRouter();
    const { update } = useSession();
    const [churchName, setChurchName] = useState("");
    const [inviteCode, setInviteCode] = useState("");
    const [isLoading, setIsLoading] = useState(false);

    const handleCreateChurch = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!churchName.trim()) {
            toast.error("Please enter a church name");
            return;
        }

        setIsLoading(true);
        try {
            const res = await fetch("/api/churches", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ name: churchName })
            });

            if (!res.ok) {
                const data = await res.json();
                throw new Error(data.error || "Failed to create church");
            }

            const church = await res.json();
            // Force JWT refresh so role updates to ADMIN
            await update({ refreshRole: true });
            toast.success(`Church "${church.name}" created! Your invite code: ${church.invite_code}`);
            // Full page load so the browser picks up the fresh JWT with ADMIN role
            window.location.href = "/dashboard";
        } catch (error: unknown) {
            toast.error(error instanceof Error ? error.message : "Something went wrong");
        } finally {
            setIsLoading(false);
        }
    };

    const handleJoinChurch = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!inviteCode.trim()) {
            toast.error("Please enter an invite code");
            return;
        }

        setIsLoading(true);
        try {
            const res = await fetch("/api/churches/join", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ inviteCode })
            });

            if (!res.ok) {
                const data = await res.json();
                throw new Error(data.error || "Failed to join church");
            }

            toast.success("Successfully joined the church!");
            router.push("/my-tasks");
        } catch (error: unknown) {
            toast.error(error instanceof Error ? error.message : "Something went wrong");
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center p-8">
            <div className="w-full max-w-2xl space-y-8">
                {/* Header */}
                <div className="text-center space-y-4">
                    <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/[0.03] border border-white/[0.08] text-amber-500 text-[10px] font-black uppercase tracking-[0.3em]">
                        <Sparkles className="h-4 w-4" />
                        Welcome to ServeFlow
                    </div>
                    <h1 className="text-5xl font-black tracking-tighter serveflow-title" style={{ fontFamily: 'var(--font-young)' }}>
                        Get <span className="serveflow-gold">Started</span>
                    </h1>
                    <p className="text-white/60 text-lg max-w-md mx-auto">
                        Create a new church or join an existing one with an invite code.
                    </p>
                </div>

                {/* Tabs */}
                <Tabs defaultValue="create" className="w-full">
                    <TabsList className="grid w-full grid-cols-2 h-16 rounded-2xl bg-white/[0.03] border border-white/[0.08] p-2">
                        <TabsTrigger value="create" className="rounded-xl h-full text-lg font-black data-[state=active]:bg-white/[0.08] data-[state=active]:text-white text-white/40">
                            <Church className="h-5 w-5 mr-2" />
                            Create Church
                        </TabsTrigger>
                        <TabsTrigger value="join" className="rounded-xl h-full text-lg font-black data-[state=active]:bg-white/[0.08] data-[state=active]:text-white text-white/40">
                            <Users className="h-5 w-5 mr-2" />
                            Join Church
                        </TabsTrigger>
                    </TabsList>

                    <TabsContent value="create" className="mt-8">
                        <Card className="liquid-glass border-white/5 rounded-[2rem]">
                            <CardHeader className="p-8 pb-4">
                                <CardTitle className="text-2xl font-black text-white">Create Your Church</CardTitle>
                                <CardDescription className="text-white/60">
                                    Set up a new church organization. You will be the admin.
                                </CardDescription>
                            </CardHeader>
                            <CardContent className="p-8 pt-4">
                                <form onSubmit={handleCreateChurch} className="space-y-6">
                                    <div className="space-y-2">
                                        <Label htmlFor="churchName" className="text-white/80 font-bold">Church Name</Label>
                                        <Input
                                            id="churchName"
                                            placeholder="e.g., Grace Community Church"
                                            value={churchName}
                                            onChange={(e) => setChurchName(e.target.value)}
                                            className="h-14 rounded-xl bg-white/[0.03] border-white/10 text-white placeholder:text-white/30 focus:border-amber-500/50"
                                        />
                                    </div>
                                    <Button
                                        type="submit"
                                        disabled={isLoading}
                                        className="w-full h-14 rounded-xl bg-amber-500 hover:bg-amber-400 text-black font-black text-lg"
                                    >
                                        {isLoading ? "Creating..." : "Create Church"}
                                        <ArrowRight className="ml-2 h-5 w-5" />
                                    </Button>
                                </form>
                            </CardContent>
                        </Card>
                    </TabsContent>

                    <TabsContent value="join" className="mt-8">
                        <Card className="liquid-glass border-white/5 rounded-[2rem]">
                            <CardHeader className="p-8 pb-4">
                                <CardTitle className="text-2xl font-black text-white">Join a Church</CardTitle>
                                <CardDescription className="text-white/60">
                                    Enter the invite code shared by your church admin.
                                </CardDescription>
                            </CardHeader>
                            <CardContent className="p-8 pt-4">
                                <form onSubmit={handleJoinChurch} className="space-y-6">
                                    <div className="space-y-2">
                                        <Label htmlFor="inviteCode" className="text-white/80 font-bold">Invite Code</Label>
                                        <div className="relative">
                                            <Key className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-white/30" />
                                            <Input
                                                id="inviteCode"
                                                placeholder="Paste your invite code here"
                                                value={inviteCode}
                                                onChange={(e) => setInviteCode(e.target.value)}
                                                className="h-14 pl-12 rounded-xl bg-white/[0.03] border-white/10 text-white placeholder:text-white/30 focus:border-amber-500/50"
                                            />
                                        </div>
                                    </div>
                                    <Button
                                        type="submit"
                                        disabled={isLoading}
                                        className="w-full h-14 rounded-xl bg-white/[0.08] hover:bg-white/[0.12] text-white font-black text-lg border border-white/10"
                                    >
                                        {isLoading ? "Joining..." : "Join Church"}
                                        <ArrowRight className="ml-2 h-5 w-5" />
                                    </Button>
                                </form>
                            </CardContent>
                        </Card>
                    </TabsContent>
                </Tabs>
            </div>
        </div>
    );
}
