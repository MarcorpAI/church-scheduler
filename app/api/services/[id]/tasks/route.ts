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
        const { title, description, assigned_to, due_time } = await request.json();

        if (!title) {
            return NextResponse.json(
                { message: "Title is required" },
                { status: 400 }
            );
        }

        const task = await prisma.task.create({
            data: {
                title,
                description,
                service_id: id,
                assigned_to: assigned_to || null,
                due_time: due_time ? new Date(due_time) : null,
            },
            include: {
                service: true
            }
        });

        // Create notification if assigned
        if (assigned_to) {
            await prisma.notification.create({
                data: {
                    user_id: assigned_to,
                    type: "TASK_ASSIGNED",
                    title: "New Task Assigned",
                    message: `You have been assigned to "${title}" for ${task.service.name}.`,
                    reference_id: id,
                }
            });
        }

        return NextResponse.json(task, { status: 201 });
    } catch (error: any) {
        return NextResponse.json({ message: error.message }, { status: 500 });
    }
}
