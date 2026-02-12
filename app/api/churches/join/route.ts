import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";

// POST /api/churches/join - Join a church using invite code
export async function POST(request: Request) {
    const session = await auth();
    if (!session?.user?.id) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { inviteCode } = await request.json();

    if (!inviteCode || inviteCode.trim() === "") {
        return NextResponse.json({ error: "Invite code is required" }, { status: 400 });
    }

    // Find church by invite code
    const church = await prisma.church.findUnique({
        where: { invite_code: inviteCode.trim() }
    });

    if (!church) {
        return NextResponse.json({ error: "Invalid invite code" }, { status: 404 });
    }

    // Check if user already belongs to a church
    const user = await prisma.user.findUnique({
        where: { id: session.user.id }
    });

    if (user?.church_id) {
        return NextResponse.json({ error: "You already belong to a church" }, { status: 400 });
    }

    // Join the church as volunteer
    await prisma.user.update({
        where: { id: session.user.id },
        data: {
            church_id: church.id,
            role: "VOLUNTEER"
        }
    });

    return NextResponse.json({ message: "Successfully joined church", church });
}
