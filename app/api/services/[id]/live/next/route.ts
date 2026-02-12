import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

export async function POST(
    _request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    const { id } = await params;
    const session = await auth();

    if (!session || session.user.role !== "ADMIN") {
        return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const service = await prisma.service.findUnique({
        where: { id },
        select: { current_item_id: true, is_live: true },
    });

    if (!service?.is_live || !service.current_item_id) {
        return NextResponse.json({ message: "Service is not live" }, { status: 400 });
    }

    // Get current item to find its order
    const currentItem = await prisma.programItem.findUnique({
        where: { id: service.current_item_id },
        select: { order: true },
    });

    if (!currentItem) {
        return NextResponse.json({ message: "Current item not found" }, { status: 400 });
    }

    // Find next item by order
    const nextItem = await prisma.programItem.findFirst({
        where: {
            service_id: id,
            order: { gt: currentItem.order },
        },
        orderBy: { order: "asc" },
    });

    if (!nextItem) {
        // Last item — end the service
        const updated = await prisma.service.update({
            where: { id },
            data: {
                is_live: false,
                current_item_id: null,
                item_started_at: null,
                is_paused: false,
            },
        });
        return NextResponse.json({ ...updated, ended: true });
    }

    const updated = await prisma.service.update({
        where: { id },
        data: {
            current_item_id: nextItem.id,
            item_started_at: new Date(),
            is_paused: false,
        },
    });

    return NextResponse.json(updated);
}
