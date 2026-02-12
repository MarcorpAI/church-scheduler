"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut, useSession } from "next-auth/react";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger
} from "@/components/ui/dropdown-menu";
import { LayoutDashboard, LogOut, User, Sparkles, FolderOpen } from "lucide-react";
import NotificationBell from "./NotificationBell";

export default function Navbar() {
    const pathname = usePathname();
    const { data: session } = useSession();

    // Hide navbar on live display pages
    if (pathname.startsWith("/live/")) return null;

    if (!session) return null;

    const isAdmin = session.user.role === "ADMIN";

    return (
        <nav className="fixed top-0 left-0 right-0 z-50 px-4 md:px-8 py-6">
            <div className="max-w-7xl mx-auto liquid-glass rounded-[2rem] h-20 flex items-center justify-between px-8 shadow-2xl">
                <div className="flex items-center gap-12">
                    <Link href="/" className="flex items-center gap-2 group">
                        <div className="h-10 w-10 bg-white/[0.05] rounded-xl flex items-center justify-center text-white shadow-xl group-hover:scale-110 transition-all duration-500 border border-white/10 group-hover:border-amber-500/50">
                            <Sparkles className="h-6 w-6 text-amber-500" />
                        </div>
                        <span className="text-2xl font-black tracking-tighter serveflow-title transition-all duration-500">
                            Serve<span className="serveflow-gold">Flow</span>
                        </span>
                    </Link>

                    <div className="hidden md:flex items-center gap-2">
                        {isAdmin && (
                            <>
                                <Link
                                    href="/dashboard"
                                    className={`flex items-center gap-2 px-6 py-2.5 text-sm font-black rounded-xl transition-all duration-300 ${pathname.startsWith("/dashboard") ? "bg-white/[0.08] text-white border border-white/10 shadow-lg" : "text-white/40 hover:text-white hover:bg-white/[0.03]"}`}
                                >
                                    <LayoutDashboard className="h-4 w-4" />
                                    Dashboard
                                </Link>
                                <Link
                                    href="/departments"
                                    className={`flex items-center gap-2 px-6 py-2.5 text-sm font-black rounded-xl transition-all duration-300 ${pathname.startsWith("/departments") ? "bg-white/[0.08] text-white border border-white/10 shadow-lg" : "text-white/40 hover:text-white hover:bg-white/[0.03]"}`}
                                >
                                    <FolderOpen className="h-4 w-4" />
                                    Departments
                                </Link>
                            </>
                        )}
                    </div>
                </div>

                <div className="flex items-center gap-6">
                    <NotificationBell />

                    <div className="h-8 w-[1px] bg-white/[0.05] mx-2 hidden md:block" />

                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <button className="relative h-12 w-12 rounded-full hover:scale-105 transition-transform duration-300 border-2 border-white/5 p-0.5 hover:border-amber-500/30">
                                <Avatar className="h-full w-full">
                                    <AvatarImage src={session.user.image || ""} alt={session.user.name || ""} />
                                    <AvatarFallback className="bg-white/5 text-amber-500 font-black">
                                        {session.user.name?.[0] || <User />}
                                    </AvatarFallback>
                                </Avatar>
                            </button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent className="w-72 mt-4 rounded-[2rem] shadow-2xl border-white/[0.05] bg-black/60 backdrop-blur-3xl p-2" align="end" forceMount>
                            <DropdownMenuLabel className="font-normal p-6 pt-8 pb-8">
                                <div className="flex flex-col space-y-2">
                                    <p className="text-lg font-black text-white leading-none tracking-tight">{session.user.name}</p>
                                    <p className="text-xs font-medium text-white/40 leading-none">
                                        {session.user.email}
                                    </p>
                                    <div className="mt-4 inline-flex items-center w-fit px-3 py-1 rounded-full bg-amber-500/10 text-[9px] font-black uppercase text-amber-500 tracking-[0.2em] border border-amber-500/20">
                                        {session.user.role}
                                    </div>
                                </div>
                            </DropdownMenuLabel>
                            <DropdownMenuSeparator className="bg-white/5" />
                            <DropdownMenuItem
                                onClick={() => signOut()}
                                className="p-4 text-red-400 focus:text-white focus:bg-red-500/20 cursor-pointer rounded-2xl mx-2 mb-2 group"
                            >
                                <LogOut className="mr-3 h-4 w-4 group-hover:translate-x-1 transition-transform" />
                                <span className="font-black text-sm tracking-tight">Log Out</span>
                            </DropdownMenuItem>
                        </DropdownMenuContent>
                    </DropdownMenu>
                </div>
            </div>
        </nav>
    );
}
