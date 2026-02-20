import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// Public endpoint — no auth required (for display screens)
export async function GET(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    const { id } = await params;

    const service = await prisma.service.findUnique({
        where: { id },
        select: {
            id: true,
            name: true,
            is_live: true,
            is_paused: true,
            advance_mode: true,
            buffer_time: true,
            current_item_id: true,
            item_started_at: true,
            items: {
                include: { department: true },
                orderBy: { order: "asc" },
            },
        },
    });

    if (!service) {
        return NextResponse.json({ message: "Service not found" }, { status: 404 });
    }

    const currentItem = service.items.find((i) => i.id === service.current_item_id) || null;
    const currentIndex = currentItem ? service.items.findIndex((i) => i.id === currentItem.id) : -1;
    const nextItem = currentIndex >= 0 && currentIndex < service.items.length - 1
        ? service.items[currentIndex + 1]
        : null;

    return NextResponse.json({
        id: service.id,
        name: service.name,
        is_live: service.is_live,
        is_paused: service.is_paused,
        advance_mode: service.advance_mode,
        buffer_time: service.buffer_time,
        item_started_at: service.item_started_at,
        current_item: currentItem,
        next_item: nextItem,
        items: service.items,
        total_items: service.items.length,
        current_index: currentIndex,
    });
}
