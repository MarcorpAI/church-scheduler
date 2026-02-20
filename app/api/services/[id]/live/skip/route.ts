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

    try {
        const { itemId } = await request.json();

        if (!itemId) {
            return NextResponse.json({ message: "Item ID required" }, { status: 400 });
        }

        const service = await prisma.service.update({
            where: { id },
            data: {
                current_item_id: itemId,
                item_started_at: new Date(),
                is_paused: false,
            }
        });

        return NextResponse.json(service);
    } catch (error: any) {
        return NextResponse.json({ message: error.message }, { status: 500 });
    }
}
