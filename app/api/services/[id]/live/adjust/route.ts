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
        const { seconds } = await request.json();

        if (typeof seconds !== "number") {
            return NextResponse.json({ message: "Seconds required" }, { status: 400 });
        }

        const service = await prisma.service.findUnique({
            where: { id },
            select: { current_item_id: true }
        });

        if (!service?.current_item_id) {
            return NextResponse.json({ message: "No active item" }, { status: 400 });
        }

        const item = await prisma.programItem.update({
            where: { id: service.current_item_id },
            data: {
                duration: { increment: seconds }
            }
        });

        return NextResponse.json(item);
    } catch (error: any) {
        return NextResponse.json({ message: error.message }, { status: 500 });
    }
}
