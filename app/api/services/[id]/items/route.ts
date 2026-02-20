import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

export async function GET(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    const { id } = await params;
    const session = await auth();

    if (!session) {
        return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const items = await prisma.programItem.findMany({
        where: { service_id: id },
        include: { department: true },
        orderBy: { order: "asc" },
    });

    return NextResponse.json(items);
}

export async function POST(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    const { id } = await params;
    const session = await auth();

    if (!session || session.user.role !== "ADMIN") {
        return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const { title, description, duration, department_id } = await request.json();

    if (!title || duration == null) {
        return NextResponse.json(
            { message: "Title and duration are required" },
            { status: 400 }
        );
    }

    // Get next order number
    const maxOrder = await prisma.programItem.aggregate({
        where: { service_id: id },
        _max: { order: true },
    });

    const item = await prisma.programItem.create({
        data: {
            title,
            description: description || null,
            duration: Number(duration),
            order: (maxOrder._max.order ?? -1) + 1,
            service_id: id,
            department_id: department_id || null,
        },
        include: { department: true },
    });

    return NextResponse.json(item, { status: 201 });
}
