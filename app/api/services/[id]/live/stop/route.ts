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

    const updated = await prisma.service.update({
        where: { id },
        data: {
            is_live: false,
            current_item_id: null,
            item_started_at: null,
            is_paused: false,
        },
    });

    return NextResponse.json(updated);
}
