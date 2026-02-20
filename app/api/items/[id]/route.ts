import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

export async function PUT(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    const { id } = await params;
    const session = await auth();

    if (!session || session.user.role !== "ADMIN") {
        return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const data = await request.json();

    try {
        const item = await prisma.programItem.update({
            where: { id },
            data: {
                title: data.title,
                description: data.description !== undefined ? (data.description || null) : undefined,
                duration: data.duration != null ? Number(data.duration) : undefined,
                department_id: data.department_id !== undefined ? (data.department_id || null) : undefined,
            },
            include: { department: true },
        });

        return NextResponse.json(item);
    } catch (error: unknown) {
        const message = error instanceof Error ? error.message : "Unknown error";
        return NextResponse.json({ message }, { status: 500 });
    }
}

export async function DELETE(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    const { id } = await params;
    const session = await auth();

    if (!session || session.user.role !== "ADMIN") {
        return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    try {
        await prisma.programItem.delete({ where: { id } });
        return NextResponse.json({ message: "Item deleted" });
    } catch (error: unknown) {
        const message = error instanceof Error ? error.message : "Unknown error";
        return NextResponse.json({ message }, { status: 500 });
    }
}
