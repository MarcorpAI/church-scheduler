import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { Sparkles, ArrowRight, ShieldCheck, Users, Zap, Workflow, Fingerprint, Layers } from "lucide-react";
import PrismBackground from "./PrismBackground";

export default async function Home() {
  const session = await auth();

  if (session) {
    // Check if user has a church
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { church_id: true, role: true }
    });

    if (!user?.church_id) {
      redirect("/onboarding");
    }

    if (user.role === "ADMIN") {
      redirect("/dashboard");
    } else {
      redirect("/my-tasks");
    }
  }

  return (
    <div className="min-h-screen relative flex flex-col items-center justify-center p-6 text-center pt-48 pb-32">
      <div className="fixed inset-0 z-0">
        <PrismBackground />
      </div>

      <div className="relative z-10 max-w-5xl mx-auto space-y-16">
        {/* Animated Badge */}
        <div className="inline-flex items-center gap-2 px-6 py-2.5 rounded-full bg-white/[0.03] border border-white/[0.08] text-amber-500 text-[10px] font-black uppercase tracking-[0.3em] shadow-2xl backdrop-blur-md animate-pulse">
          <Sparkles className="h-4 w-4" />
          Ready for Sunday // Simple Church Scheduling
        </div>

        {/* Liquid Metallic Title */}
        <div className="space-y-4">
          <h1 className="text-8xl md:text-[10rem] serveflow-title transition-all duration-700 hover:scale-[1.02] cursor-default select-none" style={{ fontFamily: 'var(--font-young)' }}>
            Serve<span className="serveflow-gold">Flow</span>
          </h1>
          <p className="text-2xl md:text-3xl text-white/70 max-w-3xl mx-auto font-medium leading-relaxed tracking-tight">
            The easiest way to organize your church teams.
            Schedule volunteers and manage Sunday services with <span className="text-white font-bold">zero stress</span>.
          </p>
        </div>

        {/* Liquid Action Area */}
        <div className="flex flex-col md:flex-row gap-8 justify-center pt-8">
          <Link href="/login">
            <button className="liquid-glass-button group h-20 px-16 text-xl tracking-tighter shadow-[0_0_50px_rgba(255,255,255,0.05)]">
              <span className="relative z-10 flex items-center gap-3">
                Go to Dashboard <ArrowRight className="h-6 w-6 group-hover:translate-x-1 transition-transform" />
              </span>
            </button>
          </Link>
          <Link href="/signup">
            <button className="h-20 px-16 text-xl font-black text-white/60 hover:text-white transition-all duration-500 rounded-3xl hover:bg-white/[0.02]">
              Join the Team
            </button>
          </Link>
        </div>

        {/* Custom Sophisticated Features Section */}
        <div className="mt-48 space-y-32">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-24 items-center text-left">
            <div className="space-y-8">
              <div className="h-16 w-16 liquid-glass rounded-2xl flex items-center justify-center">
                <Workflow className="h-8 w-8 text-amber-500" />
              </div>
              <h3 className="text-4xl font-black tracking-tighter">Everything in One Place</h3>
              <p className="text-lg text-white/60 leading-relaxed font-medium">
                Ditch the messy spreadsheets. Our simple dashboard gives you a clear view of every service, ensuring every role is filled and every team is ready.
              </p>
              <ul className="space-y-4 pt-4">
                <li className="flex items-center gap-4 text-white/90 font-bold">
                  <div className="h-1.5 w-1.5 rounded-full bg-amber-500 shadow-[0_0_10px_rgba(245,158,11,0.5)]" />
                  Track Sunday Readiness
                </li>
                <li className="flex items-center gap-4 text-white/90 font-bold">
                  <div className="h-1.5 w-1.5 rounded-full bg-amber-500 shadow-[0_0_10px_rgba(245,158,11,0.5)]" />
                  Easy Task Assignments
                </li>
              </ul>
            </div>
            <div className="card-liquid group h-[400px] flex items-center justify-center">
              <div className="card-liquid-glow" />
              <div className="relative text-white/10 select-none">
                <Layers className="h-64 w-64" />
              </div>
              <div className="absolute inset-x-8 bottom-8 p-6 bg-white/[0.02] border border-white/[0.05] rounded-2xl backdrop-blur-3xl">
                <div className="h-2 w-32 bg-amber-500/20 rounded-full mb-3 overflow-hidden">
                  <div className="h-full w-2/3 bg-amber-500" />
                </div>
                <p className="text-[10px] font-black uppercase tracking-widest text-amber-500/80">Service Prep: 67%</p>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-24 items-center text-left md:flex-row-reverse">
            <div className="card-liquid group h-[400px] flex items-center justify-center md:order-first lg:order-last">
              <div className="card-liquid-glow" />
              <div className="relative text-white/10 select-none">
                <Fingerprint className="h-64 w-64" />
              </div>
              <div className="absolute inset-x-8 bottom-8 p-6 bg-white/[0.02] border border-white/[0.05] rounded-2xl backdrop-blur-3xl">
                <p className="text-[10px] font-black uppercase tracking-widest text-white/60 mb-2">Team Member Info</p>
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-full bg-white/5 border border-white/10" />
                  <div className="space-y-1.5">
                    <div className="h-2 w-24 bg-white/10 rounded-full" />
                    <div className="h-1.5 w-16 bg-white/5 rounded-full" />
                  </div>
                </div>
              </div>
            </div>
            <div className="space-y-8 lg:order-first">
              <div className="h-16 w-16 liquid-glass rounded-2xl flex items-center justify-center">
                <Users className="h-8 w-8 text-amber-500" />
              </div>
              <h3 className="text-4xl font-black tracking-tighter">Your Volunteers Will Love It</h3>
              <p className="text-lg text-white/60 leading-relaxed font-medium">
                No more confusing emails. Every volunteer gets a personalized list of their tasks and times, making it easy for them to serve with joy.
              </p>
              <ul className="space-y-4 pt-4">
                <li className="flex items-center gap-4 text-white/90 font-bold">
                  <div className="h-1.5 w-1.5 rounded-full bg-amber-500 shadow-[0_0_10px_rgba(245,158,11,0.5)]" />
                  Personal Task Lists
                </li>
                <li className="flex items-center gap-4 text-white/90 font-bold">
                  <div className="h-1.5 w-1.5 rounded-full bg-amber-500 shadow-[0_0_10px_rgba(245,158,11,0.5)]" />
                  Quick One-Tap Updates
                </li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
