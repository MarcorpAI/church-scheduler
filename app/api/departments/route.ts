import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
    const session = await auth();

    if (!session) {
        return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
        where: { id: session.user.id },
        select: { church_id: true },
    });

    if (!user?.church_id) {
        return NextResponse.json({ message: "No church associated" }, { status: 403 });
    }

    const departments = await prisma.department.findMany({
        where: { church_id: user.church_id },
        orderBy: { name: "asc" },
    });

    return NextResponse.json(departments);
}

export async function POST(request: Request) {
    const session = await auth();

    if (!session || session.user.role !== "ADMIN") {
        return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
        where: { id: session.user.id },
        select: { church_id: true },
    });

    if (!user?.church_id) {
        return NextResponse.json({ message: "No church associated" }, { status: 403 });
    }

    const { name } = await request.json();

    if (!name) {
        return NextResponse.json({ message: "Name is required" }, { status: 400 });
    }

    const department = await prisma.department.create({
        data: {
            name,
            church_id: user.church_id,
        },
    });

    return NextResponse.json(department, { status: 201 });
}
