import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";

// GET /api/churches - Get user's church
export async function GET() {
    const session = await auth();
    if (!session?.user?.id) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
        where: { id: session.user.id },
        include: { church: true }
    });

    if (!user?.church) {
        return NextResponse.json({ error: "No church found" }, { status: 404 });
    }

    return NextResponse.json(user.church);
}

// POST /api/churches - Create a new church (Admin only)
export async function POST(request: Request) {
    const session = await auth();
    if (!session?.user?.id) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { name } = await request.json();

    if (!name || name.trim() === "") {
        return NextResponse.json({ error: "Church name is required" }, { status: 400 });
    }

    // Create church and associate user as admin
    const church = await prisma.church.create({
        data: {
            name: name.trim(),
        }
    });

    // Update user to be admin of this church
    await prisma.user.update({
        where: { id: session.user.id },
        data: {
            church_id: church.id,
            role: "ADMIN"
        }
    });

    return NextResponse.json(church, { status: 201 });
}
