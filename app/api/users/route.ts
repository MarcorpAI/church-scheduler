import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
    const session = await auth();

    if (!session || session.user.role !== "ADMIN") {
        return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    // Get user's church
    const currentUser = await prisma.user.findUnique({
        where: { id: session.user.id },
        select: { church_id: true }
    });

    if (!currentUser?.church_id) {
        return NextResponse.json({ message: "No church associated" }, { status: 403 });
    }

    try {
        const users = await prisma.user.findMany({
            where: {
                church_id: currentUser.church_id
            },
            select: {
                id: true,
                name: true,
                email: true,
                image: true,
                role: true,
            },
            orderBy: { name: "asc" },
        });

        return NextResponse.json(users);
    } catch (error: unknown) {
        const message = error instanceof Error ? error.message : "Unknown error";
        return NextResponse.json({ message }, { status: 500 });
    }
}
