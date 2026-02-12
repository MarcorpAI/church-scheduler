import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

export async function POST(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    const { id } = await params;
    const session = await auth();

    if (!session || session.user.role !== "ADMIN") {
        return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const service = await prisma.service.findUnique({
        where: { id },
        select: { is_paused: true, is_live: true },
    });

    if (!service?.is_live) {
        return NextResponse.json({ message: "Service is not live" }, { status: 400 });
    }

    const updated = await prisma.service.update({
        where: { id },
        data: { is_paused: !service.is_paused },
    });

    return NextResponse.json(updated);
}
