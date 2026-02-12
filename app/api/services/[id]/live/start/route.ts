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

    const firstItem = await prisma.programItem.findFirst({
        where: { service_id: id },
        orderBy: { order: "asc" },
    });

    if (!firstItem) {
        return NextResponse.json(
            { message: "No program items to go live with" },
            { status: 400 }
        );
    }

    const service = await prisma.service.update({
        where: { id },
        data: {
            is_live: true,
            current_item_id: firstItem.id,
            item_started_at: new Date(),
            is_paused: false,
        },
    });

    return NextResponse.json(service);
}
