import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

export async function PUT(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    await params; // consume params
    const session = await auth();

    if (!session || session.user.role !== "ADMIN") {
        return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const items: { id: string; order: number }[] = await request.json();

    if (!Array.isArray(items)) {
        return NextResponse.json(
            { message: "Expected array of {id, order}" },
            { status: 400 }
        );
    }

    await prisma.$transaction(
        items.map((item) =>
            prisma.programItem.update({
                where: { id: item.id },
                data: { order: item.order },
            })
        )
    );

    return NextResponse.json({ message: "Reordered" });
}
