import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
    const session = await auth();

    if (!session) {
        return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    try {
        const notifications = await prisma.notification.findMany({
            where: {
                user_id: session.user.id,
            },
            orderBy: {
                created_at: "desc",
            },
            take: 20,
        });

        return NextResponse.json(notifications);
    } catch (error: any) {
        return NextResponse.json({ message: error.message }, { status: 500 });
    }
}
