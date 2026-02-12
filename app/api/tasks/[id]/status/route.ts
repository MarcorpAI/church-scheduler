import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

export async function PATCH(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    const { id } = await params;
    const session = await auth();

    if (!session) {
        return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    try {
        const { status } = await request.json();

        const task = await prisma.task.findUnique({
            where: { id },
        });

        if (!task) {
            return NextResponse.json({ message: "Task not found" }, { status: 404 });
        }

        // Authorization check: Admin or assigned user
        if (session.user.role !== "ADMIN" && task.assigned_to !== session.user.id) {
            return NextResponse.json({ message: "Forbidden" }, { status: 403 });
        }

        const updatedTask = await prisma.task.update({
            where: { id },
            data: { status },
            include: {
                service: true
            }
        });

        // Notify admin about status changes
        const admins = await prisma.user.findMany({
            where: { role: "ADMIN" },
            select: { id: true }
        });

        for (const admin of admins) {
            await prisma.notification.create({
                data: {
                    user_id: admin.id,
                    type: "STATUS_CHANGE",
                    title: "Task Status Updated",
                    message: `Task "${updatedTask.title}" for ${updatedTask.service.name} is now ${status.replace("_", " ")}.`,
                    reference_id: updatedTask.service_id,
                }
            });
        }

        return NextResponse.json(updatedTask);
    } catch (error: any) {
        return NextResponse.json({ message: error.message }, { status: 500 });
    }
}
