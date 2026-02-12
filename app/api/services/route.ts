import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

export async function GET(request: Request) {
    const session = await auth();

    if (!session) {
        return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    // Get user's church
    const user = await prisma.user.findUnique({
        where: { id: session.user.id },
        select: { church_id: true }
    });

    if (!user?.church_id) {
        return NextResponse.json({ message: "No church associated" }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const from = searchParams.get("from");
    const to = searchParams.get("to");

    try {
        const services = await prisma.service.findMany({
            where: {
                church_id: user.church_id,
                date: {
                    gte: from ? new Date(from) : undefined,
                    lte: to ? new Date(to) : undefined,
                },
            },
            include: {
                _count: {
                    select: { items: true },
                },
            },
            orderBy: { date: "asc" },
        });

        return NextResponse.json(services);
    } catch (error: unknown) {
        const message = error instanceof Error ? error.message : "Unknown error";
        return NextResponse.json({ message }, { status: 500 });
    }
}

export async function POST(request: Request) {
    const session = await auth();

    if (!session || session.user.role !== "ADMIN") {
        return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    // Get user's church
    const user = await prisma.user.findUnique({
        where: { id: session.user.id },
        select: { church_id: true }
    });

    if (!user?.church_id) {
        return NextResponse.json({ message: "No church associated" }, { status: 403 });
    }

    try {
        const { name, description, date, recurrence } = await request.json();

        if (!name || !date) {
            return NextResponse.json(
                { message: "Name and date are required" },
                { status: 400 }
            );
        }

        const service = await prisma.service.create({
            data: {
                name,
                description,
                date: new Date(date),
                recurrence: recurrence || "NONE",
                church_id: user.church_id,
                created_by: session.user.id,
            },
        });

        return NextResponse.json(service, { status: 201 });
    } catch (error: unknown) {
        const message = error instanceof Error ? error.message : "Unknown error";
        return NextResponse.json({ message }, { status: 500 });
    }
}
